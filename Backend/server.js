const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const compression = require('compression');


dotenv.config();

const app = express();

// Trust proxy - REQUIRED for Render and other proxy services
// This allows express-rate-limit to correctly identify users behind proxies
app.set('trust proxy', 1);

// Compression middleware - optimized for Render
app.use(compression({
  level: 4, // Reduced compression level for faster processing
  threshold: 2048, // Only compress responses larger than 2KB
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
app.get('/health', (req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const mongoState = ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState];
  
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    mongodb: {
      status: mongoStatus,
      state: mongoState,
      readyState: mongoose.connection.readyState
    }
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

// Rate limiting for API endpoints - relaxed for production use
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Increased limit for better user experience
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/api/health';
  }
});
app.use('/api/', limiter);

// Rate limiting for auth endpoints - more reasonable limits
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Increased from 5 to 20 for better user experience
  message: { message: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});
app.use('/api/auth', authLimiter);

// Body parsing with limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving with caching
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '1y',
  etag: true,
  lastModified: true
}));

// Cache control middleware
app.use((req, res, next) => {
  // Cache API responses for 5 minutes
  if (req.method === 'GET' && req.path.startsWith('/api/')) {
    res.set('Cache-Control', 'public, max-age=300');
  }
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

// MongoDB connection optimized for production stability
const mongoOptions = {
  maxPoolSize: 10, // Increased for better connection handling
  minPoolSize: 2, // Increased for stability
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 30000, // Increased to 30s for better reliability
  socketTimeoutMS: 45000, // Increased to 45s
  connectTimeoutMS: 30000, // Increased to 30s
  bufferCommands: false,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  retryWrites: true,
  w: 'majority',
  // Additional optimizations for production stability
  heartbeatFrequencyMS: 10000,
  // Connection retry settings
  retryReads: true,
  maxStalenessSeconds: 90,
  // Network settings
  family: 4, // Force IPv4
  // Connection pool settings
  maxConnecting: 2,
  // Additional stability settings
  directConnection: false,
  // Compression
  compressors: ['zlib'],
  zlibCompressionLevel: 6,
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
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`MongoDB URI: ${process.env.MONGODB_URI ? 'Set' : 'Not set'}`);
  console.log(`Allowed CORS origins: ${finalAllowedOrigins.join(', ')}`);
}).on('error', (err) => {
  console.error('Server startup error:', err);
  process.exit(1);
});

// Server timeout settings
server.timeout = 30000; // 30 seconds
server.keepAliveTimeout = 65000; // 65 seconds
server.headersTimeout = 66000; // 66 seconds 