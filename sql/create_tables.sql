-- Tabela de projetos
CREATE TABLE projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  cliente TEXT NOT NULL,
  status TEXT CHECK (status IN ('ativo', 'inativo')) DEFAULT 'ativo',
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de apontamentos de horas
CREATE TABLE time_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  funcao TEXT NOT NULL,
  descricao TEXT,
  horas DECIMAL(4,2) NOT NULL CHECK (horas > 0),
  data DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de configurações do usuário
CREATE TABLE user_settings (
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

-- RLS (Row Level Security) para projetos
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY projects_policy ON projects
FOR ALL USING (auth.uid() = user_id);

-- RLS para apontamentos de horas
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY time_entries_policy ON time_entries
FOR ALL USING (auth.uid() = user_id);

-- RLS para configurações do usuário
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_settings_policy ON user_settings
FOR ALL USING (auth.uid() = user_id);

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger nas tabelas
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_entries_updated_at BEFORE UPDATE ON time_entries 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX idx_time_entries_project_id ON time_entries(project_id);
CREATE INDEX idx_time_entries_data ON time_entries(data);
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

-- Função para criar configurações padrão do usuário após signup
CREATE OR REPLACE FUNCTION create_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_settings (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para criar configurações automáticas
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_settings();
