// Main routes file
const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const debateRoutes = require('./debate.routes');
const topicRoutes = require('./topic.routes');
const feedbackRoutes = require('./feedback.routes');

// Import middleware
const { generalLimiter } = require('../middleware/rateLimiting');

// Apply general rate limiting to all routes
router.use(generalLimiter);

// Mount routes
router.use('/api/auth', authRoutes);
router.use('/api/users', userRoutes);
router.use('/api/debates', debateRoutes);
router.use('/api/topics', topicRoutes);
router.use('/api/feedback', feedbackRoutes);

// Health check endpoint
router.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Debate Coach AI API is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API info endpoint
router.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Debate Coach AI API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      debates: '/api/debates',
      topics: '/api/topics',
      feedback: '/api/feedback'
    },
    documentation: process.env.API_DOCS_URL || 'Coming soon'
  });
});

module.exports = router;
