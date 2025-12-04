-- Enable UUID extension if not enabled
create extension if not exists "uuid-ossp";

-- Clients Table
create table if not exists public.clients (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  nome text not null,
  cnpj text,
  tipo_servico text,
  horas_contratadas numeric,
  contrato_id text,
  data_inicio date,
  data_conclusao date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Reports Table
create table if not exists public.reports (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  client_id uuid references public.clients(id) on delete set null,
  project_ids uuid[], -- Array of project IDs included in the report
  start_date date not null,
  end_date date not null,
  status text check (status in ('active', 'archived')) default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Report Shares Table (for public access)
create table if not exists public.report_shares (
  id uuid default uuid_generate_v4() primary key,
  report_id uuid references public.reports(id) on delete cascade not null,
  email text not null,
  access_code text not null,
  expires_at timestamp with time zone not null,
  last_access timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add client_id to Projects (Alter existing table)
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'projects' and column_name = 'client_id') then
    alter table public.projects add column client_id uuid references public.clients(id) on delete set null;
  end if;
end $$;

-- RLS Policies

alter table public.clients enable row level security;
alter table public.reports enable row level security;
alter table public.report_shares enable row level security;

-- Clients Policies
create policy "Users can view their own clients" on public.clients
  for select using (auth.uid() = user_id);

create policy "Users can insert their own clients" on public.clients
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own clients" on public.clients
  for update using (auth.uid() = user_id);

create policy "Users can delete their own clients" on public.clients
  for delete using (auth.uid() = user_id);

-- Reports Policies
create policy "Users can view their own reports" on public.reports
  for select using (auth.uid() = user_id);

create policy "Users can insert their own reports" on public.reports
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own reports" on public.reports
  for update using (auth.uid() = user_id);

create policy "Users can delete their own reports" on public.reports
  for delete using (auth.uid() = user_id);

-- Report Shares Policies
create policy "Users can view shares of their reports" on public.report_shares
  for select using (
    exists (
      select 1 from public.reports
      where reports.id = report_shares.report_id
      and reports.user_id = auth.uid()
    )
  );

create policy "Users can insert shares for their reports" on public.report_shares
  for insert with check (
    exists (
      select 1 from public.reports
      where reports.id = report_id
      and reports.user_id = auth.uid()
    )
  );

create policy "Users can delete shares of their reports" on public.report_shares
  for delete using (
    exists (
      select 1 from public.reports
      where reports.id = report_shares.report_id
      and reports.user_id = auth.uid()
    )
  );

-- Functions

-- Verify Report Access (Security Definer to bypass RLS)
create or replace function public.verify_report_access(
  p_report_id uuid,
  p_email text,
  p_access_code text
)
returns boolean
language plpgsql
security definer
as $$
declare
  v_exists boolean;
begin
  select exists (
    select 1 from public.report_shares
    where report_id = p_report_id
    and email = p_email
    and access_code = p_access_code
    and expires_at > now()
  ) into v_exists;
  
  -- Update last access if valid
  if v_exists then
    update public.report_shares
    set last_access = now()
    where report_id = p_report_id
    and email = p_email
    and access_code = p_access_code;
  end if;
  
  return v_exists;
end;
$$;

-- Get Public Report Data (Security Definer)
-- Returns JSON with report details and time entries
create or replace function public.get_public_report(
  p_report_id uuid,
  p_email text,
  p_access_code text
)
returns json
language plpgsql
security definer
as $$
declare
  v_verified boolean;
  v_report record;
  v_client record;
  v_entries json;
begin
  -- Verify access first
  v_verified := public.verify_report_access(p_report_id, p_email, p_access_code);
  
  if not v_verified then
    return null;
  end if;

  -- fetch report details
  select * into v_report from public.reports where id = p_report_id;
  
  -- fetch client
  select * into v_client from public.clients where id = v_report.client_id;
  
  -- fetch entries within range and projects
  select json_agg(t) into v_entries
  from (
    select te.*, p.nome as project_name, p.cliente as project_client
    from public.time_entries te
    join public.projects p on p.id = te.project_id
    where te.user_id = v_report.user_id
    and te.data >= v_report.start_date
    and te.data <= v_report.end_date
    and (
      v_report.project_ids is null 
      or 
      te.project_id = any(v_report.project_ids)
    )
    order by te.data desc
  ) t;

  return json_build_object(
    'report', v_report,
    'client', v_client,
    'entries', coalesce(v_entries, '[]'::json)
  );
end;
$$;
