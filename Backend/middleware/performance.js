const cacheService = require('../services/cacheService');

// Performance monitoring middleware
const performanceMonitor = (req, res, next) => {
  const start = process.hrtime.bigint();
  
  // Add response time header
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds
    
    res.setHeader('X-Response-Time', `${duration.toFixed(2)}ms`);
    
    // Log slow requests
    if (duration > 1000) {
      // console.warn(`Slow request: ${req.method} ${req.path} took ${duration.toFixed(2)}ms`);
    }
    
    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development') {
      // console.log(`${req.method} ${req.path} - ${duration.toFixed(2)}ms`);
    }
  });
  
  next();
};

// Cache middleware for GET requests
const cacheMiddleware = (ttl = 300000) => {
  return (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }
    
    const cacheKey = `${req.originalUrl}:${req.user?.id || 'anonymous'}`;
    const cachedResponse = cacheService.get(cacheKey);
    
    if (cachedResponse) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cachedResponse);
    }
    
    // Store original send method
    const originalSend = res.json;
    
    // Override send method to cache response
    res.json = function(data) {
      cacheService.set(cacheKey, data, ttl);
      res.setHeader('X-Cache', 'MISS');
      return originalSend.call(this, data);
    };
    
    next();
  };
};

// Database query optimization middleware
const queryOptimizer = (req, res, next) => {
  // Add query optimization hints
  if (req.query.limit && parseInt(req.query.limit) > 100) {
    req.query.limit = 100; // Cap limit to prevent excessive queries
  }
  
  // Add default pagination
  if (!req.query.page) {
    req.query.page = 1;
  }
  
  if (!req.query.limit) {
    req.query.limit = 20;
  }
  
  next();
};

// Request size limiter
const requestSizeLimiter = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    const maxSizeBytes = parseSize(maxSize);
    
    if (contentLength > maxSizeBytes) {
      return res.status(413).json({
        error: 'Request entity too large',
        maxSize: maxSize
      });
    }
    
    next();
  };
};

// Helper function to parse size strings
function parseSize(size) {
  const units = {
    'b': 1,
    'kb': 1024,
    'mb': 1024 * 1024,
    'gb': 1024 * 1024 * 1024
  };
  
  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)$/);
  if (!match) return 10 * 1024 * 1024; // Default 10MB
  
  const value = parseFloat(match[1]);
  const unit = match[2];
  
  return value * units[unit];
}

// Memory usage monitor
const memoryMonitor = (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    const memUsage = process.memoryUsage();
    const memUsageMB = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024)
    };
    
    // Log memory usage every 100 requests
    if (Math.random() < 0.01) {
      // console.log('Memory Usage:', memUsageMB);
    }
    
    // Warn if memory usage is high
    if (memUsageMB.heapUsed > 500) { // 500MB
      // console.warn('High memory usage detected:', memUsageMB.heapUsed, 'MB');
    }
  }
  
  next();
};

// Performance metrics endpoint
const getPerformanceMetrics = (req, res) => {
  const memUsage = process.memoryUsage();
  const cacheStats = cacheService.getStats();
  
  res.json({
    timestamp: new Date().toISOString(),
    memory: {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024)
    },
    cache: cacheStats,
    uptime: process.uptime(),
    nodeVersion: process.version,
    platform: process.platform
  });
};

module.exports = {
  performanceMonitor,
  cacheMiddleware,
  queryOptimizer,
  requestSizeLimiter,
  memoryMonitor,
  getPerformanceMetrics
}; 