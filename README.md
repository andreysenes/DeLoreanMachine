# DeLorean Machine - Sistema de Controle de Horas

Sistema completo e profissional de controle de horas para freelancers e times, desenvolvido com Next.js 16, TypeScript, Tailwind CSS 4 e Supabase.

## 🚀 Funcionalidades

### ✅ Implementadas

#### 🔐 Autenticação e Segurança
- **Autenticação via Magic Link (OTP)** - Login seguro via código enviado por email
- **Row Level Security (RLS)** - Isolamento completo de dados por usuário
- **Sessão Persistente** - Login mantido entre sessões
- **Gestão de Tokens** - Refresh automático e gerenciamento seguro

#### 📊 Dashboard e Visualização
- **Dashboard Interativo** - Visão geral com resumos diários e semanais
- **Métricas em Tempo Real** - Progresso de metas, horas trabalhadas, projetos ativos
- **Apontamentos Recentes** - Lista dos últimos registros de horas
- **Cards Resumo** - Total de horas do dia, semana e progresso das metas

#### ⏰ Controle de Horas
- **Registro de Apontamentos** - Adicione horas trabalhadas por projeto e função
- **Calendário Visual** - Visualize apontamentos em formato de calendário mensal
- **Tabela de Apontamentos** - Lista completa com filtros e busca
- **Edição e Exclusão** - Gerencie seus registros facilmente
- **Validação de Dados** - Prevenção de erros e dados inconsistentes

#### 📁 Gerenciamento de Projetos
- **CRUD Completo** - Criar, ler, atualizar e excluir projetos
- **Gestão de Status** - Ative/desative projetos conforme necessário
- **Associação com Clientes** - Vincule projetos a clientes cadastrados
- **Horas Acumuladas** - Visualize total de horas por projeto
- **Filtros e Busca** - Encontre projetos rapidamente

#### 👥 Gestão de Clientes
- **Cadastro de Clientes** - Gerencie informações completas de clientes
- **Dados Contratuais** - CNPJ, tipo de serviço, horas contratadas
- **Contratos** - Controle de datas de início e conclusão
- **Associação com Projetos** - Vincule projetos aos clientes

#### 📄 Sistema de Relatórios
- **Criação de Relatórios** - Gere relatórios personalizados por período
- **Compartilhamento Seguro** - Compartilhe relatórios via link
- **Visualização Pública** - Clientes podem visualizar relatórios sem login
- **Filtros Avançados** - Por cliente, projeto e período
- **Arquivamento** - Organize relatórios antigos

#### 👤 Perfil e Configurações
- **Dados Pessoais** - Nome, sobrenome e email (com atualização via Auth API)
- **Metas de Trabalho** - Defina metas diárias e semanais
- **Horários de Trabalho** - Configure início e fim do expediente
- **Preferências Pessoais** - Tema, idioma, primeiro dia da semana, formato de exportação
- **Configurações do Sistema** - Fuso horário, formato de hora e data
- **Salvamento Automático** - Todas as configurações são salvas automaticamente com debounce
- **Toast com Desfazer** - Notificações com opção de reverter alterações

#### 🎨 Interface e UX
- **Dark Mode Completo** - Alternância entre tema claro/escuro com persistência
- **Tema System** - Segue preferência do sistema operacional
- **Interface Responsiva** - Funciona perfeitamente em desktop, tablet e mobile
- **Design Moderno** - UI minimalista com tons neutros e componentes shadcn/ui
- **Navegação Intuitiva** - Sidebar fixa no desktop, bottom nav no mobile
- **Animações Suaves** - Transições otimizadas com Framer Motion
- **Notificações Toast** - Sistema de notificações elegante com Sonner

#### ⚡ Performance e Otimização
- **Sistema de Cache Local** - Performance otimizada com cache em localStorage
- **Debounce Inteligente** - Salvamento automático após 1 segundo de inatividade
- **Lazy Loading** - Carregamento sob demanda de componentes
- **Otimização de Queries** - Índices no banco para consultas rápidas
- **Cache Hit Rate** - ~95% para dados frequentemente acessados

#### 📤 Exportação e Backup
- **Exportação CSV** - Exporte apontamentos, projetos e relatórios
- **Backup de Dados** - Mantenha cópias de segurança dos seus dados
- **Formato Personalizado** - Escolha o formato de exportação preferido

## 🛠️ Stack Tecnológica

### Frontend
- **Next.js 16.0.10** - Framework React com App Router e Server Components
- **React 19.2.3** - Biblioteca UI com React Compiler
- **TypeScript 5** - Tipagem estática para segurança de código
- **Tailwind CSS 4** - Framework CSS utility-first
- **shadcn/ui** - Componentes UI acessíveis e customizáveis
- **Framer Motion 12.23.24** - Animações e transições

### Backend e Banco de Dados
- **Supabase** - Backend as a Service (BaaS)
- **PostgreSQL** - Banco de dados relacional
- **Row Level Security (RLS)** - Segurança a nível de linha
- **Triggers Automáticos** - Atualização de timestamps e dados padrão

### Formulários e Validação
- **React Hook Form 7.66.0** - Gerenciamento de formulários performático
- **Zod 4.1.12** - Validação de schemas TypeScript-first
- **@hookform/resolvers 5.2.2** - Integração React Hook Form + Zod

### UI e Componentes
- **Radix UI** - Componentes primitivos acessíveis
  - Dialog, Dropdown, Select, Tabs, Tooltip, Avatar, Checkbox, Progress
- **Lucide React 0.553.0** - Ícones modernos e minimalistas
- **Sonner 2.0.7** - Sistema de notificações toast elegante
- **next-themes 0.4.6** - Gerenciamento de tema dark/light

### Utilitários
- **date-fns 4.1.0** - Manipulação e formatação de datas
- **recharts 3.4.1** - Gráficos e visualizações (preparado para uso)
- **class-variance-authority 0.7.1** - Variantes de componentes
- **clsx 2.1.1** - Utilitário para classes CSS condicionais
- **tailwind-merge 3.4.0** - Merge inteligente de classes Tailwind

## 📦 Instalação

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn
- Conta no Supabase (para produção)

### Passo a Passo

1. **Clone o repositório**
```bash
git clone https://github.com/andreysenes/DeLoreanMachine.git
cd DeLoreanMachine
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**

Crie um arquivo `.env.local` na raiz do projeto:

```env
# URLs e Chaves Públicas (podem ser expostas no cliente)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_sua_chave

# Chaves Secretas (NUNCA expor no cliente - apenas servidor/scripts)
SUPABASE_SECRET_KEY=sb_secret_sua_chave
```

4. **Configure o Supabase**

📋 **Siga o guia completo**: [`SUPABASE_SETUP.md`](SUPABASE_SETUP.md)

**Resumo rápido:**
- Crie um projeto no [Supabase Dashboard](https://supabase.com/dashboard)
- Copie as credenciais para `.env.local`
- Execute o script SQL `sql/master_migration_v1.sql` no SQL Editor
- Configure autenticação Magic Link nas configurações

5. **Execute o projeto**
```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

#### `user_profiles`
Perfis de usuário com dados pessoais
- `first_name`, `last_name`, `phone`, `role`, `avatar_url`, `bio`, `location`, `website`
- `full_name` (gerado automaticamente)

#### `user_settings`
Configurações de trabalho e sistema
- Metas: `daily_goal`, `weekly_goal`
- Horários: `work_start_time`, `work_end_time`
- Sistema: `timezone`, `hour_format`, `date_format`

#### `user_preferences`
Preferências pessoais do usuário
- Interface: `theme`, `language`, `week_start_day`
- Notificações: `notifications_email`, `notifications_push`, `notifications_reminders`
- Funcionalidades: `auto_track`, `show_decimal_hours`, `export_format`

#### `clients`
Cadastro de clientes
- `nome`, `cnpj`, `tipo_servico`, `horas_contratadas`
- `contrato_id`, `data_inicio`, `data_conclusao`

#### `projects`
Projetos do usuário
- `nome`, `cliente`, `status` (ativo/inativo)
- `client_id` (opcional, referência a clients)
- `descricao`

#### `time_entries`
Apontamentos de horas trabalhadas
- `project_id`, `funcao`, `descricao`
- `horas`, `data`
- Relacionado com `projects`

#### `reports`
Relatórios gerados
- `title`, `client_id`, `project_ids[]`
- `start_date`, `end_date`, `status` (active/archived)

#### `report_shares`
Compartilhamentos de relatórios
- `report_id`, `email`, `access_code`
- `expires_at`, `last_access`

### Segurança (RLS)
Todas as tabelas possuem Row Level Security configurado, garantindo que:
- Usuários só acessam seus próprios dados
- Políticas de leitura, escrita e exclusão por usuário
- Isolamento completo entre contas

### Triggers e Funções
- **`update_updated_at_column()`** - Atualiza `updated_at` automaticamente
- **`create_user_defaults()`** - Cria dados padrão ao registrar novo usuário
- **`verify_report_access()`** - Verifica acesso a relatórios compartilhados
- **`get_public_report()`** - Retorna relatório público com validação

## 📁 Estrutura do Projeto

```
delorean-machine/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/login/            # Página de autenticação
│   │   ├── dashboard/               # Dashboard principal
│   │   ├── hours/                   # Controle de horas
│   │   ├── projects/                # Gerenciamento de projetos
│   │   ├── clients/                 # Gestão de clientes
│   │   ├── reports/                 # Sistema de relatórios
│   │   ├── profile/                 # Perfil e configurações
│   │   ├── shared/[reportId]/view/  # Visualização pública de relatórios
│   │   ├── layout.tsx               # Layout raiz com providers
│   │   └── globals.css              # Estilos globais
│   │
│   ├── components/                   # Componentes React
│   │   ├── ui/                      # Componentes shadcn/ui
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── form.tsx
│   │   │   ├── sonner.tsx           # Sistema de toast
│   │   │   └── ...
│   │   ├── layout/                  # Layout e navegação
│   │   │   ├── dashboard-layout.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── topbar.tsx
│   │   │   └── bottom-nav.tsx       # Navegação mobile
│   │   ├── auth/                    # Autenticação
│   │   │   └── verification-form.tsx
│   │   ├── dashboard/               # Dashboard
│   │   │   ├── summary-cards.tsx
│   │   │   └── recent-entries.tsx
│   │   ├── hours/                    # Controle de horas
│   │   │   ├── time-entry-form.tsx
│   │   │   ├── time-entry-table.tsx
│   │   │   └── hours-calendar.tsx
│   │   ├── projects/                # Projetos
│   │   │   ├── project-form.tsx
│   │   │   └── project-table.tsx
│   │   ├── clients/                 # Clientes
│   │   │   ├── client-form.tsx
│   │   │   └── client-table.tsx
│   │   ├── reports/                 # Relatórios
│   │   │   ├── report-form.tsx
│   │   │   ├── report-list.tsx
│   │   │   ├── report-view.tsx
│   │   │   └── share-report-dialog.tsx
│   │   ├── export/                  # Exportação
│   │   │   └── export-buttons.tsx
│   │   └── theme-provider.tsx       # Provider de tema
│   │
│   ├── lib/                          # Utilitários e serviços
│   │   ├── supabase.ts              # Cliente Supabase
│   │   ├── supabase-client.ts       # Funções de API
│   │   ├── supabase-placeholders.ts # Dados mock
│   │   ├── cache.ts                 # Sistema de cache
│   │   ├── client-service.ts        # Serviço de clientes
│   │   ├── report-service.ts        # Serviço de relatórios
│   │   ├── export-service.ts        # Serviço de exportação
│   │   └── utils.ts                 # Funções utilitárias
│   │
│   ├── hooks/                        # React Hooks customizados
│   │   ├── useCachedResource.ts    # Hook de cache
│   │   └── use-mobile.tsx           # Detecção de mobile
│   │
│   └── types/                        # Tipos TypeScript
│       └── db.ts                     # Tipos do banco de dados
│
├── sql/                              # Scripts SQL
│   ├── master_migration_v1.sql      # Migração completa (recomendado)
│   ├── create_tables.sql            # Criação de tabelas
│   ├── create_report_system.sql     # Sistema de relatórios
│   └── ...
│
├── public/                           # Arquivos estáticos
├── .env.local                        # Variáveis de ambiente (não versionado)
├── next.config.ts                    # Configuração Next.js
├── tailwind.config.js               # Configuração Tailwind
├── tsconfig.json                     # Configuração TypeScript
└── package.json                      # Dependências do projeto
```

## 🎯 Funcionalidades Detalhadas

### 🔐 Autenticação

O sistema utiliza autenticação via Magic Link (OTP) do Supabase:

1. **Cadastro/Login**: Usuário insere email
2. **Código OTP**: Recebe código de 4 dígitos por email
3. **Verificação**: Insere código para autenticar
4. **Sessão**: Login mantido com refresh automático de tokens

### 📊 Dashboard

- **Resumo Diário**: Total de horas trabalhadas no dia atual
- **Resumo Semanal**: Total de horas da semana atual
- **Progresso de Metas**: Comparação entre horas trabalhadas e metas definidas
- **Apontamentos Recentes**: Últimos 5 registros de horas
- **Cards Visuais**: Interface clara e informativa

### ⏰ Controle de Horas

#### Visualização em Calendário
- Calendário mensal interativo
- Cores indicam dias com apontamentos
- Clique no dia para ver detalhes
- Sheet lateral com lista de apontamentos do dia

#### Tabela de Apontamentos
- Lista completa de registros
- Filtros por projeto e função
- Busca por descrição
- Edição e exclusão inline
- Totais calculados automaticamente

#### Formulário de Apontamento
- Seleção de projeto
- Campo de função
- Descrição opcional
- Horas trabalhadas
- Data (padrão: hoje)

### 📁 Projetos

- **Criação**: Nome, cliente, status e descrição
- **Edição**: Atualize qualquer campo do projeto
- **Status**: Ative/desative projetos
- **Associação**: Vincule a clientes cadastrados
- **Estatísticas**: Veja horas acumuladas por projeto
- **Filtros**: Por status e busca textual

### 👥 Clientes

- **Cadastro Completo**: Nome, CNPJ, tipo de serviço
- **Informações Contratuais**: Horas contratadas, ID do contrato
- **Datas**: Início e conclusão do contrato
- **Associação**: Projetos podem ser vinculados a clientes

### 📄 Relatórios

- **Criação**: Título, cliente, projetos e período
- **Compartilhamento**: Gere link com código de acesso
- **Visualização Pública**: Clientes acessam sem login
- **Arquivamento**: Organize relatórios antigos
- **Download**: Baixe relatórios em formato CSV

### 👤 Perfil e Configurações

#### Dados Pessoais
- Nome e sobrenome (salvamento automático)
- Email (atualização via Auth API com validação)
- Salvamento automático com debounce de 1 segundo
- Toast de confirmação com opção de desfazer

#### Metas de Horas
- Meta diária (1-24 horas)
- Meta semanal (1-168 horas)
- Horário de trabalho (início e fim)
- Salvamento automático

#### Preferências Pessoais
- **Tema**: Claro, Escuro ou Sistema
- **Idioma**: Português (BR), Inglês (US), Espanhol
- **Primeiro dia da semana**: Domingo, Segunda ou Sábado
- **Formato de exportação**: CSV, PDF ou Excel
- Salvamento automático

#### Configurações do Sistema
- **Fuso horário**: Múltiplas opções (São Paulo, Nova York, Londres, etc.)
- **Formato de hora**: 12h ou 24h
- **Formato de data**: DD/MM/AAAA, MM/DD/AAAA ou AAAA-MM-DD
- Salvamento automático

### 🎨 Dark Mode

- **Três Modos**: Light, Dark, System
- **Persistência**: Salvo no banco de dados
- **Cache Local**: Mudanças instantâneas
- **Toggle no Topbar**: Acesso rápido ao seletor de tema
- **Sincronização**: Tema carregado entre sessões

### ⚡ Sistema de Cache

- **Performance**: Dados carregados instantaneamente do cache
- **Atualização Inteligente**: Cache atualizado automaticamente
- **Fallback Robusto**: Recupera do servidor se necessário
- **Invalidação**: Cache limpo quando dados são atualizados

### 🔔 Notificações Toast

- **Salvamento Automático**: Toast de sucesso ao salvar
- **Opção de Desfazer**: Reverte alterações com um clique
- **Erros**: Notificações de erro claras e informativas
- **Elegante**: Design moderno com Sonner

## 🚀 Deploy

### Vercel (Recomendado)

1. **Conecte seu repositório** ao Vercel
2. **Configure variáveis de ambiente**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SECRET_KEY` (apenas servidor)

3. **Deploy automático**:
```bash
npm run build
vercel --prod
```

### Outras Plataformas

O projeto pode ser deployado em qualquer plataforma que suporte Next.js:
- **Netlify**
- **Railway**
- **Render**
- **AWS Amplify**

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor de desenvolvimento

# Produção
npm run build        # Cria build de produção
npm run start        # Inicia servidor de produção

# Qualidade
npm run lint         # Executa ESLint
```

## 📚 Documentação Adicional

- **[SUPABASE_SETUP.md](SUPABASE_SETUP.md)** - Guia completo de configuração do Supabase
- **[DARK_MODE_COMPLETO.md](DARK_MODE_COMPLETO.md)** - Documentação do sistema de dark mode

## 🎨 Design System

### Cores
- **Background**: Tons neutros adaptáveis (claro/escuro)
- **Acentos**: Cromados e sutis
- **Estados**: Cores semânticas para sucesso, erro, aviso

### Tipografia
- **Font System**: Fontes do sistema para performance
- **Hierarquia**: Tamanhos e pesos bem definidos
- **Legibilidade**: Contraste otimizado para acessibilidade

### Componentes
- **shadcn/ui**: Base de componentes acessíveis
- **Radix UI**: Primitivos sem estilo
- **Customização**: Temas e variantes personalizados

### Layout
- **Desktop**: Sidebar fixa + conteúdo principal
- **Tablet**: Sidebar colapsável
- **Mobile**: Bottom navigation + menu off-canvas

## 📱 Responsividade

- **Mobile First**: Design pensado primeiro para mobile
- **Breakpoints**: sm, md, lg, xl
- **Navegação Adaptativa**: Sidebar no desktop, bottom nav no mobile
- **Componentes Responsivos**: Cards, tabelas e formulários adaptáveis

## 🔒 Segurança

- **Row Level Security (RLS)**: Isolamento completo de dados
- **Autenticação Segura**: Tokens JWT gerenciados pelo Supabase
- **Validação de Dados**: Zod schemas em todos os formulários
- **HTTPS**: Recomendado para produção
- **Chaves Secretas**: Nunca expostas no cliente

## 🧪 Modo Mock

O sistema funciona em **modo mock** quando as credenciais do Supabase não estão configuradas:

- ✅ Interface totalmente funcional
- ✅ Dados de exemplo para testes
- ✅ Ideal para desenvolvimento e demonstrações
- ⚠️ Dados não persistem entre sessões

## 🐛 Troubleshooting

### Erro: "Tabelas não encontradas"
Execute o script `sql/master_migration_v1.sql` no SQL Editor do Supabase.

### Erro: "Schema cache desatualizado"
Execute no SQL Editor:
```sql
SELECT pg_notify('pgrst', 'reload schema');
```

### Erro: "Constraint única violada"
O sistema usa `upsert` atômico para evitar race conditions. Se persistir, verifique se há duplicatas no banco.

### Email não atualiza
Verifique as configurações de autenticação no Supabase Dashboard. Alguns projetos exigem confirmação por email.

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Faça fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

---

**Desenvolvido com ❤️ para otimizar o controle de tempo e aumentar a produtividade.**

**DeLorean Machine** - Viaje no tempo do seu trabalho! ⏰
