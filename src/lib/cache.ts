/**
 * Utilitário para cache local com localStorage
 * Implementa padrão "stale-while-revalidate" para melhor UX
 */

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  version: string;
}

interface CacheOptions {
  maxAge?: number; // Tempo em ms para considerar dados "frescos"
  version?: string; // Versão para invalidação
}

const DEFAULT_MAX_AGE = 5 * 60 * 1000; // 5 minutos
const DEFAULT_VERSION = '1.0.0';

/**
 * Gera chave de cache única por usuário e recurso
 */
function getCacheKey(userId: string | null, resource: string): string {
  const userPrefix = userId ? `user:${userId}` : 'anonymous';
  return `delorean-cache:${userPrefix}:${resource}`;
}

/**
 * Verifica se localStorage está disponível
 */
function isStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const test = '__storage_test__';
    window.localStorage.setItem(test, test);
    window.localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Obtém dados do cache
 */
export function getCachedData<T>(
  userId: string | null,
  resource: string,
  options: CacheOptions = {}
): T | null {
  if (!isStorageAvailable()) return null;

  try {
    const key = getCacheKey(userId, resource);
    const cached = window.localStorage.getItem(key);
    
    if (!cached) return null;

    const entry: CacheEntry<T> = JSON.parse(cached);
    const { maxAge = DEFAULT_MAX_AGE, version = DEFAULT_VERSION } = options;

    // Verificar versão
    if (entry.version !== version) {
      console.debug(`[Cache] Version mismatch for ${resource}, invalidating`);
      clearCachedData(userId, resource);
      return null;
    }

    // Verificar idade
    const age = Date.now() - entry.timestamp;
    if (age > maxAge) {
      console.debug(`[Cache] Stale data for ${resource} (age: ${age}ms)`);
      // Retorna dados antigos mas marca como stale
      return entry.data;
    }

    console.debug(`[Cache] Fresh data for ${resource}`);
    return entry.data;
  } catch (error) {
    console.warn(`[Cache] Error reading ${resource}:`, error);
    return null;
  }
}

/**
 * Armazena dados no cache
 */
export function setCachedData<T>(
  userId: string | null,
  resource: string,
  data: T,
  options: CacheOptions = {}
): void {
  if (!isStorageAvailable()) return;

  try {
    const key = getCacheKey(userId, resource);
    const { version = DEFAULT_VERSION } = options;
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      version,
    };

    window.localStorage.setItem(key, JSON.stringify(entry));
    console.debug(`[Cache] Stored ${resource}`);
  } catch (error) {
    console.warn(`[Cache] Error storing ${resource}:`, error);
  }
}

/**
 * Remove dados do cache
 */
export function clearCachedData(
  userId: string | null,
  resource: string
): void {
  if (!isStorageAvailable()) return;

  try {
    const key = getCacheKey(userId, resource);
    window.localStorage.removeItem(key);
    console.debug(`[Cache] Cleared ${resource}`);
  } catch (error) {
    console.warn(`[Cache] Error clearing ${resource}:`, error);
  }
}

/**
 * Limpa todo o cache do usuário
 */
export function clearUserCache(userId: string | null): void {
  if (!isStorageAvailable()) return;

  try {
    const userPrefix = getCacheKey(userId, '').slice(0, -1); // Remove o ':' final
    const keys = Object.keys(window.localStorage);
    
    keys.forEach(key => {
      if (key.startsWith(userPrefix)) {
        window.localStorage.removeItem(key);
      }
    });
    
    console.debug(`[Cache] Cleared all data for user ${userId}`);
  } catch (error) {
    console.warn(`[Cache] Error clearing user cache:`, error);
  }
}

/**
 * Verifica se dados estão frescos (dentro do maxAge)
 */
export function isCacheFresh(
  userId: string | null,
  resource: string,
  options: CacheOptions = {}
): boolean {
  if (!isStorageAvailable()) return false;

  try {
    const key = getCacheKey(userId, resource);
    const cached = window.localStorage.getItem(key);
    
    if (!cached) return false;

    const entry: CacheEntry = JSON.parse(cached);
    const { maxAge = DEFAULT_MAX_AGE } = options;
    const age = Date.now() - entry.timestamp;

    return age <= maxAge;
  } catch {
    return false;
  }
}
