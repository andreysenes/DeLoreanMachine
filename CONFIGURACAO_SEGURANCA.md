# Instruções de Segurança e CORS - Supabase

Além das migrações de banco de dados, é importante configurar corretamente o projeto no Dashboard do Supabase para garantir segurança e funcionamento correto da autenticação.

## 1. Configuração de URL do Site e Redirecionamentos

Para que o fluxo de login e auth funcione corretamente, você deve configurar as URLs permitidas.

1.  Acesse o Dashboard do Supabase > **Authentication** > **URL Configuration**.
2.  **Site URL**: Defina como a URL principal da sua aplicação (ex: `http://localhost:3000` ou sua URL de produção `https://delorean-machine.vercel.app`).
3.  **Redirect URLs**: Adicione todas as URLs de callback que sua aplicação usa.
    *   `http://localhost:3000/**` (Para permitir redirecionamentos em desenvolvimento)
    *   `https://delorean-machine.vercel.app/**` (Para produção)

> **Importante**: Certifique-se de que não há espaços em branco extras.

## 2. Configuração de Email

1.  Acesse **Authentication** > **Email Templates**.
2.  Personalize os templates de "Confirm your signup", "Reset password", etc., para refletir a marca do DeLorean Machine se desejar.

## 3. Segurança de API (CORS e Headers)

O Supabase gerencia o CORS automaticamente para o cliente JS se configurado corretamente.

1.  Se estiver usando Functions (Edge Functions) no futuro, certifique-se de lidar com OPTIONS requests para CORS.
2.  As políticas RLS (row level security) que aplicamos no banco de dados (`sql/master_migration_v1.sql`) são a principal linha de defesa. Elas garantem que mesmo com a chave anônima (public key), um usuário mal-intencionado não consiga ler ou escrever dados de outros usuários.

## 4. Variáveis de Ambiente

Certifique-se de que no seu ambiente de produção (Vercel, etc) as variáveis de ambiente estejam definidas:

-   `NEXT_PUBLIC_SUPABASE_URL`
-   `NEXT_PUBLIC_SUPABASE_ANON_KEY`
-   `SUPABASE_SERVICE_ROLE_KEY` (Apenas se usar no lado do servidor em rotas de API protegidas, NUNCA exponha no cliente).

## 5. Monitoramento

Acesse **Reports** no dashboard para ver uso de API, erros de autenticação e latência de banco de dados. Configure alertas se disponível no seu plano.
