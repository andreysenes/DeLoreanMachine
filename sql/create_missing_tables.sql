-- Script para criar apenas tabelas que NÃO existem
-- Resolve erro: relation "projects" already exists

-- Verificar se user_profiles existe, se não criar
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        CREATE TABLE user_profiles (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
          first_name TEXT,
          last_name TEXT,
          full_name TEXT GENERATED ALWAYS AS (COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')) STORED,
          phone TEXT,
          role TEXT DEFAULT 'freelancer',
          avatar_url TEXT,
          bio TEXT,
          location TEXT,
          website TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- RLS para perfis de usuário
        ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
        CREATE POLICY user_profiles_policy ON user_profiles FOR ALL USING (auth.uid() = user_id);
        
        -- Trigger para updated_at
        CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
        -- Índice
        CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
    END IF;
END $$;

-- Verificar se user_settings existe completamente (com todas as colunas)
DO $$ 
BEGIN 
    -- Adicionar colunas que podem estar faltando na tabela user_settings
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_settings') THEN
        -- Tabela existe, verificar se tem todas as colunas necessárias
        IF NOT EXISTS (SELECT column_name FROM information_schema.columns WHERE table_name='user_settings' AND column_name='timezone') THEN
            ALTER TABLE user_settings ADD COLUMN timezone TEXT DEFAULT 'America/Sao_Paulo';
        END IF;
        
        IF NOT EXISTS (SELECT column_name FROM information_schema.columns WHERE table_name='user_settings' AND column_name='hour_format') THEN
            ALTER TABLE user_settings ADD COLUMN hour_format TEXT DEFAULT '24h' CHECK (hour_format IN ('12h', '24h'));
        END IF;
        
        IF NOT EXISTS (SELECT column_name FROM information_schema.columns WHERE table_name='user_settings' AND column_name='date_format') THEN
            ALTER TABLE user_settings ADD COLUMN date_format TEXT DEFAULT 'dd/MM/yyyy' CHECK (date_format IN ('dd/MM/yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd'));
        END IF;
    ELSE
        -- Tabela não existe, criar completa
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

        -- RLS
        ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
        CREATE POLICY user_settings_policy ON user_settings FOR ALL USING (auth.uid() = user_id);
        
        -- Trigger
        CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
        -- Índice
        CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);
    END IF;
END $$;

-- Verificar se user_preferences existe
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_preferences') THEN
        CREATE TABLE user_preferences (
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

        -- RLS
        ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
        CREATE POLICY user_preferences_policy ON user_preferences FOR ALL USING (auth.uid() = user_id);
        
        -- Trigger
        CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
        -- Índice
        CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
    END IF;
END $$;

-- Verificar se time_entries existe
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'time_entries') THEN
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

        -- RLS
        ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
        CREATE POLICY time_entries_policy ON time_entries FOR ALL USING (auth.uid() = user_id);
        
        -- Trigger
        CREATE TRIGGER update_time_entries_updated_at BEFORE UPDATE ON time_entries 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
        -- Índices
        CREATE INDEX idx_time_entries_user_id ON time_entries(user_id);
        CREATE INDEX idx_time_entries_project_id ON time_entries(project_id);
        CREATE INDEX idx_time_entries_data ON time_entries(data);
    END IF;
END $$;

-- Criar função de update_updated_at se não existir
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Função para criar dados padrão do usuário após signup (se não existir)
CREATE OR REPLACE FUNCTION create_user_defaults()
RETURNS TRIGGER AS $$
BEGIN
  -- Criar configurações padrão (se não existir)
  INSERT INTO user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Criar perfil padrão (se não existir) 
  INSERT INTO user_profiles (user_id, first_name, last_name)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'nome', ''),
    COALESCE(NEW.raw_user_meta_data->>'sobrenome', '')
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Criar preferências padrão (se não existir)
  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para criar dados automáticos (recriar para garantir)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_defaults();
