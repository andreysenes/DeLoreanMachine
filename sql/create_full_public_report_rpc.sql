-- Função robusta para retornar relatório público completo com todos os dados relacionados
-- Bypass total de RLS para leitura pública controlada
CREATE OR REPLACE FUNCTION get_full_public_report(p_report_id UUID)
RETURNS TABLE (
  report json,
  client json,
  entries json
) 
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Verificar se existe um compartilhamento ativo
  IF NOT EXISTS (
    SELECT 1 
    FROM report_shares 
    WHERE report_id = p_report_id 
    AND expires_at > NOW()
  ) THEN
    -- Se não existe ou expirou, não retorna nada
    RETURN;
  END IF;

  -- 2. Atualizar último acesso
  UPDATE report_shares 
  SET last_access = NOW() 
  WHERE report_id = p_report_id;

  -- 3. Retornar dados estruturados
  RETURN QUERY
  WITH report_data AS (
    SELECT 
      json_build_object(
        'id', r.id,
        'title', r.title,
        'start_date', r.start_date,
        'end_date', r.end_date,
        'status', r.status,
        'created_at', r.created_at
      ) as report_json,
      CASE 
        WHEN c.id IS NOT NULL THEN
          json_build_object(
            'id', c.id,
            'nome', c.nome,
            'cnpj', c.cnpj
          )
        ELSE NULL
      END as client_json,
      COALESCE(
        (
          SELECT json_agg(
            json_build_object(
              'id', te.id,
              'data', te.data,
              'project_name', p.nome,
              'funcao', te.funcao,
              'descricao', te.descricao,
              'horas', te.horas
            ) ORDER BY te.data DESC
          )
          FROM time_entries te
          LEFT JOIN projects p ON p.id = te.project_id
          WHERE 
            te.user_id = r.user_id -- Garantir que pertence ao mesmo usuário
            AND te.data BETWEEN r.start_date AND r.end_date
            AND (
              r.project_ids IS NULL 
              OR te.project_id = ANY(r.project_ids)
            )
        ),
        '[]'::json
      ) as entries_json
    FROM reports r
    LEFT JOIN clients c ON c.id = r.client_id
    WHERE r.id = p_report_id
  )
  SELECT 
    report_json,
    client_json,
    entries_json
  FROM report_data;
END;
$$ LANGUAGE plpgsql;

-- Configurar permissões
REVOKE ALL ON FUNCTION get_full_public_report FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_full_public_report TO anon;
GRANT EXECUTE ON FUNCTION get_full_public_report TO authenticated;

COMMENT ON FUNCTION get_full_public_report IS 'Retorna dados completos do relatório público se houver compartilhamento ativo';
