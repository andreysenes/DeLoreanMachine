-- Primeiro, remover todas as políticas existentes
DROP POLICY IF EXISTS "Permitir acesso público via link" ON reports;
DROP POLICY IF EXISTS "Permitir acesso pelo dono" ON reports;
DROP POLICY IF EXISTS "Permitir inserção pelo dono do relatório" ON report_shares;
DROP POLICY IF EXISTS "Permitir visualização pelo dono do relatório" ON report_shares;
DROP POLICY IF EXISTS "Permitir deleção pelo dono do relatório" ON report_shares;

-- Habilitar RLS nas tabelas
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_shares ENABLE ROW LEVEL SECURITY;

-- Políticas para a tabela reports
CREATE POLICY "Acesso pelo dono" ON reports
  FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Acesso público via link" ON reports
  FOR SELECT
  USING (
    id IN (
      SELECT report_id 
      FROM report_shares 
      WHERE expires_at > NOW()
    )
  );

-- Políticas para a tabela report_shares
CREATE POLICY "Gerenciamento pelo dono" ON report_shares
  FOR ALL
  USING (
    report_id IN (
      SELECT id 
      FROM reports 
      WHERE user_id = auth.uid()
    )
  );

-- Comentários para documentação
COMMENT ON POLICY "Acesso pelo dono" ON reports IS 'Permite que o dono do relatório tenha acesso total';
COMMENT ON POLICY "Acesso público via link" ON reports IS 'Permite acesso público a relatórios que possuem compartilhamento ativo';
COMMENT ON POLICY "Gerenciamento pelo dono" ON report_shares IS 'Permite que o dono do relatório gerencie seus compartilhamentos';
