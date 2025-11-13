import { supabase, isSupabaseConfigured } from './supabase';
import { User, Project, TimeEntry, WeeklySummary, DailySummary, HourGoal } from '@/types/db';
import { 
  mockTimeEntries, 
  mockProjects, 
  mockHourGoal,
  getTodaySummary as getMockTodaySummary,
  getCurrentWeekSummary as getMockWeekSummary
} from './supabase-placeholders';

// ===============================
// AUTH FUNCTIONS
// ===============================

export const sendMagicLink = async (email: string, isSignup: boolean = true) => {
  if (!isSupabaseConfigured || !supabase) {
    console.log('📧 Mock: Enviando Magic Link para:', email, isSignup ? '(Cadastro)' : '(Login)');
    return { success: true };
  }

  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: isSignup, // Criar usuário apenas se for cadastro
      },
    });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Erro ao enviar magic link:', error);
    throw error;
  }
};

export const verifyMagicLink = async (token: string, email: string) => {
  if (!isSupabaseConfigured || !supabase) {
    console.log('🔐 Mock: Verificando token:', token, 'para email:', email);
    return { 
      success: true, 
      user: { id: 'mock-user-id', email, user_metadata: { nome: 'Usuário Mock' } }
    };
  }

  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });

    if (error) throw error;
    return { success: true, user: data.user };
  } catch (error) {
    console.error('Erro ao verificar magic link:', error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  if (!isSupabaseConfigured || !supabase) {
    return { 
      id: 'mock-user-id', 
      email: 'usuario@mock.com',
      user_metadata: { nome: 'Usuário Mock' }
    };
  }

  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const logout = async () => {
  if (!isSupabaseConfigured || !supabase) {
    console.log('🚪 Mock: Fazendo logout...');
    window.location.href = '/login';
    return;
  }

  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  
  window.location.href = '/login';
};

// ===============================
// USER SETTINGS FUNCTIONS
// ===============================

export const getUserSettings = async (): Promise<HourGoal> => {
  if (!isSupabaseConfigured || !supabase) {
    console.log('⚙️ Mock: Retornando configurações mock');
    return mockHourGoal;
  }

  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  if (!data) {
    const defaultSettings = {
      user_id: user.id,
      daily_goal: 6,
      weekly_goal: 30,
      work_start_time: '09:00',
      work_end_time: '17:00',
    };

    const { data: newSettings, error: createError } = await supabase
      .from('user_settings')
      .insert(defaultSettings)
      .select()
      .single();

    if (createError) throw createError;

    return {
      dailyGoal: newSettings.daily_goal,
      weeklyGoal: newSettings.weekly_goal,
      workStartTime: newSettings.work_start_time,
      workEndTime: newSettings.work_end_time,
    };
  }

  return {
    dailyGoal: data.daily_goal,
    weeklyGoal: data.weekly_goal,
    workStartTime: data.work_start_time,
    workEndTime: data.work_end_time,
  };
};

export const updateUserSettings = async (settings: Partial<HourGoal>) => {
  if (!isSupabaseConfigured || !supabase) {
    console.log('⚙️ Mock: Atualizando configurações:', settings);
    return;
  }

  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  const updateData: any = {};
  if (settings.dailyGoal !== undefined) updateData.daily_goal = settings.dailyGoal;
  if (settings.weeklyGoal !== undefined) updateData.weekly_goal = settings.weeklyGoal;
  if (settings.workStartTime !== undefined) updateData.work_start_time = settings.workStartTime;
  if (settings.workEndTime !== undefined) updateData.work_end_time = settings.workEndTime;

  const { error } = await supabase
    .from('user_settings')
    .upsert({
      user_id: user.id,
      ...updateData,
    });

  if (error) throw error;
};

// ===============================
// PROJECTS FUNCTIONS
// ===============================

export const getProjects = async (): Promise<Project[]> => {
  if (!isSupabaseConfigured || !supabase) {
    console.log('📋 Mock: Retornando projetos mock');
    return mockProjects;
  }

  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createProject = async (projectData: Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
  if (!isSupabaseConfigured || !supabase) {
    console.log('📋 Mock: Criando projeto:', projectData.nome);
    return { id: 'mock-project-id', ...projectData, user_id: 'mock-user-id' };
  }

  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('projects')
    .insert({
      ...projectData,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateProject = async (id: string, projectData: Partial<Project>) => {
  if (!isSupabaseConfigured || !supabase) {
    console.log('📋 Mock: Atualizando projeto:', id, projectData);
    return { id, ...projectData };
  }

  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('projects')
    .update(projectData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteProject = async (id: string) => {
  if (!isSupabaseConfigured || !supabase) {
    console.log('📋 Mock: Deletando projeto:', id);
    return;
  }

  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
};

// ===============================
// TIME ENTRIES FUNCTIONS
// ===============================

export const getTimeEntries = async (): Promise<TimeEntry[]> => {
  if (!isSupabaseConfigured || !supabase) {
    console.log('⏰ Mock: Retornando apontamentos mock');
    return mockTimeEntries;
  }

  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('time_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('data', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createTimeEntry = async (entryData: Omit<TimeEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
  if (!isSupabaseConfigured || !supabase) {
    console.log('⏰ Mock: Criando apontamento:', entryData);
    return { id: 'mock-entry-id', ...entryData, user_id: 'mock-user-id' };
  }

  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('time_entries')
    .insert({
      ...entryData,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateTimeEntry = async (id: string, entryData: Partial<TimeEntry>) => {
  if (!isSupabaseConfigured || !supabase) {
    console.log('⏰ Mock: Atualizando apontamento:', id, entryData);
    return { id, ...entryData };
  }

  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('time_entries')
    .update(entryData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteTimeEntry = async (id: string) => {
  if (!isSupabaseConfigured || !supabase) {
    console.log('⏰ Mock: Deletando apontamento:', id);
    return;
  }

  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { error } = await supabase
    .from('time_entries')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
};

// ===============================
// DASHBOARD CALCULATIONS
// ===============================

export const calculateDailySummary = (date: Date, entries: TimeEntry[]): DailySummary => {
  const dayEntries = entries.filter(entry => 
    new Date(entry.data).toDateString() === date.toDateString()
  );
  
  return {
    date,
    totalHours: dayEntries.reduce((sum, entry) => sum + Number(entry.horas), 0),
    entries: dayEntries,
  };
};

export const calculateWeeklySummary = async (): Promise<WeeklySummary> => {
  if (!isSupabaseConfigured || !supabase) {
    console.log('📊 Mock: Retornando resumo semanal mock');
    return getMockWeekSummary();
  }

  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  const entries = await getTimeEntries();
  const projects = await getProjects();
  
  const weekEntries = entries.filter(entry => {
    const entryDate = new Date(entry.data);
    return entryDate >= weekStart && entryDate <= weekEnd;
  });
  
  const dailyBreakdown: DailySummary[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    dailyBreakdown.push(calculateDailySummary(date, weekEntries));
  }
  
  const projectBreakdown = projects.map(project => {
    const projectEntries = weekEntries.filter(entry => entry.project_id === project.id);
    return {
      projectId: project.id,
      projectName: project.nome,
      hours: projectEntries.reduce((sum, entry) => sum + Number(entry.horas), 0),
    };
  }).filter(item => item.hours > 0);
  
  return {
    weekStart,
    weekEnd,
    totalHours: weekEntries.reduce((sum, entry) => sum + Number(entry.horas), 0),
    dailyBreakdown,
    projectBreakdown,
  };
};

export const getTodaySummary = async (): Promise<DailySummary> => {
  if (!isSupabaseConfigured || !supabase) {
    console.log('📊 Mock: Retornando resumo diário mock');
    return getMockTodaySummary();
  }

  const entries = await getTimeEntries();
  return calculateDailySummary(new Date(), entries);
};

// ===============================
// EXPORT FUNCTIONS
// ===============================

export const exportToCSV = (data: any[], filename: string) => {
  console.log('📄 Exportando CSV:', filename, 'com', data.length, 'registros');
  
  if (!data || data.length === 0) {
    console.warn('Nenhum dado para exportar');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        if (typeof value === 'string' && (value.includes(',') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
