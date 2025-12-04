import { supabase, isSupabaseConfigured } from './supabase';
import { Report, ReportShare } from '@/types/db';
import { getCurrentUser } from './supabase-client';

export const getReports = async (): Promise<Report[]> => {
  if (!isSupabaseConfigured || !supabase) return [];

  try {
    const user = await getCurrentUser();
    if (!user) {
      console.warn('Usuário não autenticado ao buscar relatórios');
      return [];
    }

    // Primeiro, verificar se a tabela existe
    const { error: checkError } = await supabase
      .from('reports')
      .select('id')
      .limit(1);

    if (checkError) {
      if (checkError.code === '42P01') {
        console.warn('Tabela reports não encontrada.');
        return [];
      }
      throw new Error(`Erro ao verificar tabela: ${checkError.message}`);
    }

    // Se a tabela existe, fazer a consulta completa
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Erro na consulta: ${error.message}`);
    }

    if (!data) {
      console.warn('Nenhum dado retornado da consulta de relatórios');
      return [];
    }

    return data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro ao buscar relatórios:', { message: errorMessage });
    throw error;
  }
};

export const createReport = async (
  reportData: Omit<Report, 'id' | 'user_id' | 'created_at' | 'updated_at'>, 
  shares: Omit<ReportShare, 'id' | 'report_id' | 'created_at' | 'last_access'>[]
) => {
  if (!isSupabaseConfigured || !supabase) {
    console.log('Mock create report');
    return null;
  }

  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  // Insert report
  const { data: report, error: reportError } = await supabase
    .from('reports')
    .insert({
      ...reportData,
      user_id: user.id
    })
    .select()
    .single();

  if (reportError) throw reportError;

  // Insert shares if any
  if (shares.length > 0) {
    const sharesWithId = shares.map(s => ({
      ...s,
      report_id: report.id
    }));
    
    const { error: shareError } = await supabase
      .from('report_shares')
      .insert(sharesWithId);
      
    if (shareError) console.error('Error creating shares', shareError);
  }

  return report;
};

export const getReportShares = async (reportId: string): Promise<ReportShare[]> => {
  if (!isSupabaseConfigured || !supabase) return [];
  
  const { data } = await supabase
    .from('report_shares')
    .select('*')
    .eq('report_id', reportId);
    
  return data || [];
};

export const createShare = async (shareData: Omit<ReportShare, 'id' | 'created_at' | 'last_access'>) => {
  if (!isSupabaseConfigured || !supabase) {
    return { id: 'mock-share', ...shareData, created_at: new Date().toISOString() };
  }
  
  const { data, error } = await supabase
    .from('report_shares')
    .insert(shareData)
    .select()
    .single();
    
  if (error) {
    console.error('Supabase insert error in createShare:', JSON.stringify(error, null, 2));
    throw error;
  }
  return data;
};

export const deleteShare = async (id: string) => {
  if (!isSupabaseConfigured || !supabase) return;
  
  const { error } = await supabase
    .from('report_shares')
    .delete()
    .eq('id', id);
    
  if (error) throw error;
};

// Function for public access
export const getReportPublicData = async (reportId: string) => {
  try {
    if (!isSupabaseConfigured || !supabase) return null;

    // Usar RPC segura e completa
    const { data, error } = await supabase.rpc('get_full_public_report', {
      p_report_id: reportId
    });

    if (error) {
      throw error;
    }

    // Se retornar uma lista (padrão RPC TABLE), pegamos o primeiro item
    // Se retornar vazio, significa que não tem acesso
    if (!data || (Array.isArray(data) && data.length === 0)) {
      console.warn('Relatório não encontrado ou acesso expirado:', reportId);
      return null;
    }

    const result = Array.isArray(data) ? data[0] : data;

    if (!result || !result.report) {
      return null;
    }

    // Formatar dados para a visualização
    // A RPC já retorna os dados estruturados, só precisamos adequar o nome dos campos se necessário
    return {
      report: result.report,
      client: result.client,
      entries: result.entries
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro ao buscar relatório público:', { message: errorMessage });
    return null;
  }
};

// Function for authorized access (owner)
export const updateReport = async (
  id: string,
  reportData: Partial<Omit<Report, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
) => {
  if (!isSupabaseConfigured || !supabase) return null;

  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('reports')
    .update({ ...reportData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getReportDetails = async (reportId: string) => {
  if (!isSupabaseConfigured || !supabase) return null;

  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    // 1. Get report
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .eq('user_id', user.id)
      .single();

    if (reportError) throw reportError;
    if (!report) throw new Error('Relatório não encontrado');

    // 2. Get client (if applicable)
    let client = null;
    if (report.client_id) {
      const { data: c } = await supabase
        .from('clients')
        .select('*')
        .eq('id', report.client_id)
        .single();
      client = c;
    }

    // 3. Get entries
    let query = supabase
      .from('time_entries')
      .select('*, projects(nome)')
      .eq('user_id', user.id)
      .gte('data', report.start_date)
      .lte('data', report.end_date)
      .order('data', { ascending: false });

    // Filter by project_ids if specified
    if (report.project_ids && report.project_ids.length > 0) {
      // Postgres array types can be tricky in some Supabase versions/filters
      // But .in() works on a single column. Here project_id is single value.
      // We want rows where project_id is in report.project_ids array.
      query = query.in('project_id', report.project_ids);
    }

    const { data: rawEntries, error: entriesError } = await query;
    if (entriesError) throw entriesError;

    // Map entries to include flattened project_name
    const entries = rawEntries?.map((e: any) => ({
      ...e,
      project_name: e.projects?.nome || null
    })) || [];

    return {
      report,
      client,
      entries
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro ao buscar detalhes do relatório:', { message: errorMessage });
    throw error;
  }
};

export const archiveReport = async (reportId: string) => {
  if (!isSupabaseConfigured || !supabase) return;
  
  const user = await getCurrentUser();
  if (!user) return;

  await supabase
    .from('reports')
    .update({ status: 'archived' })
    .eq('id', reportId)
    .eq('user_id', user.id);
};
