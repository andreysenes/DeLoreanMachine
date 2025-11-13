import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://demo.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'demo-key';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE || 'demo-service-key';

// Verificar se as credenciais são válidas (não são placeholders)
const isConfigured = 
  supabaseUrl !== 'https://your-project-url.supabase.co' && 
  supabaseUrl !== 'https://demo.supabase.co' &&
  supabaseAnonKey !== 'your-anon-key-here' && 
  supabaseAnonKey !== 'demo-key';

export const supabase = isConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Para uso no servidor (service role)
export const supabaseAdmin = isConfigured
  ? createClient(supabaseUrl, serviceRoleKey)
  : null;

// Flag para indicar se o Supabase está configurado
export const isSupabaseConfigured = isConfigured;

console.log('🔧 Supabase Status:', isConfigured ? 'CONFIGURADO' : 'USANDO DADOS MOCK');
