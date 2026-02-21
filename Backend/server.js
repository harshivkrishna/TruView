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

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'https://www.truviews.in',
  'https://truviews.in',
  'https://truview-xc01.onrender.com',
  'https://truviews-frontend.onrender.com',
  'https://truviews.netlify.app',
  'https://truviews.vercel.app',
  'https://truview-steel.vercel.app'
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

// CORS configuration will be applied below with corsOptions

const productionOrigins = [
  'https://www.truviews.in',
  'https://truviews.in'
];

const finalAllowedOrigins = [...new Set([...allowedOrigins, ...productionOrigins])];


const corsOptions = {
  origin: function (origin, callback) {
    console.log(`🌐 CORS Check - Origin: ${origin || 'No origin'}`);

    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      console.log('✅ CORS: Allowing request with no origin');
      return callback(null, true);
    }

    // Allow localhost and 127.0.0.1 for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      console.log('✅ CORS: Allowing localhost/127.0.0.1');
      return callback(null, true);
    }

    // Check if origin is in allowed list
    if (finalAllowedOrigins.indexOf(origin) !== -1) {
      console.log('✅ CORS: Origin found in allowed list');
      callback(null, true);
    } else {
      console.log(`❌ CORS: Origin ${origin} not in allowed list`);
      console.log('📋 Allowed origins:', finalAllowedOrigins);

      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 Development mode: Allowing all origins');
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS policy`));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Accept', 
    'Origin',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Credentials',
    'Access-Control-Allow-Headers',
    'Access-Control-Allow-Methods'
  ],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - Origin: ${req.headers.origin || 'No origin'}`);
  next();
});

app.options('*', cors(corsOptions));

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

app.get('/', (req, res) => {
  res.json({ status: 'running' });
});

app.get('/test', (req, res) => {
  res.json({
    message: 'Test endpoint working',
    timestamp: new Date().toISOString(),
    headers: req.headers,
    method: req.method,
    url: req.url
  });
});

app.get('/cors-test', (req, res) => {
  res.json({
    message: 'CORS test successful',
    origin: req.headers.origin || 'No origin',
    timestamp: new Date().toISOString(),
    allowedOrigins: finalAllowedOrigins
  });
});

app.get('/email-test', async (req, res) => {
  try {
    const emailService = require('./services/emailService');
    
    const emailHealth = await emailService.checkEmailServiceHealth();
    
    res.json({
      message: 'Gmail email service test',
      timestamp: new Date().toISOString(),
      emailService: emailHealth,
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({
      message: 'Email service test failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/send-test-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    const emailService = require('./services/emailService');
    
    console.log('🧪 Sending test email via Gmail to:', email);
    
    const result = await emailService.sendVerificationOTP(
      email, 
      '123456', 
      'Test User'
    );
    
    res.json({
      message: 'Test email sent',
      result: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Test email failed:', error);
    res.status(500).json({
      message: 'Test email failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.use(express.json({
  limit: '50mb',
  parameterLimit: 10000,
  extended: false
}));
app.use(express.urlencoded({
  extended: true,
  limit: '50mb',
  parameterLimit: 10000
}));

app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '1y',
  etag: true,
  lastModified: true
}));

app.use((req, res, next) => {
  if (req.method === 'GET') {
    if (req.path.startsWith('/api/categories')) {
      res.set('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    } else if (req.path.startsWith('/api/reviews') && !req.path.includes('/trending')) {
      res.set('Cache-Control', 'public, max-age=300, s-maxage=300');
    } else if (req.path.startsWith('/api/reviews/trending')) {
      res.set('Cache-Control', 'public, max-age=120, s-maxage=120');
    } else if (req.path.startsWith('/api/users/leaderboard')) {
      res.set('Cache-Control', 'public, max-age=600, s-maxage=600');
    } else if (req.path.startsWith('/api/')) {
      res.set('Cache-Control', 'public, max-age=60, s-maxage=60');
    }
  }
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('X-XSS-Protection', '1; mode=block');

  next();
});



// Email test endpoint removed - using EmailJS on frontend

app.use('/api/auth', require('./routes/auth'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/users', require('./routes/users'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/reports', require('./routes/reports'));

app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((error, req, res, next) => {
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map(err => err.message);
    return res.status(400).json({
      message: 'Validation Error',
      errors: messages
    });
  }

  if (error.name === 'CastError') {
    return res.status(400).json({
      message: 'Invalid ID format'
    });
  }

  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      message: 'Invalid token'
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      message: 'Token expired'
    });
  }
  res.status(error.status || 500).json({
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

const mongoOptions = {
  maxPoolSize: 50,
  minPoolSize: 10,
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 60000, // Increased to 60s
  socketTimeoutMS: 75000, // Increased to 75s
  connectTimeoutMS: 60000, // Increased to 60s
  bufferCommands: false,
  retryWrites: true,
  w: 'majority',
  heartbeatFrequencyMS: 10000,
  retryReads: true,
  family: 4, // Force IPv4
  directConnection: false,
  monitorCommands: process.env.NODE_ENV === 'development'
};

const connectToMongoDB = async () => {
  try {
    console.log('🔄 Attempting to connect to MongoDB...');
    console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Using environment variable' : 'Using default localhost');

    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/truviews', mongoOptions);

    console.log('✅ MongoDB connected successfully with optimized settings');

    mongoose.set('debug', process.env.NODE_ENV === 'development');
    mongoose.set('autoIndex', false);
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
    console.error('MongoDB URI:', process.env.MONGODB_URI || 'mongodb://localhost:27017/truviews');

    console.log('🔄 Will attempt to reconnect in 5 seconds...');
    setTimeout(() => {
      connectToMongoDB();
    }, 5000);
  }
};

connectToMongoDB();

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

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
  console.log(`🔗 MongoDB URI: ${process.env.MONGODB_URI ? 'Set' : 'Not set'}`);
}).on('error', (err) => {
  console.error('❌ Server startup error:', err);
  process.exit(1);
});

server.timeout = 60000;
server.keepAliveTimeout = 120000;
server.headersTimeout = 125000;
server.maxConnections = 10000;
server.maxHeadersCount = 2000;
server.maxHeaderSize = 16384; 