-- Remover colunas desnecessárias da tabela report_shares
ALTER TABLE report_shares
DROP COLUMN IF EXISTS email,
DROP COLUMN IF EXISTS access_code;

-- Atualizar a função de verificação de acesso
DROP FUNCTION IF EXISTS verify_report_access;
DROP FUNCTION IF EXISTS get_public_report;

-- Nova função para obter relatório público
CREATE OR REPLACE FUNCTION get_public_report(p_report_id UUID)
RETURNS TABLE (
  report json,
  client json,
  entries json
) AS $$
BEGIN
  -- Verificar se existe um compartilhamento ativo
  IF NOT EXISTS (
    SELECT 1 
    FROM report_shares 
    WHERE report_id = p_report_id 
    AND expires_at > NOW()
  ) THEN
    RETURN;
  END IF;

  -- Atualizar último acesso
  UPDATE report_shares 
  SET last_access = NOW() 
  WHERE report_id = p_report_id 
  AND expires_at > NOW();

  RETURN QUERY
  WITH report_data AS (
    SELECT 
      json_build_object(
        'id', r.id,
        'title', r.title,
        'start_date', r.start_date,
        'end_date', r.end_date,
        'status', r.status
      ) as report,
      json_build_object(
        'id', c.id,
        'nome', c.nome,
        'cnpj', c.cnpj
      ) as client,
      COALESCE(
        json_agg(
          json_build_object(
            'id', te.id,
            'data', te.data,
            'project_name', p.nome,
            'funcao', te.funcao,
            'descricao', te.descricao,
            'horas', te.horas
          ) ORDER BY te.data DESC
        ) FILTER (WHERE te.id IS NOT NULL),
        '[]'::json
      ) as entries
    FROM reports r
    LEFT JOIN clients c ON c.id = r.client_id
    LEFT JOIN time_entries te ON 
      te.data BETWEEN r.start_date AND r.end_date
      AND (
        r.project_ids IS NULL 
        OR te.project_id = ANY(r.project_ids)
      )
    LEFT JOIN projects p ON p.id = te.project_id
    WHERE r.id = p_report_id
    GROUP BY r.id, c.id
  )
  SELECT * FROM report_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atualizar permissões
REVOKE ALL ON FUNCTION get_public_report FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_public_report TO authenticated;
GRANT EXECUTE ON FUNCTION get_public_report TO anon;

-- Atualizar políticas de segurança
DROP POLICY IF EXISTS "Permitir acesso público via código" ON reports;
CREATE POLICY "Permitir acesso público via link" ON reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM report_shares 
      WHERE report_id = id 
      AND expires_at > NOW()
    )
  );

-- Atualizar políticas da tabela report_shares
DROP POLICY IF EXISTS "Permitir inserção pelo dono do relatório" ON report_shares;
DROP POLICY IF EXISTS "Permitir visualização pelo dono do relatório" ON report_shares;
DROP POLICY IF EXISTS "Permitir deleção pelo dono do relatório" ON report_shares;

CREATE POLICY "Permitir inserção pelo dono do relatório" ON report_shares
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM reports 
      WHERE id = report_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Permitir visualização pelo dono do relatório" ON report_shares
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM reports 
      WHERE id = report_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Permitir deleção pelo dono do relatório" ON report_shares
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 
      FROM reports 
      WHERE id = report_id 
      AND user_id = auth.uid()
    )
  );

-- Comentários para documentação
COMMENT ON FUNCTION get_public_report IS 'Retorna os dados do relatório para visualização pública se existir um compartilhamento ativo';
COMMENT ON TABLE report_shares IS 'Armazena os compartilhamentos de relatórios';
