-- ===================================================================
-- CORREÇÕES DE SEGURANÇA E PERFORMANCE - SUPABASE
-- ===================================================================
-- Este script corrige os alertas de segurança e performance identificados

-- 1. CORRIGIR SEARCH_PATH DAS FUNCTIONS
-- ===================================================================

-- Recriar função update_updated_at_column com search_path seguro
DROP FUNCTION IF EXISTS update_updated_at_column();

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Recriar função create_user_settings com search_path seguro
DROP FUNCTION IF EXISTS create_user_settings();

CREATE OR REPLACE FUNCTION create_user_settings()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO user_settings (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

-- Recriar triggers (necessário após recriar as functions)
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
DROP TRIGGER IF EXISTS update_time_entries_updated_at ON time_entries;
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER update_projects_updated_at 
  BEFORE UPDATE ON projects 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_entries_updated_at 
  BEFORE UPDATE ON time_entries 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at 
  BEFORE UPDATE ON user_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_settings();

-- 2. OTIMIZAR POLÍTICAS RLS PARA MELHOR PERFORMANCE
-- ===================================================================

-- Remover políticas antigas
DROP POLICY IF EXISTS projects_policy ON projects;
DROP POLICY IF EXISTS time_entries_policy ON time_entries;
DROP POLICY IF EXISTS user_settings_policy ON user_settings;

-- Remover possível política duplicada (se existir)
DROP POLICY IF EXISTS "Users can manage their settings" ON user_settings;

-- Recriar políticas otimizadas
-- Using (select auth.uid()) evita reavaliação para cada linha

CREATE POLICY projects_policy ON projects
FOR ALL USING ((select auth.uid()) = user_id);

CREATE POLICY time_entries_policy ON time_entries
FOR ALL USING ((select auth.uid()) = user_id);

CREATE POLICY user_settings_policy ON user_settings
FOR ALL USING ((select auth.uid()) = user_id);

-- 3. RECARREGAR SCHEMA CACHE
-- ===================================================================

-- Notificar PostgREST para recarregar o schema
SELECT pg_notify('pgrst', 'reload schema');

-- ===================================================================
-- VERIFICAÇÕES (Execute para confirmar que tudo está correto)
-- ===================================================================

-- Verificar functions com search_path correto
SELECT 
  proname as function_name,
  prosecdef as is_security_definer,
  proconfig as config_settings
FROM pg_proc 
WHERE proname IN ('update_updated_at_column', 'create_user_settings');

-- Verificar políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('projects', 'time_entries', 'user_settings')
ORDER BY tablename, policyname;

-- Verificar triggers
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers 
WHERE event_object_table IN ('projects', 'time_entries', 'user_settings')
   OR event_object_table = 'users'
ORDER BY event_object_table, trigger_name;
