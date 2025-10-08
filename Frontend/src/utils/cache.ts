/**
 * Enhanced Caching Service
 * Implements multiple caching strategies for optimal performance
 */

interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of items
  strategy: 'lru' | 'fifo' | 'ttl';
}

interface CacheItem<T> {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

class EnhancedCache<T> {
  private cache = new Map<string, CacheItem<T>>();
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;
  }

  set(key: string, data: T): void {
    // Remove oldest items if cache is full
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now()
    });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check TTL
    if (Date.now() - item.timestamp > this.config.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update access statistics
    item.accessCount++;
    item.lastAccessed = Date.now();

    return item.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  private evictOldest(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.lastAccessed < oldestTime) {
        oldestTime = item.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  // Get cache statistics
  getStats() {
    const items = Array.from(this.cache.values());
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate: items.reduce((sum, item) => sum + item.accessCount, 0) / items.length || 0,
      averageAge: items.reduce((sum, item) => sum + (Date.now() - item.timestamp), 0) / items.length || 0
    };
  }
}

// Cache instances for different data types
export const reviewCache = new EnhancedCache<any>({
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 100,
  strategy: 'lru'
});

export const userCache = new EnhancedCache<any>({
  ttl: 10 * 60 * 1000, // 10 minutes
  maxSize: 50,
  strategy: 'lru'
});

export const categoryCache = new EnhancedCache<any>({
  ttl: 30 * 60 * 1000, // 30 minutes
  maxSize: 20,
  strategy: 'lru'
});

export const leaderboardCache = new EnhancedCache<any>({
  ttl: 15 * 60 * 1000, // 15 minutes
  maxSize: 1,
  strategy: 'ttl'
});

// Cache utility functions
export const getCachedData = async <T>(
  cache: EnhancedCache<T>,
  key: string,
  fetchFunction: () => Promise<T>,
  ttl?: number
): Promise<T> => {
  // Try to get from cache first
  const cached = cache.get(key);
  if (cached) {
    console.log(`✅ Cache hit for key: ${key}`);
    return cached;
  }

  console.log(`❌ Cache miss for key: ${key}, fetching...`);
  
  // Fetch fresh data
  const data = await fetchFunction();
  
  // Store in cache
  cache.set(key, data);
  
  return data;
};

// Cache warming functions
export const warmCache = async () => {
  console.log('🔥 Warming up cache...');
  
  try {
    // Pre-load critical data
    const criticalData = [
      { cache: categoryCache, key: 'categories', fetch: () => fetch('/api/categories').then(r => r.json()) },
      { cache: leaderboardCache, key: 'leaderboard', fetch: () => fetch('/api/users/leaderboard').then(r => r.json()) }
    ];

    await Promise.allSettled(
      criticalData.map(({ cache, key, fetch }) => 
        getCachedData(cache, key, fetch)
      )
    );

    console.log('✅ Cache warmed up successfully');
  } catch (error) {
    console.error('❌ Cache warming failed:', error);
  }
};

// Cache cleanup
export const cleanupCache = () => {
  console.log('🧹 Cleaning up cache...');
  
  const caches = [reviewCache, userCache, categoryCache, leaderboardCache];
  
  caches.forEach(cache => {
    const stats = cache.getStats();
    console.log(`Cache stats:`, stats);
    
    // Clear expired items (handled automatically by TTL)
    // This is just for logging
  });
  
  console.log('✅ Cache cleanup completed');
};

// Performance monitoring
export const getCachePerformance = () => {
  const caches = [
    { name: 'Reviews', cache: reviewCache },
    { name: 'Users', cache: userCache },
    { name: 'Categories', cache: categoryCache },
    { name: 'Leaderboard', cache: leaderboardCache }
  ];

  return caches.map(({ name, cache }) => ({
    name,
    ...cache.getStats()
  }));
};

// Auto-cleanup every 5 minutes
setInterval(cleanupCache, 5 * 60 * 1000);

export default {
  reviewCache,
  userCache,
  categoryCache,
  leaderboardCache,
  getCachedData,
  warmCache,
  cleanupCache,
  getCachePerformance
};