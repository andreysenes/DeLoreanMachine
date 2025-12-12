import { createClient } from '@supabase/supabase-js';

// Environment variables - usando Publishable key (pode ser exposta no cliente)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = !!supabaseUrl && !!supabasePublishableKey;

if (!isSupabaseConfigured) {
  console.warn('⚠️ Supabase credentials are missing. The app will run in mock mode.');
}

// Client configuration with retries and improved options
// Usando Publishable key ao invés de anon key (mais seguro e recomendado)
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabasePublishableKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'supabase.auth.token',
      },
      global: {
        headers: {
          'x-application-name': 'delorean-machine',
        },
      },
      // Retry configuration for network issues
      db: {
        schema: 'public',
      },
      // Custom fetch implementation for retries could be added here if needed
      // but Supabase JS client handles some retries internally.
    })
  : null;

// Helper to handle Supabase errors consistently
export const handleSupabaseError = (error: any, context: string) => {
  console.error(`Error in ${context}:`, error);
  // Could map error codes to user-friendly messages here
  // e.g. 'PGRST116' -> 'Data not found'
  // e.g. '42501' -> 'Permission denied'
  return error;
};
