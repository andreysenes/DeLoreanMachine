-- Script V3 para corrigir recursão infinita - IDEMPOTENTE
-- Remove todas as políticas possíveis, antigas e novas, antes de recriar

-- 1. Remover TODAS as políticas de REPORTS
DROP POLICY IF EXISTS "Permitir acesso público via link" ON reports;
DROP POLICY IF EXISTS "Permitir acesso pelo dono" ON reports;
DROP POLICY IF EXISTS "Acesso pelo dono" ON reports;
DROP POLICY IF EXISTS "Acesso público via link" ON reports;
DROP POLICY IF EXISTS "owner_access_reports" ON reports; -- Nome V2
DROP POLICY IF EXISTS "public_view_reports" ON reports; -- Nome V2

-- 2. Remover TODAS as políticas de REPORT_SHARES
DROP POLICY IF EXISTS "Permitir inserção pelo dono do relatório" ON report_shares;
DROP POLICY IF EXISTS "Permitir visualização pelo dono do relatório" ON report_shares;
DROP POLICY IF EXISTS "Permitir deleção pelo dono do relatório" ON report_shares;
DROP POLICY IF EXISTS "Gerenciamento pelo dono" ON report_shares;
DROP POLICY IF EXISTS "owner_access_shares" ON report_shares; -- Nome V2

-- 3. Habilitar RLS (garantia)
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_shares ENABLE ROW LEVEL SECURITY;

-- 4. Função auxiliar para acesso público (se não existir, cria ou substitui)
CREATE OR REPLACE FUNCTION check_report_access_public(p_report_id uuid)
RETURNS boolean
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM report_shares 
    WHERE report_id = p_report_id 
    AND expires_at > NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- Permissões da função
REVOKE ALL ON FUNCTION check_report_access_public FROM PUBLIC;
GRANT EXECUTE ON FUNCTION check_report_access_public TO anon;
GRANT EXECUTE ON FUNCTION check_report_access_public TO authenticated;

-- 5. Criar Políticas REPORTS
-- Acesso total ao dono
CREATE POLICY "owner_access_reports" ON reports
  FOR ALL
  USING (auth.uid() = user_id);

-- Acesso público (apenas SELECT) usando a função segura
CREATE POLICY "public_view_reports" ON reports
  FOR SELECT
  USING (
    check_report_access_public(id)
  );

-- 6. Criar Políticas REPORT_SHARES
-- Apenas dono pode gerenciar compartilhamentos
-- Verifica se o auth.uid() é dono do relatório associado
CREATE POLICY "owner_access_shares" ON report_shares
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM reports 
      WHERE reports.id = report_shares.report_id 
      AND reports.user_id = auth.uid()
    )
  );

-- IMPORTANTE:
-- As políticas acima NÃO causam recursão porque:
-- 1. "owner_access_reports" verifica user_id direto (sem joins)
-- 2. "public_view_reports" usa uma função SECURITY DEFINER (bypass RLS) para verificar shares
-- 3. "owner_access_shares" verifica reports, o que usará "owner_access_reports" (que é simples)
--    Ele NÃO ativará "public_view_reports" porque o contexto é do dono (authenticated)

COMMENT ON POLICY "owner_access_reports" ON reports IS 'Dono tem acesso total aos seus relatórios';
COMMENT ON POLICY "public_view_reports" ON reports IS 'Público pode ver relatórios compartilhados via função segura';
COMMENT ON POLICY "owner_access_shares" ON report_shares IS 'Dono pode gerenciar compartilhamentos dos seus relatórios';
