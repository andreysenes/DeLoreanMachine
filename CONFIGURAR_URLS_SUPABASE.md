# ⚙️ Configurar URLs no Dashboard Supabase - PASSO CRÍTICO

## 🚨 IMPORTANTE: Este passo é OBRIGATÓRIO para Magic Links funcionarem

### 📋 **Passo a Passo:**

1. **Acesse o Dashboard do Supabase:**
   - Vá para: https://supabase.com/dashboard
   - Selecione seu projeto: `byteptrzunaorkwsgvhk`

2. **Navegue para Authentication:**
   - No menu lateral, clique em **"Authentication"**
   - Clique em **"URL Configuration"**

3. **Configure Site URL:**
   ```
   Site URL: http://localhost:3000
   ```

4. **Configure Redirect URLs:**
   Adicione AMBAS as URLs abaixo na lista de **"Redirect URLs"**:
   ```
   http://localhost:3000/callback
   http://localhost:3000/dashboard
   ```

5. **Configurar Email Templates (Opcional mas Recomendado):**
   - Vá em **"Authentication" > "Email Templates"**
   - Selecione **"Magic Link"**
   - Certifique-se que o link aponta para: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink`

### ✅ **Verificação:**

Após configurar, teste:
1. Vá para http://localhost:3000/login
2. Insira um email real 
3. Clique "Enviar Magic Link"
4. Verifique se recebe o email
5. Clique no link do email
6. Deve redirecionar para `/callback` e depois `/dashboard`

---

## 🎯 **Resultado Esperado:**

- ✅ Email de Magic Link enviado para caixa real
- ✅ Link clicável que abre o sistema automaticamente
- ✅ Redirecionamento para dashboard sem inserir token
- ✅ Login persistente (não precisa fazer login novamente)

---

## 🔧 **Para Produção:**

Quando fazer deploy, substitua:
- `http://localhost:3000` → `https://seudominio.com`
- `http://localhost:3000/callback` → `https://seudominio.com/callback`
- `http://localhost:3000/dashboard` → `https://seudominio.com/dashboard`
