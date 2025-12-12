const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// ⚠️ SEGURANÇA: NUNCA hardcode credenciais no código!
// Este script lê variáveis de ambiente do arquivo .env.local
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          process.env[key.trim()] = value.trim();
        }
      }
    });
  }
}

loadEnvFile();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SECRET_KEY) {
  console.error('❌ Erro: Variáveis de ambiente não encontradas!');
  console.error('   Certifique-se de que .env.local contém:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SECRET_KEY (Secret API key, não JWT service_role)');
  console.error('');
  console.error('   Ou passe as variáveis diretamente:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SECRET_KEY=... node scripts/test-entry.js');
  process.exit(1);
}

// Usando Secret API key ao invés de service_role JWT (mais seguro)
const supabase = createClient(SUPABASE_URL, SECRET_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runTest() {
  console.log('🏁 Iniciando teste de criação de apontamento...');

  // 1. Get a user
  // Nota: Secret API keys podem ter permissões diferentes de service_role
  // Se listUsers() não funcionar, pode ser necessário usar outra abordagem
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers().catch(() => {
    // Fallback: tentar buscar usuários de outra forma se admin API não estiver disponível
    console.warn('⚠️ admin.listUsers() pode não estar disponível com Secret API key');
    return { data: { users: [] }, error: null };
  });
  
  if (userError) {
    console.error('❌ Erro ao listar usuários:', userError);
    return;
  }

  if (!users || users.length === 0) {
    console.error('❌ Nenhum usuário encontrado para o teste.');
    return;
  }

  const user = users[0];
  console.log(`👤 Usuário selecionado: ${user.email} (${user.id})`);

  // 2. Get a project for this user
  const { data: projects, error: projectError } = await supabase
    .from('projects')
    .select('id, nome')
    .eq('user_id', user.id)
    .limit(1);

  if (projectError) {
    console.error('❌ Erro ao buscar projetos:', projectError);
    return;
  }

  let projectId;
  if (!projects || projects.length === 0) {
    console.log('⚠️ Nenhum projeto encontrado. Criando projeto de teste...');
    const { data: newProject, error: createProjectError } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        nome: 'Projeto Teste Script',
        client_id: 'cliente-mock-id', // Assuming client check is loose or we need to create one
        status: 'ativo'
      })
      .select()
      .single();
      
    if (createProjectError) {
        // If fail (e.g. constraints), try to insert client first? 
        // For simplicity, let's assume we can mock it or RLS allows it with service role
        console.error('❌ Falha ao criar projeto:', createProjectError);
        // Fallback: try to find ANY project or skip
        return;
    }
    projectId = newProject.id;
    console.log(`✅ Projeto criado: ${newProject.nome} (${projectId})`);
  } else {
    projectId = projects[0].id;
    console.log(`Tb Projeto selecionado: ${projects[0].nome} (${projectId})`);
  }

  // 3. Create Time Entry for Tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  console.log(`📅 Criando apontamento para: ${tomorrowStr}`);

  const { data: timeEntry, error: insertError } = await supabase
    .from('time_entries')
    .insert({
      user_id: user.id,
      project_id: projectId,
      horas: 2,
      data: tomorrowStr,
      funcao: 'Desenvolvimento',
      descricao: 'Teste automático via script'
    })
    .select()
    .single();

  if (insertError) {
    console.error('❌ Erro ao criar apontamento:', insertError);
  } else {
    console.log('✅ Apontamento criado com sucesso!');
    console.log('📋 Detalhes:', {
      id: timeEntry.id,
      horas: timeEntry.horas,
      data: timeEntry.data,
      descricao: timeEntry.descricao
    });
  }
}

runTest();
