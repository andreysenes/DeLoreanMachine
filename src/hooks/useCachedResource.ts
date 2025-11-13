import { useState, useEffect, useCallback, useRef } from 'react';
import { getCachedData, setCachedData, isCacheFresh } from '@/lib/cache';
import { getCurrentUser } from '@/lib/supabase-client';

interface UseCachedResourceOptions {
  maxAge?: number; // Tempo em ms para considerar dados frescos
  version?: string; // Versão para invalidação 
  enabled?: boolean; // Se deve fazer fetch
  revalidateOnMount?: boolean; // Se deve sempre revalidar ao montar
}

interface UseCachedResourceResult<T> {
  data: T | null;
  isLoading: boolean;
  isValidating: boolean; // True quando está buscando dados em background
  isStale: boolean; // True quando dados são do cache mas podem estar desatualizados
  error: Error | null;
  mutate: (data?: T) => void; // Atualiza dados manualmente
  revalidate: () => Promise<void>; // Força revalidação
}

/**
 * Hook para cache de recursos com padrão "stale-while-revalidate"
 * 
 * @param key - Chave única do recurso
 * @param fetcher - Função para buscar dados
 * @param options - Opções de configuração
 * @returns Estado do recurso com cache
 */
export function useCachedResource<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseCachedResourceOptions = {}
): UseCachedResourceResult<T> {
  const {
    maxAge = 5 * 60 * 1000, // 5 minutos
    version = '1.0.0',
    enabled = true,
    revalidateOnMount = true
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Ref para evitar múltiplas requests simultâneas
  const fetchingRef = useRef(false);
  const mountedRef = useRef(false);

  // Carregar userId uma vez
  useEffect(() => {
    getCurrentUser().then(user => {
      setUserId(user?.id || null);
    }).catch(console.warn);
  }, []);

  // Função para buscar dados
  const fetchData = useCallback(async (showValidating = true) => {
    if (!enabled || fetchingRef.current) return;
    
    fetchingRef.current = true;
    if (showValidating) setIsValidating(true);
    setError(null);

    try {
      console.debug(`[useCachedResource] Fetching ${key}...`);
      const result = await fetcher();
      
      setData(result);
      setIsStale(false);
      
      // Atualizar cache
      if (userId !== null) {
        setCachedData(userId, key, result, { version, maxAge });
      }
      
      console.debug(`[useCachedResource] Fetched ${key} successfully`);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      console.error(`[useCachedResource] Error fetching ${key}:`, errorObj);
    } finally {
      setIsLoading(false);
      setIsValidating(false);
      fetchingRef.current = false;
    }
  }, [key, fetcher, enabled, userId, version, maxAge]);

  // Carregar dados do cache imediatamente + buscar dados atualizados
  useEffect(() => {
    if (!enabled || userId === null) return;

    // Primeira tentativa: carregar do cache
    const cachedData = getCachedData<T>(userId, key, { version, maxAge });
    
    if (cachedData) {
      console.debug(`[useCachedResource] Loaded ${key} from cache`);
      setData(cachedData);
      setIsLoading(false);
      
      // Verificar se dados estão frescos
      const isFresh = isCacheFresh(userId, key, { maxAge });
      setIsStale(!isFresh);
      
      // Se dados estão antigos ou deve revalidar, buscar em background
      if (!isFresh || revalidateOnMount) {
        console.debug(`[useCachedResource] Revalidating ${key} in background`);
        fetchData(true);
      }
    } else {
      // Sem cache: carregar normalmente
      console.debug(`[useCachedResource] No cache for ${key}, fetching...`);
      fetchData(false);
    }

    mountedRef.current = true;
  }, [key, userId, enabled, fetchData, revalidateOnMount, version, maxAge]);

  // Função para atualizar dados manualmente (mutate)
  const mutate = useCallback((newData?: T) => {
    if (newData !== undefined) {
      setData(newData);
      setIsStale(false);
      setError(null);
      
      // Atualizar cache
      if (userId !== null) {
        setCachedData(userId, key, newData, { version, maxAge });
      }
    } else {
      // Se chamado sem parâmetros, revalida
      fetchData(true);
    }
  }, [userId, key, version, maxAge, fetchData]);

  // Função para forçar revalidação
  const revalidate = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  return {
    data,
    isLoading,
    isValidating,
    isStale,
    error,
    mutate,
    revalidate,
  };
}

/**
 * Hook específico para dados do perfil do usuário
 */
export function useCachedUserProfile() {
  return useCachedResource(
    'user-profile',
    async () => {
      const { getCurrentUser, getUserProfile } = await import('@/lib/supabase-client');
      const [user, profile] = await Promise.all([getCurrentUser(), getUserProfile()]);
      return { user, profile };
    },
    { maxAge: 10 * 60 * 1000 } // 10 minutos para perfil
  );
}

/**
 * Hook específico para configurações do usuário
 */
export function useCachedUserSettings() {
  return useCachedResource(
    'user-settings',
    async () => {
      const { getUserSettingsComplete } = await import('@/lib/supabase-client');
      return await getUserSettingsComplete();
    },
    { maxAge: 15 * 60 * 1000 } // 15 minutos para configurações
  );
}

/**
 * Hook específico para preferências do usuário
 */
export function useCachedUserPreferences() {
  return useCachedResource(
    'user-preferences',
    async () => {
      const { getUserPreferences } = await import('@/lib/supabase-client');
      return await getUserPreferences();
    },
    { maxAge: 15 * 60 * 1000 } // 15 minutos para preferências
  );
}
