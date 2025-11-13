# 📧 Configurar Template de Email para Código OTP

## 🎯 **Problema**

A função `sendVerificationCode` está enviando Magic Links ao invés de códigos de 4 dígitos por email.

## 🔧 **Solução: Configurar Template no Supabase**

### **Passo 1: Acessar Templates de Email**
1. Abra o **painel do Supabase**
2. Vá para **Authentication → Email Templates**
3. Selecione **"Magic Link"** (é o template usado para OTP)

### **Passo 2: Customizar Template**
Substitua o template padrão por:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Seu código de verificação - DeLorean Machine</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
        .container { background: #f9f9f9; border-radius: 8px; padding: 30px; text-align: center; }
        .code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563eb; background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { font-size: 12px; color: #666; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔐 Código de Verificação</h1>
        <p>Use o código abaixo para fazer login no <strong>DeLorean Machine</strong>:</p>
        
        <div class="code">{{ .Token }}</div>
        
        <p>✅ <strong>Instruções:</strong></p>
        <ol style="text-align: left; display: inline-block;">
            <li>Volte para a página de login</li>
            <li>Insira este código de 4 dígitos</li>
            <li>Clique em "Verificar Código"</li>
        </ol>
        
        <p><strong>⏰ Este código expira em 10 minutos.</strong></p>
        
        <div class="footer">
            Se você não solicitou este código, ignore este email.<br>
            DeLorean Machine - Sistema de Controle de Horas
        </div>
    </div>
</body>
</html>
```

### **Passo 3: Configurar Assunto**
**Subject**: `Seu código de verificação: {{ .Token }} - DeLorean Machine`

### **Passo 4: Salvar Template**
Clique em **"Save"** para aplicar as mudanças.

## ⚙️ **Ajuste no Código (se necessário)**

Se ainda estiver enviando Magic Link, ajuste a função para forçar OTP:

```typescript
export const sendVerificationCode = async (email: string, isSignup: boolean = true) => {
  // ...
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: isSignup,
      // Não incluir emailRedirectTo para forçar OTP
    },
  });
  // ...
};
```

## 🧪 **Teste**

1. Execute a aplicação
2. Vá para `/login`
3. Insira email e clique "Enviar Código"
4. **Verifique o email recebido**:
   - ✅ Deve conter apenas o código de 4 dígitos
   - ✅ Deve ter instruções para voltar ao site
   - ❌ Não deve ter link clicável

## 📋 **Resultado Esperado**

**Email recebido:**
```
Assunto: Seu código de verificação: 1234 - DeLorean Machine

🔐 Código de Verificação
Use o código abaixo para fazer login no DeLorean Machine:

1234

✅ Instruções:
1. Volte para a página de login
2. Insira este código de 4 dígitos  
3. Clique em "Verificar Código"

⏰ Este código expira em 10 minutos.
```

---

**🎯 Com esta configuração, o email será limpo, direto e focado apenas no código de verificação.**
