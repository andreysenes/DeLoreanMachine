export interface User {
  id: string;
  nome: string;
  sobrenome: string;
  email: string;
  created_at: Date;
}

export interface Project {
  id: string;
  user_id: string;
  nome: string;
  client_id: string;
  status: 'ativo' | 'inativo';
  descricao?: string;
  created_at: Date;
  updated_at: Date;
}

export interface TimeEntry {
  id: string;
  user_id: string;
  project_id: string;
  funcao: string;
  descricao?: string;
  horas: number;
  data: Date;
  created_at: Date;
  updated_at: Date;
}

export interface DailySummary {
  date: Date;
  totalHours: number;
  entries: TimeEntry[];
}

export interface WeeklySummary {
  weekStart: Date;
  weekEnd: Date;
  totalHours: number;
  dailyBreakdown: DailySummary[];
  projectBreakdown: { projectId: string; projectName: string; hours: number }[];
}

export interface HourGoal {
  dailyGoal: number;
  weeklyGoal: number;
  workStartTime: string;
  workEndTime: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  phone?: string;
  role?: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  website?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  theme: 'light' | 'dark' | 'system';
  language: 'pt-BR' | 'en-US' | 'es-ES';
  week_start_day: number;
  notifications_email: boolean;
  notifications_push: boolean;
  notifications_reminders: boolean;
  auto_track: boolean;
  show_decimal_hours: boolean;
  export_format: 'csv' | 'pdf' | 'xlsx';
  created_at?: string;
  updated_at?: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  daily_goal: number;
  weekly_goal: number;
  work_start_time: string;
  work_end_time: string;
  timezone: string;
  hour_format: '12h' | '24h';
  date_format: 'dd/MM/yyyy' | 'MM/dd/yyyy' | 'yyyy-MM-dd';
  created_at?: string;
  updated_at?: string;
}

export type TimeEntryFormData = Omit<TimeEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type ProjectFormData = Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

export interface Client {
  id: string;
  user_id: string;
  nome: string;
  cnpj?: string;
  tipo_servico?: string;
  horas_contratadas?: number;
  contrato_id?: string;
  data_inicio?: string;
  data_conclusao?: string;
  created_at: string;
  updated_at: string;
}

export interface Report {
  id: string;
  user_id: string;
  title: string;
  client_id?: string;
  project_ids?: string[];
  start_date: string;
  end_date: string;
  status: 'active' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface ReportShare {
  id: string;
  report_id: string;
  expires_at: string;
  last_access?: string;
  created_at: string;
}
