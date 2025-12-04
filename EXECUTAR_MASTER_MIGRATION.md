# Instruções para Executar o Master Migration V1

Este script `sql/master_migration_v1.sql` consolida toda a estrutura de banco de dados necessária para o projeto DeLorean Machine. Ele foi projetado para ser seguro de executar em bancos de dados novos ou existentes.

## Como Executar

1.  Acesse o Dashboard do Supabase do seu projeto.
2.  Navegue até o **SQL Editor** na barra lateral.
3.  Crie uma nova consulta (New query).
4.  Copie todo o conteúdo do arquivo `sql/master_migration_v1.sql` e cole no editor.
5.  Clique em **Run**.

## O que este script faz?

1.  **Estrutura de Tabelas**: Garante que todas as tabelas necessárias existam (`projects`, `time_entries`, `user_settings`, `user_profiles`, `user_preferences`, `clients`, `reports`, `report_shares`).
2.  **Segurança (RLS)**: Remove políticas antigas e recria políticas otimizadas que garantem que usuários só acessem seus próprios dados.
3.  **Functions & Triggers**: Instala ou atualiza funções de sistema (como atualização automática de `updated_at` e criação de dados padrão de usuário) e os triggers associados.
4.  **Sistema de Relatórios**: Instala as funções seguras para acesso público a relatórios via código/email (`verify_report_access`, `get_public_report`).
5.  **Índices**: Cria índices para otimizar a performance de consultas frequentes.

> **Nota**: Se você encontrar algum erro ao executar, geralmente é seguro executar novamente, pois o script tenta verificar a existência antes de criar objetos. Se o erro persistir, verifique a mensagem de erro específica.
