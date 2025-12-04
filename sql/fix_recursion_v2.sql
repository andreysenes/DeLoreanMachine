-- Remover todas as políticas existentes para garantir limpeza total
DROP POLICY IF EXISTS "Permitir acesso público via link" ON reports;
DROP POLICY IF EXISTS "Permitir acesso pelo dono" ON reports;
DROP POLICY IF EXISTS "Acesso pelo dono" ON reports;
DROP POLICY IF EXISTS "Acesso público via link" ON reports;

DROP POLICY IF EXISTS "Permitir inserção pelo dono do relatório" ON report_shares;
DROP POLICY IF EXISTS "Permitir visualização pelo dono do relatório" ON report_shares;
DROP POLICY IF EXISTS "Permitir deleção pelo dono do relatório" ON report_shares;
DROP POLICY IF EXISTS "Gerenciamento pelo dono" ON report_shares;

-- Habilitar RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_shares ENABLE ROW LEVEL SECURITY;

-- 1. Políticas para REPORTS
-- Acesso total ao dono
CREATE POLICY "owner_access_reports" ON reports
  FOR ALL
  USING (auth.uid() = user_id);

-- Acesso público via função de segurança (evita recursão na política direta)
-- Em vez de verificar report_shares na política, vamos confiar na função get_public_report
-- que usamos no código, que é SECURITY DEFINER e bypassa o RLS.
-- Mas se precisarmos de acesso direto via SELECT (como no getReports), 
-- apenas o dono deve ver.
-- Para o acesso público (visualização), usaremos a função RPC que já criamos.

-- 2. Políticas para REPORT_SHARES
-- O problema de recursão acontece quando report_shares tenta ver reports
-- Vamos simplificar: permitir acesso se eu conseguir fazer um join com reports onde sou dono
-- MAS para evitar recursão, não vamos usar a tabela reports na política se possível.

-- Abordagem melhor: Adicionar user_id na tabela report_shares para evitar join
-- Mas como não podemos alterar o schema agora, vamos usar uma política que não trigger a política de reports

CREATE POLICY "owner_access_shares" ON report_shares
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM reports 
      WHERE reports.id = report_shares.report_id 
      AND reports.user_id = auth.uid()
    )
  );

-- IMPORTANTE: Para que a política acima funcione sem recursão, 
-- a política de SELECT em 'reports' NÃO pode depender de 'report_shares'.
-- Como removemos "Acesso público via link" que dependia de report_shares,
-- o ciclo foi quebrado.

-- Agora, para permitir o acesso público que o código precisa:
-- A função getReportPublicData usa uma RPC ou query direta?
-- No código atual (report-service.ts), usamos supabase.from('reports').select...
-- Isso vai falhar para usuários anônimos se não houver política.

-- Solução: Criar uma função SECURITY DEFINER para buscar o relatório público
-- Isso permite que código backend (supabase client) execute a query com privilégios elevados
-- sem expor a tabela reports diretamente para o mundo via RLS.

CREATE OR REPLACE FUNCTION get_report_by_id_public(p_report_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  start_date date,
  end_date date,
  status text,
  client_id uuid,
  user_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  project_ids text[]
) 
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se existe compartilhamento válido
  IF EXISTS (
    SELECT 1 FROM report_shares 
    WHERE report_id = p_report_id 
    AND expires_at > NOW()
  ) THEN
    -- Se existe, retornar o relatório
    RETURN QUERY SELECT 
      r.id, r.title, r.start_date, r.end_date, r.status, 
      r.client_id, r.user_id, r.created_at, r.updated_at, r.project_ids
    FROM reports r 
    WHERE r.id = p_report_id;
    
    -- Atualizar acesso
    UPDATE report_shares 
    SET last_access = NOW() 
    WHERE report_id = p_report_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Dar permissão de execução
GRANT EXECUTE ON FUNCTION get_report_by_id_public TO anon;
GRANT EXECUTE ON FUNCTION get_report_by_id_public TO authenticated;

-- Mas espere, o código Front-end usa .from('reports').select(...)
-- Para suportar isso SEM mudar o código Front-end novamente, precisamos da política RLS.
-- O truque para evitar recursão:
-- A política de REPORTS depende de REPORT_SHARES.
-- A política de REPORT_SHARES depende de REPORTS.
-- Ciclo!

-- Como quebrar:
-- Permitir SELECT em report_shares para TODOS (public), mas filtrar apenas os válidos?
-- Não, segurança ruim.

-- Melhor solução:
-- Criar uma view ou função que não tenha RLS para ser usada na verificação.
-- Ou, mais simples: O dono do relatório vê seus compartilhamentos. 
-- O público NÃO precisa ver a tabela report_shares diretamente via API.
-- O público só precisa ver o REPORT se existir um share.

-- Então:
-- 1. Reports: Dono vê tudo. Público vê SE existir share válido (bypass RLS na verificação).
-- 2. Report_Shares: Apenas dono vê/edita.

-- Vamos redefinir as políticas de forma segura:

-- Política "Acesso Público" em Reports que NÃO causa recursão
-- O problema é verificar report_shares que verifica reports...
-- Vamos usar uma função SECURITY DEFINER dentro da política!

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

-- Agora a política usa a função segura
CREATE POLICY "public_view_reports" ON reports
  FOR SELECT
  USING (
    check_report_access_public(id)
  );

-- E a política do dono
-- Já definida acima como "owner_access_reports"

-- E para report_shares, mantemos a verificação do dono
-- Como a função check_report_access_public é SECURITY DEFINER, ela não aciona as políticas de report_shares
-- PORTANTO, NÃO HÁ RECURSÃO!

-- Ajustando permissões da função
REVOKE ALL ON FUNCTION check_report_access_public FROM PUBLIC;
GRANT EXECUTE ON FUNCTION check_report_access_public TO anon;
GRANT EXECUTE ON FUNCTION check_report_access_public TO authenticated;

COMMENT ON FUNCTION check_report_access_public IS 'Verifica acesso público sem causar recursão RLS';
