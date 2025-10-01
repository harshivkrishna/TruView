# Scalability Recommendations for TruView

## Current Status
Your application has good foundations but needs improvements for handling thousands of concurrent users.

## Critical Issues to Fix

### 1. Replace In-Memory Cache with Redis
**Problem**: Current cache won't work with multiple server instances
**Solution**: Use Redis for distributed caching

```bash
npm install redis ioredis
```

**Implementation**:
```javascript
// services/redisCacheService.js
const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => Math.min(times * 50, 2000)
});

class RedisCacheService {
  async get(key) {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async set(key, value, ttl = 300) {
    await redis.setex(key, ttl, JSON.stringify(value));
  }

  async delete(key) {
    await redis.del(key);
  }

  async clear() {
    await redis.flushdb();
  }
}

module.exports = new RedisCacheService();
```

### 2. Use Redis for Rate Limiting
**Problem**: In-memory rate limiting won't work across servers

```bash
npm install rate-limit-redis
```

```javascript
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');

const redisClient = new Redis(process.env.REDIS_URL);

const limiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:'
  }),
  windowMs: 15 * 60 * 1000,
  max: 100
});
```

### 3. Increase MongoDB Connection Pool

```javascript
const mongoOptions = {
  maxPoolSize: 50,        // Increase from 10 to 50
  minPoolSize: 10,        // Increase from 2 to 10
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};
```

### 4. Add Database Indexes

```javascript
// models/Review.js - Add these indexes
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ 'author.userId': 1 });
reviewSchema.index({ category: 1, subcategory: 1 });
reviewSchema.index({ trustScore: -1 });
reviewSchema.index({ viewCount: -1 });
reviewSchema.index({ upvotes: -1 });

// models/User.js
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ phoneNumber: 1 }, { unique: true });
userSchema.index({ trustScore: -1 });
userSchema.index({ reviewCount: -1 });
```

### 5. Use Cloud Storage (Already Configured)
✅ You already have AWS S3 configured - ensure it's enabled in production

### 6. Implement Database Read Replicas
For read-heavy operations (viewing reviews):

```javascript
// Use MongoDB read preference
mongoose.connect(uri, {
  ...mongoOptions,
  readPreference: 'secondaryPreferred'
});
```

### 7. Add Request Queue for Heavy Operations
For operations like sending emails, processing uploads:

```bash
npm install bull
```

```javascript
// services/queueService.js
const Queue = require('bull');

const emailQueue = new Queue('email', process.env.REDIS_URL);

emailQueue.process(async (job) => {
  await sendEmail(job.data);
});

// Usage
emailQueue.add({ to: 'user@example.com', template: 'welcome' });
```

### 8. Implement API Response Pagination
Ensure all list endpoints use pagination:

```javascript
// Already implemented in your code - good!
const page = parseInt(req.query.page) || 1;
const limit = Math.min(parseInt(req.query.limit) || 20, 100);
```

### 9. Add Monitoring & Logging

```bash
npm install winston morgan
```

```javascript
// services/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

module.exports = logger;
```

### 10. Use CDN for Static Assets
- Serve uploaded images/videos through CloudFront or Cloudflare CDN
- Reduces server load and improves global performance

## Infrastructure Recommendations

### For 100-1,000 concurrent users:
- **Backend**: 2-3 Node.js instances (PM2 cluster mode or Kubernetes)
- **Database**: MongoDB Atlas M10 or higher
- **Cache**: Redis (256MB-1GB)
- **Storage**: AWS S3 + CloudFront CDN

### For 1,000-10,000 concurrent users:
- **Backend**: 5-10 Node.js instances with load balancer
- **Database**: MongoDB Atlas M30 with read replicas
- **Cache**: Redis (2-4GB) with clustering
- **Storage**: AWS S3 + CloudFront CDN
- **Queue**: Bull with Redis for background jobs

### For 10,000+ concurrent users:
- **Backend**: Auto-scaling Kubernetes cluster (10-50 pods)
- **Database**: MongoDB Atlas M50+ with sharding
- **Cache**: Redis Cluster (8-16GB)
- **Storage**: Multi-region S3 + CloudFront
- **Queue**: Bull with Redis Cluster
- **Monitoring**: DataDog, New Relic, or Prometheus

## Cost Estimates (Monthly)

### Small Scale (100-1K users):
- Render/Railway: $7-20
- MongoDB Atlas M10: $57
- Redis Cloud: $0-10 (free tier)
- AWS S3 + CloudFront: $5-20
- **Total: ~$70-110/month**

### Medium Scale (1K-10K users):
- AWS EC2/ECS: $50-150
- MongoDB Atlas M30: $240
- Redis: $30-50
- AWS S3 + CloudFront: $20-50
- **Total: ~$340-490/month**

### Large Scale (10K+ users):
- Kubernetes Cluster: $200-500
- MongoDB Atlas M50+: $600+
- Redis Cluster: $100-200
- AWS S3 + CloudFront: $100-300
- **Total: ~$1,000-1,500+/month**

## Immediate Action Items (Priority Order)

1. **Add database indexes** (30 minutes) - Free, immediate performance boost
2. **Increase MongoDB connection pool** (5 minutes) - Free
3. **Set up Redis** (2 hours) - $0-10/month
4. **Implement Redis-based rate limiting** (1 hour)
5. **Add monitoring/logging** (2 hours)
6. **Set up CDN for static assets** (1 hour) - Minimal cost

## Performance Targets

With these improvements, you should achieve:
- **Response time**: <200ms for cached requests, <500ms for database queries
- **Throughput**: 1,000+ requests/second per server instance
- **Concurrent users**: 10,000+ with 3-5 server instances
- **Database queries**: <50ms average with proper indexing
- **Cache hit rate**: 70-90% for frequently accessed data

## Testing Scalability

Use these tools to test:
```bash
# Install Apache Bench
sudo apt-get install apache2-utils

# Test with 1000 requests, 100 concurrent
ab -n 1000 -c 100 http://localhost:5000/api/reviews

# Install Artillery for more advanced testing
npm install -g artillery
artillery quick --count 100 --num 1000 http://localhost:5000/api/reviews
```

## Conclusion

Your current setup is good for **100-500 concurrent users**. To scale to thousands:
1. Implement Redis (critical)
2. Add database indexes (critical)
3. Increase connection pools (easy)
4. Monitor and optimize based on metrics

The architecture is solid - you just need to swap in-memory solutions for distributed ones.
