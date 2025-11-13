# 🚀 EXECUTAR SQL NO SUPABASE - PASSO A PASSO

## 🎯 OBJETIVO
Criar as tabelas necessárias para resolver o erro:
```
Could not find the table 'public.user_profiles' in the schema cache
```

## 📋 INSTRUÇÕES DETALHADAS

### **1. Acesse o Dashboard**
1. Vá para: https://supabase.com/dashboard
2. Faça login na sua conta
3. Selecione o projeto: `byteptrzunaorkwsgvhk`

### **2. Abrir Editor SQL**
1. No menu lateral esquerdo, clique em **"SQL Editor"**
2. Clique no botão **"New query"**
3. Uma nova aba de consulta será aberta

### **3. Copiar e Colar o SQL**
1. Abra o arquivo `sql/create_tables.sql` deste projeto
2. **SELECIONE TODO O CONTEÚDO** (Cmd+A / Ctrl+A)
3. **COPIE** (Cmd+C / Ctrl+C)
4. **COLE NO EDITOR DO SUPABASE** (Cmd+V / Ctrl+V)

### **4. Executar o Script**
1. Clique no botão **"Run"** (▶️) no canto inferior direito
2. Aguarde a execução (pode demorar alguns segundos)
3. Se tudo der certo, verá mensagens de sucesso

### **5. Verificar Criação das Tabelas**
1. No menu lateral, clique em **"Database"** → **"Tables"**
2. Deve aparecer as seguintes tabelas:
   - ✅ `projects`
   - ✅ `time_entries`
   - ✅ `user_settings`
   - ✅ `user_profiles`
   - ✅ `user_preferences`

## ⚡ APÓS EXECUTAR

### **1. Recarregar a Aplicação**
```bash
# Se o npm run dev estiver rodando, pare com Ctrl+C e inicie novamente
npm run dev
```

### **2. Testar Página de Perfil**
1. Acesse: http://localhost:3000/profile
2. Tente salvar dados no formulário
3. **Console deve mostrar**: `✅ Perfil atualizado com sucesso!`
4. **Dados devem persistir** após reload da página

## 🎊 CONFIRMAÇÃO DE SUCESSO

Se tudo funcionou:
- ❌ Erro: `Could not find table 'public.user_profiles'`
- ✅ Mensagem: `✅ Perfil atualizado com sucesso!`
- ✅ Dados salvam e persistem entre reloads
- ✅ Sistema passa a usar dados reais (não mais mock data)

---

## 📝 IMPORTANTE

- **Script é idempotente**: Pode executar várias vezes sem problemas
- **RLS ativado**: Cada usuário só vê seus próprios dados
- **Triggers automáticos**: updated_at funciona automaticamente
- **Dados padrão**: Criados automaticamente para novos usuários
