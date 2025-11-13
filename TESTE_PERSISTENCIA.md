# 🧪 Teste de Persistência - Configurações do Usuário

## 📋 **Roteiro de Teste Completo**

### 1. **Preparação do Ambiente**
```bash
# Certifique-se da aplicação rodando
cd delorean-machine
npm run dev
```

### 2. **Acesso à Página de Perfil**
- Abra: http://localhost:3000/profile
- Abra o Console do navegador (F12 → Console)

### 3. **Teste de Carregamento**
**O que observar no console:**
```
🔧 Supabase Status: CONFIGURADO
⚙️ Carregando configurações... (não deve ter erro 406)
```

**Se aparecer erro 406/PGRST116:**
- Execute no SQL Editor do Supabase: `SELECT pg_notify('pgrst', 'reload schema');`

### 4. **Teste de Persistência - Passo a Passo**

#### 4.1 **Alterar Metas de Horas**
- Clique na aba "Metas de Horas"
- Valores atuais (padrão):
  - Meta Diária: 6
  - Meta Semanal: 30
  - Início: 09:00
  - Fim: 17:00

#### 4.2 **Modificar Valores**
- Altere Meta Diária para: **8**
- Altere Meta Semanal para: **40**
- Altere Início para: **08:00**
- Altere Fim para: **18:00**

#### 4.3 **Salvar**
- Clique "Salvar Metas"
- Deve aparecer alert: "Metas atualizadas com sucesso!"
- Console deve mostrar: `Atualizando metas: {dailyGoal: 8, weeklyGoal: 40, ...}`

#### 4.4 **Verificar Persistência**
- **Recarregue a página** (F5 ou Ctrl+R)
- Os campos devem manter os novos valores:
  - Meta Diária: **8** ✅
  - Meta Semanal: **40** ✅  
  - Início: **08:00** ✅
  - Fim: **18:00** ✅

### 5. **Teste no Banco de Dados**
No SQL Editor do Supabase, execute:
```sql
SELECT * FROM user_settings;
```

**Resultado esperado:**
```
user_id | daily_goal | weekly_goal | work_start_time | work_end_time
--------|------------|-------------|-----------------|---------------
uuid... |     8      |     40      |     08:00       |     18:00
```

### 6. **Teste de Nova Sessão**
- Feche o navegador completamente
- Abra novamente: http://localhost:3000/profile
- Vá para "Metas de Horas"
- Valores devem permanecer salvos

## ✅ **Checklist de Validação**

- [ ] Console sem erros 406/PGRST116
- [ ] Formulário carrega com valores padrão ou salvos
- [ ] Alteração de valores funciona
- [ ] "Salvar Metas" mostra sucesso
- [ ] **Reload da página**: valores persistem
- [ ] **Nova sessão**: valores persistem
- [ ] SQL Editor mostra registro na tabela

## ⚠️ **Troubleshooting**

### Problema: Valores não persistem
**Solução:**
1. Verifique console: logs de erro?
2. Execute: `SELECT pg_notify('pgrst', 'reload schema');`
3. Confirme usuário logado: vá ao painel Auth do Supabase

### Problema: Erro 406 persiste
**Solução:**
1. Reinicie aplicação: `npm run dev`
2. Clear cache do navegador
3. Verifique variáveis no `.env.local`

---

**🎯 Sucesso = Valores persistem após reload da página!**
