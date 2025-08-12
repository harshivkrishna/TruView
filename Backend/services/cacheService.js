class CacheService {
  constructor() {
    this.cache = new Map();
    this.maxSize = 1000; // Maximum number of cached items
    this.defaultTTL = 300000; // 5 minutes in milliseconds
  }

  // Set a value in cache with optional TTL
  set(key, value, ttl = this.defaultTTL) {
    // Remove oldest items if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    const expiry = Date.now() + ttl;
    this.cache.set(key, {
      value,
      expiry,
      accessCount: 0,
      lastAccessed: Date.now()
    });
  }

  // Get a value from cache
  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if item has expired
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    // Update access statistics
    item.accessCount++;
    item.lastAccessed = Date.now();
    
    return item.value;
  }

  // Check if key exists and is not expired
  has(key) {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  // Delete a specific key
  delete(key) {
    return this.cache.delete(key);
  }

  // Clear all cache
  clear() {
    this.cache.clear();
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    let expiredCount = 0;
    let totalAccessCount = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        expiredCount++;
        this.cache.delete(key);
      } else {
        totalAccessCount += item.accessCount;
      }
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      expiredCount,
      totalAccessCount,
      hitRate: this.cache.size > 0 ? totalAccessCount / this.cache.size : 0
    };
  }

  // Clean up expired items
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }

  // Set cache size limit
  setMaxSize(size) {
    this.maxSize = size;
    // Remove excess items if new size is smaller
    if (this.cache.size > this.maxSize) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
      
      const toRemove = entries.slice(0, this.cache.size - this.maxSize);
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  // Get cache keys (for debugging)
  getKeys() {
    return Array.from(this.cache.keys());
  }
}

// Create singleton instance
const cacheService = new CacheService();

// Cleanup expired items every minute
setInterval(() => {
  cacheService.cleanup();
}, 60000);

module.exports = cacheService; 