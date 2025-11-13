# 🚀 Como Configurar Supabase Real - Guia Completo

## ⚠️ SITUAÇÃO ATUAL
- Sistema rodando em **modo MOCK** 
- Credenciais em `.env.local` são **placeholders inválidos**
- Para usar dados reais, precisa configurar Supabase real

## 📋 PASSO A PASSO - CONFIGURAÇÃO SUPABASE

### 1. ✅ Criar Projeto no Supabase

1. Acesse: https://supabase.com/dashboard
2. Clique em "**New Project**"
3. Escolha organização (ou crie uma)
4. Preencha:
   - **Project Name**: `delorean-machine` (ou nome desejado)
   - **Database Password**: Senha segura (guarde bem!)
   - **Region**: Brazil (São Paulo) ou mais próxima
5. Clique "**Create new project**"
6. **Aguarde 2-3 minutos** para projeto ser criado

### 2. ✅ Obter Credenciais

**No Dashboard do Supabase:**
1. Vá em "**Settings**" → "**API**"
2. Copie as seguintes informações:
   - **Project URL**: `https://[seu-projeto].supabase.co`
   - **anon public**: Chave anônima pública
   - **service_role**: Chave de serviço (secreta)

### 3. ✅ Atualizar .env.local

Substitua no arquivo `.env.local`:

```env
# Supabase Configuration - CREDENCIAIS REAIS
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_real
SUPABASE_SECRET_KEY=sua_chave_secreta_real
SUPABASE_SERVICE_ROLE=sua_service_role_real
```

### 4. ✅ Executar SQL no Supabase

**No Dashboard do Supabase:**
1. Vá em "**SQL Editor**"
2. Clique "**New query**"
3. **Copie TODO o conteúdo** do arquivo `sql/create_tables.sql`
4. **Cole no editor SQL**
5. Clique "**Run**" para executar

**Tabelas que serão criadas:**
- `projects` - Projetos e clientes
- `time_entries` - Apontamentos de horas
- `user_settings` - Configurações do usuário
- **+ Políticas RLS + Triggers + Índices**

### 5. ✅ Configurar Autenticação Magic Link

**No Dashboard do Supabase:**
1. Vá em "**Authentication**" → "**Settings**"
2. Em "**Auth Settings**":
   - ✅ Marque **"Enable email confirmations"**
   - ✅ Marque **"Enable Magic Link"**
3. Em "**Site URL**":
   - Adicione: `http://localhost:3000`
   - Para produção: seu domínio real
4. Em "**Redirect URLs**":
   - Adicione: `http://localhost:3000/dashboard`

### 6. ✅ Reiniciar Aplicação

```bash
# No terminal do projeto
npm run dev
```

**Verificar logs:**
- ❌ `🔧 Supabase Status: USANDO DADOS MOCK` (antes)
- ✅ `🔧 Supabase Status: CONECTADO` (depois)

---

## 🎯 RESULTADO FINAL

### ✅ **Com Supabase Real:**
- **Autenticação**: Magic Links reais por email
- **Dados persistentes**: Projetos e horas salvos no banco
- **Multi-usuário**: Cada usuário vê apenas seus dados
- **Segurança**: Row Level Security (RLS) ativo
- **Performance**: Consultas otimizadas

### ✅ **Funcionalidades Habilitadas:**
- 📧 **Magic Link real** (emails enviados)
- 💾 **CRUD completo** (Create, Read, Update, Delete)
- 👤 **Usuários reais** (não mais mock)
- 🔒 **Segurança** (isolamento por usuário)
- 📊 **Relatórios reais** (dados persistentes)

---

## 🚨 IMPORTANTE

1. **Guarde as credenciais** em local seguro
2. **Não compartilhe** as chaves service_role
3. **Use .env.local** (já no .gitignore)
4. **Para produção**: Configure domínio real no Supabase

---

## 🎊 APÓS CONFIGURAÇÃO

O sistema funcionará **exatamente igual**, mas com **dados reais persistentes** no lugar dos dados mock!

**URL para testar**: http://localhost:3000
