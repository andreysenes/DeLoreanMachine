# DeLorean Machine - Sistema de Controle de Horas

Sistema completo de controle de horas para freelancers e times, desenvolvido com Next.js 14, TypeScript, Tailwind CSS e Supabase.

## 🚀 Funcionalidades

### ✅ Implementadas
- **Autenticação via Magic Link** - Login seguro por email
- **Dashboard Interativo** - Visão geral com resumos e métricas
- **Controle de Horas** - Registrar, editar e visualizar apontamentos
- **Gerenciamento de Projetos** - CRUD completo de projetos e clientes
- **Perfil de Usuário** - Configurações pessoais e metas de trabalho
- **Interface Responsiva** - Funciona em desktop e mobile
- **Tema Moderno** - Design minimalista com tons neutros

### 🔄 Placeholders para Integração
- Conexão com Supabase (estrutura pronta)
- Exportação CSV (interface implementada)
- Magic Link por email (fluxo completo)
- Gráficos e relatórios (área reservada)

## 🛠️ Tecnologias

- **Frontend**: Next.js 14 (App Router), TypeScript, React
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Auth, Database)
- **Formulários**: React Hook Form, Zod
- **Ícones**: Lucide React
- **Datas**: date-fns

## 📦 Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/andreysenes/DeLoreanMachine.git
cd DeLoreanMachine
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure o ambiente**
```bash
cp .env.example .env.local
```

Edite o arquivo `.env.local` com suas credenciais do Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SECRET_KEY=sua_chave_secreta
```

4. **Configure o Supabase (IMPORTANTE)**

⚠️ **As credenciais em `.env.local` são placeholders e inválidas.**

Para conectar com Supabase real:

a) Acesse [https://supabase.com/dashboard](https://supabase.com/dashboard)
b) Crie um novo projeto
c) Vá em **Settings > API**
d) Copie a **URL** e **anon public key**
e) Atualize `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seuprojetoid.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_publica_anonima
SUPABASE_SECRET_KEY=sua_chave_secreta
SUPABASE_SERVICE_ROLE=sua_service_role_key
```

f) Execute o script SQL: copie e cole o conteúdo de `sql/create_tables.sql` no **SQL Editor** do Supabase

**Modo Mock (Desenvolvimento):** Se não configurar o Supabase, o sistema usa dados de exemplo automaticamente.

5. **Execute o projeto**
```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## 🗄️ Configuração do Banco de Dados (Supabase)

### 1. Executar SQL no Supabase

Execute o arquivo `sql/create_tables.sql` no SQL Editor do Supabase Dashboard:

**Tabelas criadas:**
- `projects` - Projetos e clientes
- `time_entries` - Apontamentos de horas  
- `user_settings` - Configurações do usuário

**Features incluídas:**
- ✅ Row Level Security (RLS) 
- ✅ Triggers automáticos para `updated_at`
- ✅ Configurações padrão criadas automaticamente
- ✅ Índices para performance
- ✅ Validações de dados

### 2. Configurar Autenticação

No Supabase Dashboard:
1. Acesse **Authentication > Settings**
2. Habilite **Email confirmations**
3. Configure **Magic Link** como método de login
4. Adicione seu domínio em **Site URL**

## 📁 Estrutura do Projeto

```
src/
├── app/                    # App Router (Next.js 14)
│   ├── (auth)/login/      # Autenticação
│   ├── dashboard/         # Dashboard principal
│   ├── hours/             # Controle de horas
│   ├── projects/          # Gerenciar projetos
│   └── profile/           # Perfil do usuário
├── components/            # Componentes React
│   ├── ui/               # Componentes shadcn/ui
│   ├── layout/           # Layout e navegação
│   ├── auth/             # Componentes de autenticação
│   ├── dashboard/        # Componentes do dashboard
│   ├── hours/            # Componentes de horas
│   └── projects/         # Componentes de projetos
├── lib/                  # Utilitários e configurações
└── types/               # Tipos TypeScript
```

## 🎯 Como Usar

### 1. Primeiro Acesso
- Acesse a página de login
- Preencha nome, sobrenome e email
- Clique em "Enviar Magic Link"
- Use o token de verificação (placeholder)

### 2. Dashboard
- Visualize resumo diário e semanal
- Acompanhe progresso das metas
- Veja apontamentos recentes
- Acesse outras seções

### 3. Controle de Horas
- Registre novo apontamento
- Filtre por projeto ou função
- Edite ou exclua registros
- Visualize totais

### 4. Gerenciar Projetos
- Crie novos projetos
- Defina cliente e status
- Veja horas acumuladas
- Controle projetos ativos/inativos

### 5. Configurações
- Atualize dados pessoais
- Defina metas de trabalho
- Configure preferências
- Gerencie conta

## 🔧 Próximos Passos para Integração

### Supabase
1. Configurar autenticação Magic Link
2. Conectar operações CRUD
3. Implementar RLS (Row Level Security)
4. Configurar triggers para updated_at

### Features
1. Exportação CSV real
2. Gráficos com recharts
3. Notificações
4. Backup de dados
5. Relatórios avançados

## 🎨 Design System

- **Cores**: Tons neutros com acentos cromados
- **Tipografia**: Font system padrão, hierarquia clara
- **Componentes**: shadcn/ui com customizações
- **Layout**: Responsivo com sidebar + topbar
- **Ícones**: Lucide React, minimalistas

## 📱 Responsividade

- **Desktop**: Sidebar fixa + layout completo
- **Tablet**: Sidebar colapsável + ajustes de grid
- **Mobile**: Menu off-canvas + cards em stack

## 🚀 Deploy

### Vercel (Recomendado)
```bash
npm run build
vercel --prod
```

### Adicionar variáveis de ambiente no Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SECRET_KEY`

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

---

**Desenvolvido com ❤️ para otimizar o controle de tempo e aumentar a produtividade.**
