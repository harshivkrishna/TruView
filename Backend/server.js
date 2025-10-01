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

// Compression middleware for response optimization
app.use(compression({
  level: 6, // Compression level (0-9)
  threshold: 1024, // Only compress responses larger than 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
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
  'https://truview-y909.onrender.com' // Backend domain (for testing)
];

// Add any additional origins from environment variable
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

// Ensure production domains are always included regardless of environment variables
const productionOrigins = [
  'https://truview-steel.vercel.app',
  'https://truview.vercel.app'
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

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// Rate limiting for API endpoints
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: { message: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
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
  console.error('Global error handler:', error);
  
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

// MongoDB connection with performance optimizations
const mongoOptions = {
  maxPoolSize: 10,
  minPoolSize: 2,
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferCommands: false,
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trustpilot-clone', mongoOptions)
  .then(() => {
    console.log('MongoDB connected with optimized settings');
    
    // Set global mongoose options for better performance
    mongoose.set('debug', process.env.NODE_ENV === 'development');
    mongoose.set('autoIndex', false); // Disable auto-indexing in production
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
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
  console.log(`Server running on port ${PORT} with performance optimizations`);
});

// Server timeout settings
server.timeout = 30000; // 30 seconds
server.keepAliveTimeout = 65000; // 65 seconds
server.headersTimeout = 66000; // 66 seconds 