// Rate limiting middleware
const rateLimit = require('express-rate-limit');
const MongoStore = require('rate-limit-mongo');

// General API rate limiting
const generalLimiter = rateLimit({
  store: new MongoStore({
    uri: process.env.MONGODB_URI,
    collectionName: 'rate_limits',
    expireTimeMs: 15 * 60 * 1000 // 15 minutes
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Strict rate limiting for authentication endpoints
const authLimiter = rateLimit({
  store: new MongoStore({
    uri: process.env.MONGODB_URI,
    collectionName: 'auth_rate_limits',
    expireTimeMs: 15 * 60 * 1000
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 auth attempts per windowMs
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later'
  },
  skipSuccessfulRequests: true
});

// Password reset rate limiting
const passwordResetLimiter = rateLimit({
  store: new MongoStore({
    uri: process.env.MONGODB_URI,
    collectionName: 'password_reset_limits',
    expireTimeMs: 60 * 60 * 1000 // 1 hour
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 password reset attempts per hour
  message: {
    success: false,
    error: 'Too many password reset attempts, please try again later'
  }
});

// Debate submission rate limiting
const debateSubmissionLimiter = rateLimit({
  store: new MongoStore({
    uri: process.env.MONGODB_URI,
    collectionName: 'debate_submission_limits',
    expireTimeMs: 60 * 60 * 1000 // 1 hour
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // limit each IP to 20 debate submissions per hour
  message: {
    success: false,
    error: 'Too many debate submissions, please slow down'
  }
});

// AI analysis rate limiting (more restrictive due to resource usage)
const aiAnalysisLimiter = rateLimit({
  store: new MongoStore({
    uri: process.env.MONGODB_URI,
    collectionName: 'ai_analysis_limits',
    expireTimeMs: 60 * 60 * 1000 // 1 hour
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // limit each IP to 50 AI analysis requests per hour
  message: {
    success: false,
    error: 'Too many AI analysis requests, please wait before requesting more'
  }
});

// Search rate limiting
const searchLimiter = rateLimit({
  store: new MongoStore({
    uri: process.env.MONGODB_URI,
    collectionName: 'search_limits',
    expireTimeMs: 5 * 60 * 1000 // 5 minutes
  }),
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // limit each IP to 100 searches per 5 minutes
  message: {
    success: false,
    error: 'Too many search requests, please slow down'
  }
});

// File upload rate limiting
const uploadLimiter = rateLimit({
  store: new MongoStore({
    uri: process.env.MONGODB_URI,
    collectionName: 'upload_limits',
    expireTimeMs: 60 * 60 * 1000 // 1 hour
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 uploads per hour
  message: {
    success: false,
    error: 'Too many file uploads, please wait before uploading more'
  }
});

// Registration rate limiting
const registrationLimiter = rateLimit({
  store: new MongoStore({
    uri: process.env.MONGODB_URI,
    collectionName: 'registration_limits',
    expireTimeMs: 24 * 60 * 60 * 1000 // 24 hours
  }),
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 3, // limit each IP to 3 registration attempts per day
  message: {
    success: false,
    error: 'Too many registration attempts, please try again tomorrow'
  }
});

// Feedback submission rate limiting
const feedbackLimiter = rateLimit({
  store: new MongoStore({
    uri: process.env.MONGODB_URI,
    collectionName: 'feedback_limits',
    expireTimeMs: 60 * 60 * 1000 // 1 hour
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // limit each IP to 30 feedback submissions per hour
  message: {
    success: false,
    error: 'Too many feedback submissions, please slow down'
  }
});

// Custom rate limiter that varies based on user level
const createUserBasedLimiter = (baseMax, multiplier = 1.5) => {
  return rateLimit({
    store: new MongoStore({
      uri: process.env.MONGODB_URI,
      collectionName: 'user_based_limits',
      expireTimeMs: 60 * 60 * 1000 // 1 hour
    }),
    windowMs: 60 * 60 * 1000, // 1 hour
    max: (req) => {
      const userLevel = req.user?.level || 1;
      return Math.floor(baseMax * Math.pow(multiplier, Math.min(userLevel - 1, 10)));
    },
    keyGenerator: (req) => {
      return req.user?.id || req.ip;
    },
    message: {
      success: false,
      error: 'Rate limit exceeded. Higher level users get higher limits!'
    }
  });
};

// Skip rate limiting for certain conditions
const createSkipFunction = (skipConditions = []) => {
  return (req) => {
    // Skip for localhost in development
    if (process.env.NODE_ENV === 'development' && req.ip === '127.0.0.1') {
      return true;
    }
    
    // Skip for premium users
    if (req.user?.isPremium) {
      return true;
    }
    
    // Skip for admins
    if (req.user?.role === 'admin') {
      return true;
    }
    
    // Custom skip conditions
    return skipConditions.some(condition => condition(req));
  };
};

// Apply skip function to limiters
const applySkipToLimiter = (limiter, skipConditions) => {
  limiter.skip = createSkipFunction(skipConditions);
  return limiter;
};

// Dynamic rate limiter based on system load
const dynamicLimiter = rateLimit({
  store: new MongoStore({
    uri: process.env.MONGODB_URI,
    collectionName: 'dynamic_limits',
    expireTimeMs: 60 * 60 * 1000 // 1 hour
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: (req) => {
    // Reduce limits during high load (you could integrate with system monitoring)
    const systemLoad = process.cpuUsage().system / 1000000; // Convert to seconds
    const baseLimit = 100;
    
    if (systemLoad > 80) return Math.floor(baseLimit * 0.5); // 50% during high load
    if (systemLoad > 60) return Math.floor(baseLimit * 0.7); // 70% during medium load
    return baseLimit;
  },
  message: {
    success: false,
    error: 'System under high load, please try again later'
  }
});

module.exports = {
  generalLimiter,
  authLimiter,
  passwordResetLimiter,
  debateSubmissionLimiter,
  aiAnalysisLimiter,
  searchLimiter,
  uploadLimiter,
  registrationLimiter,
  feedbackLimiter,
  createUserBasedLimiter,
  applySkipToLimiter,
  dynamicLimiter
};
