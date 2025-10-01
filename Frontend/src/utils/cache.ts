/**
 * Simple in-memory cache for API responses
 * Reduces unnecessary API calls and improves performance
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
}

class Cache {
  private cache: Map<string, CacheEntry<any>>;
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  /**
   * Set cache entry with expiration time
   */
  set<T>(key: string, data: T, expiresIn: number = 5 * 60 * 1000): void {
    // If cache is full, remove oldest entry
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn,
    });
  }

  /**
   * Get cache entry if not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.expiresIn) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Clear specific cache entry
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Clear expired entries
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.expiresIn) {
        this.cache.delete(key);
      }
    }
  }
}

// Export singleton instance
export const apiCache = new Cache(100);

// Clear expired entries every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    apiCache.clearExpired();
  }, 5 * 60 * 1000);
}

/**
 * Generate cache key from URL and params
 */
export const generateCacheKey = (url: string, params?: any): string => {
  if (!params) return url;
  
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      acc[key] = params[key];
      return acc;
    }, {} as any);

  return `${url}:${JSON.stringify(sortedParams)}`;
};

/**
 * Cached fetch wrapper
 */
export const cachedFetch = async <T>(
  key: string,
  fetcher: () => Promise<T>,
  expiresIn: number = 5 * 60 * 1000
): Promise<T> => {
  // Check cache first
  const cached = apiCache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch and cache
  const data = await fetcher();
  apiCache.set(key, data, expiresIn);
  return data;
};
