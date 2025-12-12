const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load env vars manually or assume they are passed/hardcoded for this script
// Using the values read from the file directly for simplicity in this temporary script
const SUPABASE_URL = 'https://byteptrzunaorkwsgvhk.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5dGVwdHJ6dW5hb3Jrd3NndmhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjk4MzU0NiwiZXhwIjoyMDc4NTU5NTQ2fQ.uJuQpRDaAxIVUz0KT9FwmYMPez0bMARWHR3iobb6sBU';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runTest() {
  console.log('🏁 Iniciando teste de criação de apontamento...');

  // 1. Get a user
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
  
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
