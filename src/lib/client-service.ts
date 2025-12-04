import { supabase, isSupabaseConfigured } from './supabase';
import { Client } from '@/types/db';
import { getCurrentUser } from './supabase-client';

export const getClients = async (): Promise<Client[]> => {
  if (!isSupabaseConfigured || !supabase) {
    console.log('👥 Mock: Buscando clientes mock');
    return []; 
  }

  try {
    const user = await getCurrentUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id)
      .order('nome', { ascending: true });

    if (error) {
      // Check if table exists
      if (error.code === '42P01') {
        console.warn('Tabela clients não encontrada.');
        return [];
      }
      console.error('Erro ao buscar clientes:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro em getClients:', error);
    return [];
  }
};

export const getClientById = async (id: string): Promise<Client | null> => {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }
  
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
      
    if (error) return null;
    return data;
  } catch (error) {
    return null;
  }
};

export const createClient = async (clientData: Omit<Client, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
  if (!isSupabaseConfigured || !supabase) {
    console.log('👥 Mock: Criando cliente:', clientData);
    return { id: 'mock-client-id', user_id: 'mock-user', ...clientData, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  }

  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('clients')
    .insert({
      ...clientData,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateClient = async (id: string, clientData: Partial<Client>) => {
  if (!isSupabaseConfigured || !supabase) {
    console.log('👥 Mock: Atualizando cliente:', id, clientData);
    return { id, ...clientData };
  }

  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('clients')
    .update(clientData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteClient = async (id: string) => {
  if (!isSupabaseConfigured || !supabase) {
    console.log('👥 Mock: Deletando cliente:', id);
    return;
  }

  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
};
