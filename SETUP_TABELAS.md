# 🛠️ Resolver Erro: Tabelas Não Existem

## 🚨 PROBLEMA ATUAL
```
Erro inesperado ao atualizar perfil: Could not find the table 'public.user_profiles' in the schema cache
```

**Causa**: As tabelas `user_profiles`, `user_settings` etc. não existem no banco Supabase.

## ✅ SOLUÇÃO RÁPIDA

### **Opção 1: Usar Interface Web do Supabase**

1. **Acesse**: https://supabase.com/dashboard
2. **Faça login** na sua conta
3. **Abra seu projeto**: `byteptrzunaorkwsgvhk` 
4. **Vá em "SQL Editor"**
5. **Clique "New Query"**
6. **Copie TUDO** do arquivo `sql/create_tables.sql` deste projeto
7. **Cole no editor** e clique **"Run"**

### **Opção 2: Via CLI (se tiver Supabase CLI instalado)**

```bash
# Instalar Supabase CLI (se não tiver)
npm install -g supabase

# Fazer login
supabase login

# Linkar projeto
supabase link --project-ref byteptrzunaorkwsgvhk

# Executar SQL
supabase db push
```

### **Opção 3: Usar psql Direto (senha necessária)**

```bash
# Conectar com a senha do projeto Supabase
psql "postgresql://postgres:[SUA_SENHA]@db.byteptrzunaorkwsgvhk.supabase.co:5432/postgres" -f sql/create_tables.sql
```

## 📋 TABELAS QUE SERÃO CRIADAS

- ✅ `user_profiles` - Dados pessoais (nome, sobrenome, etc)
- ✅ `user_settings` - Configurações (metas diárias, horários, etc)  
- ✅ `user_preferences` - Preferências (tema, idioma, etc)
- ✅ `projects` - Projetos e clientes
- ✅ `time_entries` - Apontamentos de horas
- ✅ **Políticas RLS** (isolamento por usuário)
- ✅ **Triggers automáticos** (updated_at, dados padrão)

## 🎯 APÓS EXECUTAR O SQL

1. **Recarregue a página** do projeto
2. **Teste salvar perfil** novamente
3. **Console deve mostrar**: `✅ Perfil atualizado com sucesso!`
4. **Dados irão persistir** após reload da página

## ⚡ VERIFICAR SUCESSO

No Supabase Dashboard → **Database** → **Tables**:
- Deve aparecer as 5 tabelas criadas
- `user_profiles`, `user_settings`, `user_preferences`, `projects`, `time_entries`

---

**Status**: ⏳ Aguardando criação das tabelas para resolver o erro
