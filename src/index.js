'use strict';
require('module-alias/register');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');

// Load environment variables from .env file
dotenv.config();

const app = express();
const httpServer = createServer(app);

let corsOrigin;


if (process.env.NODE_ENV === 'production') {
  // production: use env variable, split by comma
  corsOrigin = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [];
} else {
  // development: allow all origins
  corsOrigin = '*';
}

const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin || '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;

// Enhanced Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses
app.use(cors({
  origin: corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 1000 requests per windowMs
});
app.use(limiter);

// MongoDB Connection with improved settings
const mongoOptions = {
  dbName: process.env.DB_NAME || "lapsnaps",
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 30000,
  maxPoolSize: 50,
  minPoolSize: 5,
  retryWrites: true,
  retryReads: true,
  heartbeatFrequencyMS: 10000,
  waitQueueTimeoutMS: 10000
};

const connectWithRetry = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, mongoOptions);
    console.log('✅ Connected to MongoDB');
    
    // Connection event listeners
    mongoose.connection.on('connected', () => {
      console.log('Mongoose connected to DB');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('Mongoose connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('Mongoose disconnected from DB');
    });
    
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB:', err.message);
    console.log('Retrying connection in 5 seconds...');
    setTimeout(connectWithRetry, 5000);
  }
};

// Initialize connection
connectWithRetry();

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('Mongoose connection closed due to app termination');
  process.exit(0);
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('New client connected');
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Route imports
const routes = [
  require('./routes/home'),
  require('./routes/auth'),
  require('./routes/brand'),
  require('./routes/category'),
  require('./routes/subcategory'),
  require('./routes/newsletter'),
  require('./routes/product'),
  require('./routes/dashboard'),
  require('./routes/search'),
  require('./routes/user'),
  require('./routes/cart'),
  require('./routes/coupon-code'),
  require('./routes/product-review'),
  require('./routes/review'),
  require('./routes/wishlist'),
  require('./routes/order'),
  require('./routes/payment-intents'),
  require('./routes/file-delete'),
  require('./routes/shop'),
  require('./routes/payment'),
  require('./routes/currencies'),
  require('./routes/compaign')
];

// Register all routes with /api prefix
routes.forEach(route => app.use('/api', route));

// Health check endpoint
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.status(200).json({
    status: 'UP',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app; // For testing