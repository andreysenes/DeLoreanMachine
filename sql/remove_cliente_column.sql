-- Remove a coluna 'cliente' da tabela projects
-- IMPORTANTE: Certifique-se de que todos os projetos tenham um client_id válido antes de executar

-- Primeiro, verificar projetos sem client_id
SELECT id, nome, cliente 
FROM projects 
WHERE client_id IS NULL;

-- Verificar se existem projetos sem client_id
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM projects WHERE client_id IS NULL) THEN
    RAISE EXCEPTION 'Existem projetos sem client_id. Por favor, atualize todos os projetos com um client_id válido antes de prosseguir.';
  END IF;
END $$;

-- Se não houver projetos sem client_id, remover a coluna cliente e tornar client_id NOT NULL
ALTER TABLE projects DROP COLUMN cliente;
ALTER TABLE projects ALTER COLUMN client_id SET NOT NULL;
