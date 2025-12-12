import { supabase, isSupabaseConfigured, handleSupabaseError } from './supabase';
import { User, Project, TimeEntry, WeeklySummary, DailySummary, HourGoal, UserProfile, UserPreferences, UserSettings } from '@/types/db';
import { parseSupabaseDate } from '@/lib/utils';
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

// Helper para gerenciar o cookie de autenticação para o middleware
const setAuthCookie = (token: string) => {
  const maxAge = 60 * 60 * 24 * 7; // 7 dias
  document.cookie = `supabase-auth-token=${token}; path=/; max-age=${maxAge}; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`;
};

const clearAuthCookie = () => {
  document.cookie = `supabase-auth-token=; path=/; max-age=0; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`;
};

export const sendVerificationCode = async (email: string, isSignup: boolean = true) => {
  if (!isSupabaseConfigured || !supabase) {
    console.log('📧 Mock: Enviando código de verificação para:', email, isSignup ? '(Cadastro)' : '(Login)');
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
    throw handleSupabaseError(error, 'sendVerificationCode');
  }
};

export const verifyCode = async (email: string, code: string) => {
  if (!isSupabaseConfigured || !supabase) {
    console.log('🔐 Mock: Verificando código:', code, 'para email:', email);
    setAuthCookie('mock-token-123456');
    return { 
      success: true, 
      user: { id: 'mock-user-id', email, user_metadata: { nome: 'Usuário Mock' } }
    };
  }

  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    });

    if (error) throw error;
    
    if (data.session?.access_token) {
      setAuthCookie(data.session.access_token);
    }
    
    return { success: true, user: data.user };
  } catch (error) {
    throw handleSupabaseError(error, 'verifyCode');
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
  clearAuthCookie();
  
  if (!isSupabaseConfigured || !supabase) {
    console.log('🚪 Mock: Fazendo logout...');
    window.location.href = '/login';
    return;
  }

  const { error } = await supabase.auth.signOut();
  if (error) console.error('Error signing out:', error);
  
  window.location.href = '/login';
};

// ===============================
// USER SETTINGS FUNCTIONS
// ===============================

export const getUserSettings = async (): Promise<HourGoal> => {
  if (!isSupabaseConfigured || !supabase) {
    return mockHourGoal;
  }

  try {
    const user = await getCurrentUser();
    if (!user) return mockHourGoal;

    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      // Se não existir tabela, logar e retornar mock sem explodir
      if (error.code === '42P01') {
        console.warn('Tabela user_settings não encontrada.');
        return mockHourGoal;
      }
      throw error;
    }

    if (!data) {
      // Tentar criar configurações padrão
      try {
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
      } catch (createErr) {
        handleSupabaseError(createErr, 'createDefaultSettings');
        return mockHourGoal;
      }
    }

    return {
      dailyGoal: data.daily_goal,
      weeklyGoal: data.weekly_goal,
      workStartTime: data.work_start_time,
      workEndTime: data.work_end_time,
    };
  } catch (err) {
    handleSupabaseError(err, 'getUserSettings');
    return mockHourGoal;
  }
};

export const updateUserSettings = async (settings: Partial<HourGoal>) => {
  if (!isSupabaseConfigured || !supabase) return;

  try {
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
  } catch (error) {
    throw handleSupabaseError(error, 'updateUserSettings');
  }
};

// ===============================
// PROJECTS FUNCTIONS
// ===============================

export const getProjects = async (): Promise<Project[]> => {
  if (!isSupabaseConfigured || !supabase) return mockProjects;

  try {
    const user = await getCurrentUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === '42P01') return []; // Tabela não existe
      throw error;
    }

    return data || [];
  } catch (err) {
    handleSupabaseError(err, 'getProjects');
    return [];
  }
};

export const createProject = async (projectData: Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
  if (!isSupabaseConfigured || !supabase) {
    return { id: 'mock-project-id', ...projectData, user_id: 'mock-user-id' };
  }

  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Remover campos não existentes na tabela
    const { nome, client_id, status, descricao } = projectData;
    const cleanData = { nome, client_id, status, descricao };

    const { data, error } = await supabase
      .from('projects')
      .insert({ ...cleanData, user_id: user.id })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw handleSupabaseError(error, 'createProject');
  }
};

export const updateProject = async (id: string, projectData: Partial<Project>) => {
  if (!isSupabaseConfigured || !supabase) {
    return { id, ...projectData };
  }

  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Remover campos não existentes na tabela
    const cleanData: Partial<Project> = {};
    if ('nome' in projectData) cleanData.nome = projectData.nome;
    if ('client_id' in projectData) cleanData.client_id = projectData.client_id;
    if ('status' in projectData) cleanData.status = projectData.status;
    if ('descricao' in projectData) cleanData.descricao = projectData.descricao;

    const { data, error } = await supabase
      .from('projects')
      .update(cleanData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw handleSupabaseError(error, 'updateProject');
  }
};

export const deleteProject = async (id: string) => {
  if (!isSupabaseConfigured || !supabase) return;

  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
  } catch (error) {
    throw handleSupabaseError(error, 'deleteProject');
  }
};

// ===============================
// TIME ENTRIES FUNCTIONS
// ===============================

export const getTimeEntries = async (startDate?: Date, endDate?: Date): Promise<TimeEntry[]> => {
  if (!isSupabaseConfigured || !supabase) return mockTimeEntries;

  try {
    const user = await getCurrentUser();
    if (!user) return [];

    let query = supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('data', { ascending: false });

    // Optimization: Filter at database level if dates provided
    if (startDate) {
      query = query.gte('data', startDate.toISOString().split('T')[0]);
    }
    if (endDate) {
      query = query.lte('data', endDate.toISOString().split('T')[0]);
    }

    const { data, error } = await query;

    if (error) {
      if (error.code === '42P01') return []; 
      throw error;
    }

    return data || [];
  } catch (err) {
    handleSupabaseError(err, 'getTimeEntries');
    return [];
  }
};

export const createTimeEntry = async (entryData: Omit<TimeEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
  if (!isSupabaseConfigured || !supabase) {
    return { id: 'mock-entry-id', ...entryData, user_id: 'mock-user-id' };
  }

  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('time_entries')
      .insert({ ...entryData, user_id: user.id })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw handleSupabaseError(error, 'createTimeEntry');
  }
};

export const updateTimeEntry = async (id: string, entryData: Partial<TimeEntry>) => {
  if (!isSupabaseConfigured || !supabase) {
    return { id, ...entryData };
  }

  try {
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
  } catch (error) {
    throw handleSupabaseError(error, 'updateTimeEntry');
  }
};

export const deleteTimeEntry = async (id: string) => {
  if (!isSupabaseConfigured || !supabase) return;

  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase
      .from('time_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
  } catch (error) {
    throw handleSupabaseError(error, 'deleteTimeEntry');
  }
};

// ===============================
// DASHBOARD CALCULATIONS (OPTIMIZED)
// ===============================

export const calculateDailySummary = (date: Date, entries: TimeEntry[]): DailySummary => {
  const dateStr = date.toISOString().split('T')[0];
  const dayEntries = entries.filter(entry => {
    // Determine if entry.data is a string or Date object to handle potentially mixed types gracefully
    const entryDateStr = typeof entry.data === 'string' ? entry.data : (entry.data as any).toISOString().split('T')[0];
    return entryDateStr === dateStr || parseSupabaseDate(entry.data).toDateString() === date.toDateString();
  });
  
  return {
    date,
    totalHours: dayEntries.reduce((sum, entry) => sum + Number(entry.horas), 0),
    entries: dayEntries,
  };
};

export const calculateWeeklySummary = async (): Promise<WeeklySummary> => {
  if (!isSupabaseConfigured || !supabase) return getMockWeekSummary();

  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay()); // Sunday
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6); // Saturday
  
  // Optimization: Fetch only relevant entries for the week from DB
  const entries = await getTimeEntries(weekStart, weekEnd);
  
  // Projects still needed for names, could be optimized if we have many projects
  const projects = await getProjects();
  const projectMap = new Map(projects.map(p => [p.id, p]));
  
  const dailyBreakdown: DailySummary[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    dailyBreakdown.push(calculateDailySummary(date, entries));
  }
  
  // Calculate project breakdown
  const projectHours = new Map<string, number>();
  
  entries.forEach(entry => {
    const current = projectHours.get(entry.project_id) || 0;
    projectHours.set(entry.project_id, current + Number(entry.horas));
  });
  
  const projectBreakdown = Array.from(projectHours.entries())
    .map(([projectId, hours]) => ({
      projectId,
      projectName: projectMap.get(projectId)?.nome || 'Projeto Desconhecido',
      hours
    }))
    .filter(item => item.hours > 0)
    .sort((a, b) => b.hours - a.hours);
  
  return {
    weekStart,
    weekEnd,
    totalHours: entries.reduce((sum, entry) => sum + Number(entry.horas), 0),
    dailyBreakdown,
    projectBreakdown,
  };
};

export const getTodaySummary = async (): Promise<DailySummary> => {
  if (!isSupabaseConfigured || !supabase) return getMockTodaySummary();

  const today = new Date();
  // Optimization: Fetch only today's entries
  const entries = await getTimeEntries(today, today);
  return calculateDailySummary(today, entries);
};

// ===============================
// USER PROFILE FUNCTIONS
// ===============================

export const getUserProfile = async (): Promise<UserProfile | null> => {
  if (!isSupabaseConfigured || !supabase) {
    return {
      id: 'mock-profile-id',
      user_id: 'mock-user-id',
      first_name: 'Usuário',
      last_name: 'Mock',
      full_name: 'Usuário Mock',
      role: 'freelancer',
    };
  }

  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      if (error.code === '42P01') return null;
      throw error;
    }

    return data;
  } catch (err) {
    handleSupabaseError(err, 'getUserProfile');
    return null;
  }
};

export const updateUserProfile = async (profileData: Partial<Omit<UserProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
  if (!isSupabaseConfigured || !supabase) return;

  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: user.id,
        ...profileData,
      });

    if (error) throw error;
  } catch (err) {
    throw handleSupabaseError(err, 'updateUserProfile');
  }
};

// ===============================
// USER PREFERENCES FUNCTIONS
// ===============================

export const getUserPreferences = async (): Promise<UserPreferences | null> => {
  if (!isSupabaseConfigured || !supabase) {
    return {
      id: 'mock-preferences-id',
      user_id: 'mock-user-id',
      theme: 'system',
      language: 'pt-BR',
      week_start_day: 1,
      notifications_email: true,
      notifications_push: true,
      notifications_reminders: true,
      auto_track: false,
      show_decimal_hours: true,
      export_format: 'csv',
    };
  }

  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
       if (error.code === '42P01') return null;
       throw error;
    }

    return data;
  } catch (err) {
    handleSupabaseError(err, 'getUserPreferences');
    return null;
  }
};

export const updateUserPreferences = async (preferencesData: Partial<Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
  if (!isSupabaseConfigured || !supabase) return;

  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Primeiro, verificar se o registro existe
    const { data: existing } = await supabase
      .from('user_preferences')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      // Se existe, fazer UPDATE
      const { error } = await supabase
        .from('user_preferences')
        .update(preferencesData)
        .eq('user_id', user.id);

      if (error) throw error;
    } else {
      // Se não existe, fazer INSERT
      const { error } = await supabase
        .from('user_preferences')
        .insert({ 
          user_id: user.id,
          ...preferencesData 
        });

      if (error) throw error;
    }
  } catch (error) {
    throw handleSupabaseError(error, 'updateUserPreferences');
  }
};

// ===============================
// COMPLETE USER SETTINGS
// ===============================

export const getUserSettingsComplete = async (): Promise<UserSettings | null> => {
  if (!isSupabaseConfigured || !supabase) return null;

  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;

    return data;
  } catch (err) {
    handleSupabaseError(err, 'getUserSettingsComplete');
    return null;
  }
};

export const updateUserSettingsComplete = async (settingsData: Partial<Omit<UserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
  if (!isSupabaseConfigured || !supabase) return;

  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Primeiro, verificar se o registro existe
    const { data: existing } = await supabase
      .from('user_settings')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      // Se existe, fazer UPDATE
      const { error } = await supabase
        .from('user_settings')
        .update(settingsData)
        .eq('user_id', user.id);

      if (error) throw error;
    } else {
      // Se não existe, fazer INSERT
      const { error } = await supabase
        .from('user_settings')
        .insert({ 
          user_id: user.id,
          ...settingsData 
        });

      if (error) throw error;
    }
  } catch (err) {
    throw handleSupabaseError(err, 'updateUserSettingsComplete');
  }
};

// Export function remains the same
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
