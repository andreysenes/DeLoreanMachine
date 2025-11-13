# 📊 Funcionalidade de Exportação CSV

## 🎯 **Visão Geral**

O DeLorean Machine possui funcionalidade completa de exportação de dados em formato CSV, permitindo que usuários extraiam seus dados para análise externa, backup ou relatórios.

## 🚀 **Funcionalidades Disponíveis**

### 1. **Exportação de Apontamentos de Horas**
- **Dados inclusos**: Data, Projeto ID, Função, Descrição, Horas, Data de Criação
- **Formato de data**: DD/MM/AAAA (padrão brasileiro)
- **Nome do arquivo**: `apontamentos-YYYY-MM-DD.csv`

### 2. **Exportação de Projetos**
- **Dados inclusos**: Nome, Cliente, Status, Descrição, Data de Criação
- **Nome do arquivo**: `projetos-YYYY-MM-DD.csv`

### 3. **Relatório Semanal**
- **Dados inclusos**: Data, Dia da Semana, Horas Trabalhadas, Número de Apontamentos
- **Período**: Semana atual (domingo a sábado)
- **Inclui total semanal** no final do arquivo
- **Nome do arquivo**: `relatorio-semanal-YYYY-MM-DD.csv`

## 🎨 **Interface de Usuário**

### **Localização dos Botões**

1. **Topbar** (barra superior):
   - Botão dropdown "Exportar" 
   - Visível apenas em desktop (oculto em mobile)
   - Acesso a todas as opções de exportação

2. **Página de Horas** (`/hours`):
   - Botão dropdown no canto superior direito
   - Contextual para apontamentos de horas

3. **Página de Projetos** (`/projects`):
   - Botão dropdown no canto superior direito  
   - Contextual para projetos

### **Componente ExportButtons**

```tsx
// Uso como dropdown (padrão)
<ExportButtons variant="dropdown" size="sm" />

// Uso como botão simples (só exporta apontamentos)
<ExportButtons variant="button" size="default" />
```

## 🔧 **Implementação Técnica**

### **Arquivos Principais**

- **Componente**: `src/components/export/export-buttons.tsx`
- **Função base**: `exportToCSV()` em `src/lib/supabase-client.ts`
- **Dados**: Usa funções reais do Supabase (não mock)

### **Fluxo de Exportação**

1. **Buscar dados** via `getTimeEntries()`, `getProjects()` ou `calculateWeeklySummary()`
2. **Verificar se há dados** para exportar
3. **Formatar dados** para estrutura CSV adequada
4. **Gerar arquivo** com headers em português
5. **Download automático** via browser

### **Tratamento de Dados**

```typescript
// Exemplo: Formatação de apontamentos
const csvData = timeEntries.map(entry => ({
  'Data': new Date(entry.data).toLocaleDateString('pt-BR'),
  'Projeto ID': entry.project_id,
  'Função': entry.funcao,
  'Descrição': entry.descricao || '',
  'Horas': entry.horas,
  'Criado em': new Date(entry.created_at).toLocaleString('pt-BR')
}));
```

### **Estados e Validações**

- ✅ **Loading state**: Botão mostra "Exportando..." durante processo
- ✅ **Validação de dados**: Alerta se não há dados para exportar  
- ✅ **Tratamento de erros**: Try/catch com mensagens user-friendly
- ✅ **Escape de CSV**: Strings com vírgulas são automaticamente escapadas

## 🧪 **Como Testar**

### **Pré-requisitos**
- Ter dados reais no Supabase (apontamentos e/ou projetos)
- Estar logado na aplicação

### **Roteiro de Teste**

1. **Teste no Topbar**:
   - Clique no botão "Exportar" na barra superior
   - Teste cada opção do dropdown
   - Verifique se arquivos são baixados

2. **Teste na Página de Horas**:
   - Vá para `/hours`
   - Clique no botão "Exportar" no canto superior direito
   - Teste exportação de apontamentos

3. **Teste na Página de Projetos**:
   - Vá para `/projects`  
   - Clique no botão "Exportar" no canto superior direito
   - Teste exportação de projetos

4. **Validação dos Arquivos**:
   - Abra os CSVs em Excel/Google Sheets
   - Verifique se headers estão em português
   - Verifique se dados estão formatados corretamente
   - Confirme datas no formato brasileiro (DD/MM/AAAA)

## 📋 **Formatos de CSV**

### **Apontamentos de Horas**
```csv
Data,Projeto ID,Função,Descrição,Horas,Criado em
11/12/2024,uuid-123,Desenvolvimento,Bug fix login,2.5,11/12/2024 14:30:15
```

### **Projetos**  
```csv
Nome,Cliente,Status,Descrição,Criado em
Site Corporativo,Empresa XYZ,Ativo,Desenvolvimento do site,10/12/2024
```

### **Relatório Semanal**
```csv
Data,Dia da Semana,Horas Trabalhadas,Número de Apontamentos
08/12/2024,domingo,0,0
09/12/2024,segunda-feira,8,4
...
TOTAL SEMANAL,08/12/2024 - 14/12/2024,32,15
```

## 🚀 **Vantagens**

- ✅ **Dados reais**: Conectado ao Supabase, não usa mocks
- ✅ **Múltiplos formatos**: 3 tipos diferentes de exportação
- ✅ **Interface integrada**: Botões em locais contextuais
- ✅ **Formato brasileiro**: Datas e texto em pt-BR
- ✅ **Experiência fluída**: Loading states e validações
- ✅ **Reutilizável**: Componente flexível com props

---

**🎉 A funcionalidade está completa e pronta para uso!**
