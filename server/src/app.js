const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const mongoose = require('mongoose');
const { createServer } = require('http');
const { Server } = require('socket.io');

// Import configuration
const config = require('./config/environment');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const logger = require('./middleware/logger');

// Import routes
const authRoutes = require('./routes/auth');
const debateRoutes = require('./routes/debates');
const topicRoutes = require('./routes/topics');
const userRoutes = require('./routes/users');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const server = createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: config.CLIENT_URL,
    methods: ['GET', 'POST']
  }
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", config.SARVAM_API_BASE_URL]
    }
  }
}));

// CORS configuration
app.use(cors({
  origin: config.CLIENT_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW * 60 * 1000,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security middleware
app.use(mongoSanitize());
app.use(compression());

// Logging middleware
app.use(logger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/debates', debateRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join debate room
  socket.on('join-debate', (debateId) => {
    socket.join(`debate-${debateId}`);
    console.log(`User ${socket.id} joined debate ${debateId}`);
  });

  // Handle real-time feedback
  socket.on('debate-progress', (data) => {
    socket.to(`debate-${data.debateId}`).emit('progress-update', data);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use(errorHandler);

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(config.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = () => {
  console.log('\n🔄 Received shutdown signal, closing server gracefully...');
  
  server.close(() => {
    console.log('✅ HTTP server closed');
    
    mongoose.connection.close(false, () => {
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    });
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error('❌ Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const startServer = async () => {
  try {
    await connectDB();
    
    const PORT = config.PORT;
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Environment: ${config.NODE_ENV}`);
      console.log(`🌐 Client URL: ${config.CLIENT_URL}`);
      console.log(`🤖 Sarvam AI: ${config.SARVAM_API_BASE_URL}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Start the application
if (require.main === module) {
  startServer();
}

module.exports = { app, server, io, startServer };