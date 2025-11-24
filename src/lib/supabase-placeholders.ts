import { User, Project, TimeEntry, WeeklySummary, DailySummary, HourGoal } from '@/types/db';
import { parseSupabaseDate } from '@/lib/utils';

// Mock data
export const mockUser: User = {
  id: '1',
  nome: 'João',
  sobrenome: 'Silva',
  email: 'joao@exemplo.com',
  created_at: new Date('2024-01-15'),
};

export const mockProjects: Project[] = [
  {
    id: '1',
    user_id: '1',
    nome: 'Website E-commerce',
    cliente: 'Loja ABC',
    status: 'ativo',
    descricao: 'Desenvolvimento de plataforma de vendas online',
    created_at: new Date('2024-01-20'),
    updated_at: new Date('2024-01-20'),
  },
  {
    id: '2',
    user_id: '1',
    nome: 'App Mobile',
    cliente: 'Startup XYZ',
    status: 'ativo',
    descricao: 'Aplicativo de delivery',
    created_at: new Date('2024-02-01'),
    updated_at: new Date('2024-02-01'),
  },
  {
    id: '3',
    user_id: '1',
    nome: 'Sistema CRM',
    cliente: 'Empresa 123',
    status: 'inativo',
    descricao: 'Sistema de gestão de clientes',
    created_at: new Date('2024-01-10'),
    updated_at: new Date('2024-03-15'),
  },
];

export const mockTimeEntries: TimeEntry[] = [
  {
    id: '1',
    user_id: '1',
    project_id: '1',
    funcao: 'Desenvolvimento',
    descricao: 'Implementação do carrinho de compras',
    horas: 4,
    data: new Date('2024-12-11'),
    created_at: new Date('2024-12-11'),
    updated_at: new Date('2024-12-11'),
  },
  {
    id: '2',
    user_id: '1',
    project_id: '1',
    funcao: 'Design',
    descricao: 'Criação de wireframes',
    horas: 2.5,
    data: new Date('2024-12-11'),
    created_at: new Date('2024-12-11'),
    updated_at: new Date('2024-12-11'),
  },
  {
    id: '3',
    user_id: '1',
    project_id: '2',
    funcao: 'Reunião',
    descricao: 'Alinhamento com cliente',
    horas: 1,
    data: new Date('2024-12-10'),
    created_at: new Date('2024-12-10'),
    updated_at: new Date('2024-12-10'),
  },
  {
    id: '4',
    user_id: '1',
    project_id: '2',
    funcao: 'Desenvolvimento',
    descricao: 'Setup do projeto',
    horas: 3,
    data: new Date('2024-12-10'),
    created_at: new Date('2024-12-10'),
    updated_at: new Date('2024-12-10'),
  },
];

export const mockHourGoal: HourGoal = {
  dailyGoal: 6,
  weeklyGoal: 30,
  workStartTime: '09:00',
  workEndTime: '17:00',
};

// Placeholder functions for Supabase integration
export const connectToSupabase = () => {
  console.log('🔌 Conectando ao Supabase...');
  alert('Placeholder: Conexão com Supabase será implementada aqui');
};

export const sendMagicLink = async (email: string) => {
  console.log('📧 Enviando Magic Link para:', email);
  // Simula delay de envio
  await new Promise(resolve => setTimeout(resolve, 2000));
  alert(`Magic Link enviado para ${email}! (Placeholder)`);
  return { success: true };
};

export const verifyMagicLink = async (token: string) => {
  console.log('🔐 Verificando Magic Link token:', token);
  // Simula verificação
  await new Promise(resolve => setTimeout(resolve, 1000));
  alert('Magic Link verificado! Redirecionando... (Placeholder)');
  return { user: mockUser, success: true };
};

export const logout = () => {
  console.log('👋 Fazendo logout...');
  alert('Logout realizado! (Placeholder)');
  // Aqui será implementado o logout do Supabase
};

export const saveTimeEntry = async (entry: Omit<TimeEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
  console.log('💾 Salvando apontamento:', entry);
  await new Promise(resolve => setTimeout(resolve, 500));
  return { success: true, id: String(Date.now()) };
};

export const saveProject = async (project: Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
  console.log('💾 Salvando projeto:', project);
  await new Promise(resolve => setTimeout(resolve, 500));
  return { success: true, id: String(Date.now()) };
};

export const exportToCSV = (data: any[], filename: string) => {
  console.log('📊 Exportando para CSV:', filename, data);
  alert(`Dados serão exportados para ${filename}.csv (Placeholder)`);
  // Aqui será implementada a exportação real com papaparse ou sheetjs
};

// Helper functions for calculations
export const calculateDailySummary = (date: Date, entries: TimeEntry[]): DailySummary => {
  const dayEntries = entries.filter(entry => 
    parseSupabaseDate(entry.data).toDateString() === date.toDateString()
  );
  
  return {
    date,
    totalHours: dayEntries.reduce((sum, entry) => sum + entry.horas, 0),
    entries: dayEntries,
  };
};

export const calculateWeeklySummary = (weekStart: Date, entries: TimeEntry[], projects: Project[]): WeeklySummary => {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  const weekEntries = entries.filter(entry => {
    const entryDate = parseSupabaseDate(entry.data);
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
      hours: projectEntries.reduce((sum, entry) => sum + entry.horas, 0),
    };
  }).filter(item => item.hours > 0);
  
  return {
    weekStart,
    weekEnd,
    totalHours: weekEntries.reduce((sum, entry) => sum + entry.horas, 0),
    dailyBreakdown,
    projectBreakdown,
  };
};

// Mock current week calculation
export const getCurrentWeekSummary = (): WeeklySummary => {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
  
  return calculateWeeklySummary(weekStart, mockTimeEntries, mockProjects);
};

// Mock today's summary
export const getTodaySummary = (): DailySummary => {
  return calculateDailySummary(new Date(), mockTimeEntries);
};
