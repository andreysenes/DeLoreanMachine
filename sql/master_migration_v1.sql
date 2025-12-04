-- ==============================================================================
-- DELOREAN MACHINE - MASTER MIGRATION V1
-- ==============================================================================
-- Este script consolida toda a estrutura do banco de dados.
-- É idempotente: verifica se objetos existem antes de criar.
-- Inclui correções de segurança (search_path) e performance (índices).
-- ==============================================================================

-- 1. EXTENSÕES
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. FUNÇÕES AUXILIARES (DEFINIÇÃO)
-- ==============================================================================
-- Função para atualizar timestamp 'updated_at'
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Função para criar dados padrão do usuário (Settings, Profiles, Preferences)
CREATE OR REPLACE FUNCTION public.create_user_defaults()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Criar configurações padrão
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Criar perfil padrão
  INSERT INTO public.user_profiles (user_id, first_name, last_name)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'nome', ''),
    COALESCE(NEW.raw_user_meta_data->>'sobrenome', '')
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Criar preferências padrão
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- 3. TABELAS CORE
-- ==============================================================================

-- TABELA: user_profiles
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'freelancer',
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar coluna full_name gerada se não existir
DO $$ 
BEGIN 
  BEGIN
    ALTER TABLE public.user_profiles ADD COLUMN full_name TEXT GENERATED ALWAYS AS (COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')) STORED;
  EXCEPTION
    WHEN duplicate_column THEN NULL;
  END;
END $$;


-- TABELA: user_settings
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  daily_goal INTEGER DEFAULT 6 CHECK (daily_goal > 0 AND daily_goal <= 24),
  weekly_goal INTEGER DEFAULT 30 CHECK (weekly_goal > 0 AND weekly_goal <= 168),
  work_start_time TIME DEFAULT '09:00',
  work_end_time TIME DEFAULT '17:00',
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  hour_format TEXT DEFAULT '24h' CHECK (hour_format IN ('12h', '24h')),
  date_format TEXT DEFAULT 'dd/MM/yyyy' CHECK (date_format IN ('dd/MM/yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Garantir colunas novas em user_settings
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_settings' AND column_name='timezone') THEN
    ALTER TABLE public.user_settings ADD COLUMN timezone TEXT DEFAULT 'America/Sao_Paulo';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_settings' AND column_name='hour_format') THEN
    ALTER TABLE public.user_settings ADD COLUMN hour_format TEXT DEFAULT '24h' CHECK (hour_format IN ('12h', '24h'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_settings' AND column_name='date_format') THEN
    ALTER TABLE public.user_settings ADD COLUMN date_format TEXT DEFAULT 'dd/MM/yyyy' CHECK (date_format IN ('dd/MM/yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd'));
  END IF;
END $$;


-- TABELA: user_preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  language TEXT DEFAULT 'pt-BR' CHECK (language IN ('pt-BR', 'en-US', 'es-ES')),
  week_start_day INTEGER DEFAULT 1 CHECK (week_start_day >= 0 AND week_start_day <= 6),
  notifications_email BOOLEAN DEFAULT true,
  notifications_push BOOLEAN DEFAULT true,
  notifications_reminders BOOLEAN DEFAULT true,
  auto_track BOOLEAN DEFAULT false,
  show_decimal_hours BOOLEAN DEFAULT true,
  export_format TEXT DEFAULT 'csv' CHECK (export_format IN ('csv', 'pdf', 'xlsx')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- TABELA: clients (Report System)
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  cnpj TEXT,
  tipo_servico TEXT,
  horas_contratadas NUMERIC,
  contrato_id TEXT,
  data_inicio DATE,
  data_conclusao DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);


-- TABELA: projects
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  cliente TEXT NOT NULL,
  status TEXT CHECK (status IN ('ativo', 'inativo')) DEFAULT 'ativo',
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar chave estrangeira client_id em projects (Defensivo)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'client_id') THEN
    ALTER TABLE public.projects ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;
  END IF;
END $$;


-- TABELA: time_entries
CREATE TABLE IF NOT EXISTS public.time_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  funcao TEXT NOT NULL,
  descricao TEXT,
  horas DECIMAL(4,2) NOT NULL CHECK (horas > 0),
  data DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- TABELA: reports
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  project_ids UUID[], 
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT CHECK (status IN ('active', 'archived')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);


-- TABELA: report_shares
CREATE TABLE IF NOT EXISTS public.report_shares (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  access_code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_access TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);


-- 4. ÍNDICES (PERFORMANCE)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON public.time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_project_id ON public.time_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_data ON public.time_entries(data);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON public.reports(user_id);
CREATE INDEX IF NOT EXISTS idx_report_shares_report_id ON public.report_shares(report_id);
CREATE INDEX IF NOT EXISTS idx_report_shares_email_code ON public.report_shares(report_id, email, access_code);


-- 5. ROW LEVEL SECURITY (RLS) & POLICIES
-- ==============================================================================
-- Habilitar RLS em todas as tabelas
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_shares ENABLE ROW LEVEL SECURITY;

-- Limpar policies antigas para recriar (evitar duplicações/conflitos)
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public' 
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- Recriar Políticas Otimizadas

-- User Profiles
CREATE POLICY "Users can fully manage their own profiles" ON public.user_profiles
USING (auth.uid() = user_id);

-- User Settings
CREATE POLICY "Users can fully manage their own settings" ON public.user_settings
USING (auth.uid() = user_id);

-- User Preferences
CREATE POLICY "Users can fully manage their own preferences" ON public.user_preferences
USING (auth.uid() = user_id);

-- Projects
CREATE POLICY "Users can fully manage their own projects" ON public.projects
USING (auth.uid() = user_id);

-- Time Entries
CREATE POLICY "Users can fully manage their own time entries" ON public.time_entries
USING (auth.uid() = user_id);

-- Clients
CREATE POLICY "Users can fully manage their own clients" ON public.clients
USING (auth.uid() = user_id);

-- Reports
CREATE POLICY "Users can fully manage their own reports" ON public.reports
USING (auth.uid() = user_id);

-- Report Shares
-- Users can see shares only for their own reports
CREATE POLICY "Users can view shares of their reports" ON public.report_shares
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.reports
    WHERE reports.id = report_shares.report_id
    AND reports.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert shares for their reports" ON public.report_shares
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.reports
    WHERE reports.id = report_id
    AND reports.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete shares of their reports" ON public.report_shares
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.reports
    WHERE reports.id = report_shares.report_id
    AND reports.user_id = auth.uid()
  )
);


-- 6. TRIGGERS
-- ==============================================================================
-- Trigger para user defaults no cadastro
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_user_defaults();

-- Triggers para updated_at (remover antes de criar para evitar erro)
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_time_entries_updated_at ON public.time_entries;
CREATE TRIGGER update_time_entries_updated_at BEFORE UPDATE ON public.time_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clients_updated_at ON public.clients;
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reports_updated_at ON public.reports;
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- 7. FUNÇÕES RPC DO SISTEMA DE RELATÓRIOS
-- ==============================================================================
-- SECURE: Security Definer para bypass RLS, mas com search_path seguro

-- Verify Report Access
CREATE OR REPLACE FUNCTION public.verify_report_access(
  p_report_id uuid,
  p_email text,
  p_access_code text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.report_shares
    WHERE report_id = p_report_id
    AND email = p_email
    AND access_code = p_access_code
    AND expires_at > NOW()
  ) INTO v_exists;
  
  -- Update last access if valid
  IF v_exists THEN
    UPDATE public.report_shares
    SET last_access = NOW()
    WHERE report_id = p_report_id
    AND email = p_email
    AND access_code = p_access_code;
  END IF;
  
  RETURN v_exists;
END;
$$;

-- Get Public Report Data
CREATE OR REPLACE FUNCTION public.get_public_report(
  p_report_id uuid,
  p_email text,
  p_access_code text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_verified boolean;
  v_report record;
  v_client record;
  v_entries json;
BEGIN
  -- Verify access first
  v_verified := public.verify_report_access(p_report_id, p_email, p_access_code);
  
  IF NOT v_verified THEN
    RETURN NULL;
  END IF;

  -- fetch report details
  SELECT * INTO v_report FROM public.reports WHERE id = p_report_id;
  
  -- fetch client
  SELECT * INTO v_client FROM public.clients WHERE id = v_report.client_id;
  
  -- fetch entries within range and projects
  SELECT json_agg(t) INTO v_entries
  FROM (
    SELECT te.*, p.nome as project_name, p.cliente as project_client
    FROM public.time_entries te
    JOIN public.projects p ON p.id = te.project_id
    WHERE te.user_id = v_report.user_id
    AND te.data >= v_report.start_date
    AND te.data <= v_report.end_date
    AND (
      v_report.project_ids IS NULL 
      OR 
      te.project_id = ANY(v_report.project_ids)
    )
    ORDER BY te.data DESC
  ) t;

  RETURN json_build_object(
    'report', v_report,
    'client', v_client,
    'entries', COALESCE(v_entries, '[]'::json)
  );
END;
$$;

-- Notificar recarregamento de schema para PostgREST (Opcional, mas útil)
NOTIFY pgrst, 'reload schema';
