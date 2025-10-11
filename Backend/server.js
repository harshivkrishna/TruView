const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const compression = require('compression');


dotenv.config();

// Check CloudFront configuration on startup
const { checkCloudFrontConfig } = require('./utils/cloudFrontCheck');
checkCloudFrontConfig();

const app = express();

// Trust proxy - REQUIRED for Render and other proxy services
app.set('trust proxy', 1);

// Compression middleware - optimized for high-scale usage
app.use(compression({
  level: 6, // Balanced compression for bandwidth vs CPU
  threshold: 1024, // Compress responses larger than 1KB
  filter: (req, res) => {
    // Don't compress if client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Use compression filter
    return compression.filter(req, res);
  }
}));

// Security and performance middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(mongoSanitize());
app.use(hpp());

// CORS configuration with performance optimizations
const allowedOrigins = [
  'http://localhost:5173',           // Local development
  'http://localhost:3000',           // Alternative local port
  'https://truview-steel.vercel.app', // Production frontend
  'https://truview.vercel.app',       // Alternative production domain
  'https://www.truviews.in',          // Production frontend domain
  'https://truviews.in',              // Production frontend domain (without www)
  'https://truview-xc01.onrender.com' // Current backend domain
];

// Add any additional origins from environment variable
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

// Ensure production domains are always included regardless of environment variables
const productionOrigins = [
  'https://truview-steel.vercel.app',
  'https://truview.vercel.app',
  'https://www.truviews.in',
  'https://truviews.in'
];

// Merge and deduplicate origins
const finalAllowedOrigins = [...new Set([...allowedOrigins, ...productionOrigins])];

// Log allowed origins for debugging
console.log('Allowed CORS origins:', finalAllowedOrigins);
console.log('Environment FRONTEND_URL:', process.env.FRONTEND_URL);

// More flexible CORS configuration for development and production
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('CORS: Allowing request with no origin');
      return callback(null, true);
    }
    
    console.log('CORS: Checking origin:', origin);
    
    // Always allow localhost for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      console.log('CORS: Localhost origin allowed:', origin);
      return callback(null, true);
    }
    
    // Check against allowed origins
    if (finalAllowedOrigins.indexOf(origin) !== -1) {
      console.log('CORS: Origin allowed:', origin);
      callback(null, true);
    } else {
      // Log blocked origins for debugging
      console.log('CORS blocked origin:', origin);
      console.log('Allowed origins:', finalAllowedOrigins);
      
      // In development, be more permissive
      if (process.env.NODE_ENV === 'development') {
        console.log('CORS: Development mode - allowing blocked origin:', origin);
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS policy`));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - Origin: ${req.headers.origin || 'No origin'}`);
  next();
});

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// Health check endpoint - optimized for Render
app.get('/health', async (req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const mongoState = ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState];
  
  // Check email service health
  const emailService = require('./services/emailService');
  const emailHealth = await emailService.checkEmailServiceHealth();
  
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    mongodb: {
      status: mongoStatus,
      state: mongoState,
      readyState: mongoose.connection.readyState
    },
    email: emailHealth
  });
});

// MongoDB-specific health check
app.get('/health/mongodb', (req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const mongoState = ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState];
  
  if (mongoose.connection.readyState === 1) {
    res.status(200).json({
      status: 'OK',
      mongodb: {
        status: mongoStatus,
        state: mongoState,
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        name: mongoose.connection.name
      }
    });
  } else {
    res.status(503).json({
      status: 'ERROR',
      mongodb: {
        status: mongoStatus,
        state: mongoState,
        readyState: mongoose.connection.readyState,
        error: 'MongoDB connection not available'
      }
    });
  }
});

// Root endpoint - lightweight
app.get('/', (req, res) => {
  res.json({ status: 'running' });
});

// Test endpoint for debugging
app.get('/test', (req, res) => {
  res.json({
    message: 'Test endpoint working',
    timestamp: new Date().toISOString(),
    headers: req.headers,
    method: req.method,
    url: req.url
  });
});

// Rate limiting removed for high-scale usage (10k+ users)
// Consider implementing application-level rate limiting if needed

// Body parsing optimized for high-scale usage
app.use(express.json({ 
  limit: '50mb', // Increased for large file uploads
  parameterLimit: 10000, // Increased parameter limit
  extended: false
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '50mb',
  parameterLimit: 10000
}));

// Static file serving with caching
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '1y',
  etag: true,
  lastModified: true
}));

// Cache control middleware
// Advanced caching middleware for high-scale usage
app.use((req, res, next) => {
  // Set appropriate cache headers based on endpoint
  if (req.method === 'GET') {
    if (req.path.startsWith('/api/categories')) {
      // Categories rarely change - cache for 1 hour
      res.set('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    } else if (req.path.startsWith('/api/reviews') && !req.path.includes('/trending')) {
      // Individual reviews - cache for 5 minutes
      res.set('Cache-Control', 'public, max-age=300, s-maxage=300');
    } else if (req.path.startsWith('/api/reviews/trending')) {
      // Trending reviews - cache for 2 minutes
      res.set('Cache-Control', 'public, max-age=120, s-maxage=120');
    } else if (req.path.startsWith('/api/users/leaderboard')) {
      // Leaderboard - cache for 10 minutes
      res.set('Cache-Control', 'public, max-age=600, s-maxage=600');
    } else if (req.path.startsWith('/api/')) {
      // Other API endpoints - cache for 1 minute
      res.set('Cache-Control', 'public, max-age=60, s-maxage=60');
    }
  }
  
  // Add performance headers
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('X-XSS-Protection', '1; mode=block');
  
  next();
});


// CORS test endpoint for debugging
app.get('/api/cors-test', (req, res) => {
  res.json({ 
    message: 'CORS test successful',
    allowedOrigins: finalAllowedOrigins,
    environment: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'not set'
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/users', require('./routes/users'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/reports', require('./routes/reports'));

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handling middleware
app.use((error, req, res, next) => {
  // console.error('Global error handler:', error);
  
  // Handle mongoose validation errors
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map(err => err.message);
    return res.status(400).json({ 
      message: 'Validation Error', 
      errors: messages 
    });
  }
  
  // Handle mongoose cast errors (invalid ObjectId)
  if (error.name === 'CastError') {
    return res.status(400).json({ 
      message: 'Invalid ID format' 
    });
  }
  
  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({ 
      message: 'Invalid token' 
    });
  }
  
  // Handle JWT expiration
  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({ 
      message: 'Token expired' 
    });
  }
  
  // Default error response
  res.status(error.status || 500).json({ 
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// MongoDB connection optimized for 10k+ concurrent users
const mongoOptions = {
  // Connection pool settings for high concurrency
  maxPoolSize: 50, // Increased from 10 to handle 10k users
  minPoolSize: 10, // Increased from 2 for better stability
  maxIdleTimeMS: 30000,
  
  // Timeout settings optimized for high load
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 30000,
  
  // Performance optimizations
  bufferCommands: false,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  retryWrites: true,
  w: 'majority',
  
  // High-load optimizations
  heartbeatFrequencyMS: 10000,
  retryReads: true,
  maxStalenessSeconds: 90,
  family: 4, // Force IPv4
  
  // Connection management for scale
  maxConnecting: 10, // Increased from 2
  directConnection: false,
  
  // Compression for bandwidth optimization
  compressors: ['zlib'],
  zlibCompressionLevel: 6,
  
  // Additional settings for high concurrency
  readPreference: 'secondaryPreferred', // Distribute reads
  readConcern: { level: 'majority' },
  writeConcern: { w: 'majority', j: true },
  
  // Connection monitoring
  monitorCommands: process.env.NODE_ENV === 'development'
};

// Enhanced MongoDB connection with better error handling
const connectToMongoDB = async () => {
  try {
    console.log('🔄 Attempting to connect to MongoDB...');
    console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Using environment variable' : 'Using default localhost');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trustpilot-clone', mongoOptions);
    
    console.log('✅ MongoDB connected successfully with optimized settings');
    
    // Set global mongoose options for better performance
    mongoose.set('debug', process.env.NODE_ENV === 'development');
    mongoose.set('autoIndex', false); // Disable auto-indexing in production
    
    // Add comprehensive connection event listeners
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
      console.error('Error type:', err.name);
      if (err.name === 'MongoNetworkTimeoutError') {
        console.error('🔄 Network timeout detected, will retry connection...');
      }
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected successfully');
    });
    
    mongoose.connection.on('close', () => {
      console.log('🔒 MongoDB connection closed');
    });
    
    mongoose.connection.on('connecting', () => {
      console.log('🔄 MongoDB connecting...');
    });
    
    mongoose.connection.on('connected', () => {
      console.log('✅ MongoDB connected');
    });
    
    mongoose.connection.on('open', () => {
      console.log('🚀 MongoDB connection opened');
    });
    
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB:', err.message);
    console.error('Error type:', err.name);
    console.error('MongoDB URI:', process.env.MONGODB_URI || 'mongodb://localhost:27017/trustpilot-clone');
    
    // Don't exit immediately, try to reconnect
    console.log('🔄 Will attempt to reconnect in 5 seconds...');
    setTimeout(() => {
      connectToMongoDB();
    }, 5000);
  }
};

// Start MongoDB connection
connectToMongoDB();

// Process error handlers
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Optimized for 10k+ concurrent users`);
  console.log(`🔗 MongoDB URI: ${process.env.MONGODB_URI ? 'Set' : 'Not set'}`);
  console.log(`🌐 Allowed CORS origins: ${finalAllowedOrigins.join(', ')}`);
  console.log(`⚡ Rate limiting: DISABLED for high-scale usage`);
}).on('error', (err) => {
  console.error('❌ Server startup error:', err);
  process.exit(1);
});

// Server timeout settings optimized for high concurrency
server.timeout = 60000; // Increased to 60 seconds for high load
server.keepAliveTimeout = 120000; // Increased to 2 minutes
server.headersTimeout = 125000; // Increased to 2 minutes 5 seconds

// Additional server optimizations for high-scale usage
server.maxConnections = 10000; // Allow up to 10k concurrent connections
server.maxHeadersCount = 2000; // Increased header limit
server.maxHeaderSize = 16384; // 16KB header size limit 