import { supabase, isSupabaseConfigured } from './supabase';
import { User, Project, TimeEntry, WeeklySummary, DailySummary, HourGoal, UserProfile, UserPreferences, UserSettings } from '@/types/db';
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
    console.error('Erro ao enviar código de verificação:', error);
    throw error;
  }
};

export const verifyCode = async (email: string, code: string) => {
  if (!isSupabaseConfigured || !supabase) {
    console.log('🔐 Mock: Verificando código:', code, 'para email:', email);
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
    return { success: true, user: data.user };
  } catch (error) {
    console.error('Erro ao verificar código:', error);
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

  try {
    const user = await getCurrentUser();
    if (!user) {
      console.log('⚙️ Usuário não autenticado, retornando configurações padrão');
      return mockHourGoal;
    }

    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    // Se tabela não existe
    if (error) {
      console.log('⚙️ Erro detalhado:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      
      if (error.code === '42P01') {
        console.log('⚙️ Tabela user_settings não existe, retornando padrão');
        return mockHourGoal;
      }
      console.warn('⚙️ Problema com configurações, usando dados padrão');
      return mockHourGoal;
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

        if (createError) {
          console.log('⚙️ Erro ao criar configurações padrão:', {
            code: createError.code,
            message: createError.message
          });
          return mockHourGoal;
        }

        return {
          dailyGoal: newSettings.daily_goal,
          weeklyGoal: newSettings.weekly_goal,
          workStartTime: newSettings.work_start_time,
          workEndTime: newSettings.work_end_time,
        };
      } catch (createErr: any) {
        console.log('⚙️ Falha ao criar configurações:', createErr.message || createErr);
        return mockHourGoal;
      }
    }

    return {
      dailyGoal: data.daily_goal,
      weeklyGoal: data.weekly_goal,
      workStartTime: data.work_start_time,
      workEndTime: data.work_end_time,
    };
  } catch (err: any) {
    console.log('⚙️ Erro geral ao obter configurações:', err.message || err);
    return mockHourGoal;
  }
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

  try {
    const user = await getCurrentUser();
    if (!user) {
      console.log('📋 Usuário não autenticado, retornando lista vazia');
      return [];
    }

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.log('📋 Erro detalhado ao buscar projetos:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      
      if (error.code === '42P01') {
        console.log('📋 Tabela projects não existe, retornando lista vazia');
        return [];
      }
      console.warn('📋 Problema ao buscar projetos, retornando lista vazia');
      return [];
    }

    return data || [];
  } catch (err: any) {
    console.log('📋 Erro geral ao obter projetos:', err.message || err);
    return [];
  }
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

  try {
    const user = await getCurrentUser();
    if (!user) {
      console.log('⏰ Usuário não autenticado, retornando lista vazia');
      return [];
    }

    const { data, error } = await supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('data', { ascending: false });

    if (error) {
      console.log('⏰ Erro detalhado ao buscar apontamentos:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      
      if (error.code === '42P01') {
        console.log('⏰ Tabela time_entries não existe, retornando lista vazia');
        return [];
      }
      console.warn('⏰ Problema ao buscar apontamentos, retornando lista vazia');
      return [];
    }

    return data || [];
  } catch (err: any) {
    console.log('⏰ Erro geral ao obter apontamentos:', err.message || err);
    return [];
  }
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
// USER PROFILE FUNCTIONS
// ===============================

export const getUserProfile = async (): Promise<UserProfile | null> => {
  if (!isSupabaseConfigured || !supabase) {
    console.log('👤 Mock: Retornando perfil mock');
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
    if (!user) {
      console.log('👤 Usuário não autenticado');
      return null;
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.log('👤 Erro ao buscar perfil:', {
        code: error.code,
        message: error.message
      });
      
      if (error.code === '42P01') {
        console.log('👤 Tabela user_profiles não existe');
        return null;
      }
      return null;
    }

    return data;
  } catch (err: any) {
    console.log('👤 Erro geral ao obter perfil:', err.message || err);
    return null;
  }
};

export const updateUserProfile = async (profileData: Partial<Omit<UserProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
  if (!isSupabaseConfigured || !supabase) {
    console.log('👤 Mock: Atualizando perfil:', profileData);
    return;
  }

  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { error } = await supabase
    .from('user_profiles')
    .upsert({
      user_id: user.id,
      ...profileData,
    });

  if (error) throw error;
};

// ===============================
// USER PREFERENCES FUNCTIONS
// ===============================

export const getUserPreferences = async (): Promise<UserPreferences | null> => {
  if (!isSupabaseConfigured || !supabase) {
    console.log('⚙️ Mock: Retornando preferências mock');
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
    if (!user) {
      console.log('⚙️ Usuário não autenticado');
      return null;
    }

    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.log('⚙️ Erro ao buscar preferências:', {
        code: error.code,
        message: error.message
      });
      
      if (error.code === '42P01') {
        console.log('⚙️ Tabela user_preferences não existe');
        return null;
      }
      return null;
    }

    return data;
  } catch (err: any) {
    console.log('⚙️ Erro geral ao obter preferências:', err.message || err);
    return null;
  }
};

export const updateUserPreferences = async (preferencesData: Partial<Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
  if (!isSupabaseConfigured || !supabase) {
    console.log('⚙️ Mock: Atualizando preferências:', preferencesData);
    return;
  }

  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { error } = await supabase
    .from('user_preferences')
    .upsert({
      user_id: user.id,
      ...preferencesData,
    });

  if (error) throw error;
};

// ===============================
// COMPLETE USER SETTINGS (ENHANCED)
// ===============================

export const getUserSettingsComplete = async (): Promise<UserSettings | null> => {
  if (!isSupabaseConfigured || !supabase) {
    console.log('⚙️ Mock: Retornando configurações completas mock');
    return {
      id: 'mock-settings-id',
      user_id: 'mock-user-id',
      daily_goal: 6,
      weekly_goal: 30,
      work_start_time: '09:00',
      work_end_time: '17:00',
      timezone: 'America/Sao_Paulo',
      hour_format: '24h',
      date_format: 'dd/MM/yyyy',
    };
  }

  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.log('⚙️ Erro ao buscar configurações completas:', error);
      return null;
    }

    return data;
  } catch (err: any) {
    console.log('⚙️ Erro geral ao obter configurações completas:', err.message || err);
    return null;
  }
};

export const updateUserSettingsComplete = async (settingsData: Partial<Omit<UserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
  if (!isSupabaseConfigured || !supabase) {
    console.log('⚙️ Mock: Atualizando configurações completas:', settingsData);
    return;
  }

  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { error } = await supabase
    .from('user_settings')
    .upsert({
      user_id: user.id,
      ...settingsData,
    });

  if (error) throw error;
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
