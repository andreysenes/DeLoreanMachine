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
  cliente: string;
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

export type TimeEntryFormData = Omit<TimeEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type ProjectFormData = Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
