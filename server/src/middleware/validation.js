// Validation middleware using express-validator
const { body, param, query } = require('express-validator');

// User registration validation
const validateRegistration = [
  body('username')
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number')
];

// User login validation
const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Debate submission validation
const validateDebate = [
  body('topicId')
    .isMongoId()
    .withMessage('Invalid topic ID'),
  
  body('position')
    .isIn(['for', 'against'])
    .withMessage('Position must be either "for" or "against"'),
  
  body('arguments')
    .isArray({ min: 1, max: 5 })
    .withMessage('Must provide 1-5 arguments'),
  
  body('arguments.*.point')
    .isLength({ min: 10, max: 500 })
    .withMessage('Each argument point must be between 10 and 500 characters'),
  
  body('arguments.*.evidence')
    .isLength({ min: 20, max: 1000 })
    .withMessage('Each evidence must be between 20 and 1000 characters'),
  
  body('rebuttalPoints')
    .optional()
    .isArray({ max: 3 })
    .withMessage('Maximum 3 rebuttal points allowed'),
  
  body('rebuttalPoints.*.rebuttal')
    .optional()
    .isLength({ min: 10, max: 500 })
    .withMessage('Each rebuttal must be between 10 and 500 characters'),
  
  body('conclusion')
    .isLength({ min: 50, max: 1000 })
    .withMessage('Conclusion must be between 50 and 1000 characters')
];

// Topic creation validation
const validateTopic = [
  body('title')
    .isLength({ min: 10, max: 200 })
    .withMessage('Title must be between 10 and 200 characters'),
  
  body('description')
    .isLength({ min: 50, max: 2000 })
    .withMessage('Description must be between 50 and 2000 characters'),
  
  body('category')
    .isIn([
      'politics', 'technology', 'environment', 'education',
      'healthcare', 'ethics', 'economics', 'social-issues',
      'science', 'entertainment', 'sports', 'history',
      'philosophy', 'current-events'
    ])
    .withMessage('Invalid category'),
  
  body('difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Difficulty must be beginner, intermediate, or advanced'),
  
  body('keywords')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Maximum 10 keywords allowed'),
  
  body('estimatedTime')
    .optional()
    .isInt({ min: 5, max: 120 })
    .withMessage('Estimated time must be between 5 and 120 minutes')
];

// Profile update validation
const validateProfileUpdate = [
  body('username')
    .optional()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('bio')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Bio cannot exceed 200 characters'),
  
  body('avatar')
    .optional()
    .isURL()
    .withMessage('Avatar must be a valid URL')
];

// Preferences update validation
const validatePreferences = [
  body('language')
    .optional()
    .isIn(['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko'])
    .withMessage('Unsupported language'),
  
  body('theme')
    .optional()
    .isIn(['light', 'dark'])
    .withMessage('Theme must be light or dark'),
  
  body('notifications.email')
    .optional()
    .isBoolean()
    .withMessage('Email notifications setting must be boolean'),
  
  body('notifications.push')
    .optional()
    .isBoolean()
    .withMessage('Push notifications setting must be boolean')
];

// Feedback validation
const validateFeedback = [
  body('debateId')
    .isMongoId()
    .withMessage('Invalid debate ID'),
  
  body('scores.argumentation')
    .isInt({ min: 0, max: 100 })
    .withMessage('Argumentation score must be between 0 and 100'),
  
  body('scores.delivery')
    .isInt({ min: 0, max: 100 })
    .withMessage('Delivery score must be between 0 and 100'),
  
  body('scores.rebuttal')
    .isInt({ min: 0, max: 100 })
    .withMessage('Rebuttal score must be between 0 and 100'),
  
  body('scores.structure')
    .isInt({ min: 0, max: 100 })
    .withMessage('Structure score must be between 0 and 100'),
  
  body('strengths')
    .isArray({ min: 1, max: 5 })
    .withMessage('Must provide 1-5 strengths'),
  
  body('improvements')
    .isArray({ min: 1, max: 5 })
    .withMessage('Must provide 1-5 improvement suggestions'),
  
  body('detailedFeedback')
    .isLength({ min: 100, max: 2000 })
    .withMessage('Detailed feedback must be between 100 and 2000 characters')
];

// Peer review validation
const validatePeerReview = [
  body('debateId')
    .isMongoId()
    .withMessage('Invalid debate ID'),
  
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  
  body('comment')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Comment cannot exceed 500 characters')
];

// Password reset validation
const validatePasswordReset = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number')
];

// Search validation
const validateSearch = [
  query('q')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be between 2 and 100 characters'),
  
  query('category')
    .optional()
    .isIn([
      'politics', 'technology', 'environment', 'education',
      'healthcare', 'ethics', 'economics', 'social-issues',
      'science', 'entertainment', 'sports', 'history',
      'philosophy', 'current-events'
    ])
    .withMessage('Invalid category'),
  
  query('difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Invalid difficulty level'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
];

// MongoDB ObjectId validation
const validateObjectId = (paramName = 'id') => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName}`)
];

// File upload validation
const validateFileUpload = (fieldName, allowedTypes = [], maxSize = 5 * 1024 * 1024) => {
  return (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }
    
    // Check file type
    if (allowedTypes.length > 0 && !allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
      });
    }
    
    // Check file size
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        error: `File too large. Maximum size: ${maxSize / 1024 / 1024}MB`
      });
    }
    
    next();
  };
};

// Sanitize input to prevent XSS
const sanitizeInput = [
  body('*').trim().escape()
];

module.exports = {
  validateRegistration,
  validateLogin,
  validateDebate,
  validateTopic,
  validateProfileUpdate,
  validatePreferences,
  validateFeedback,
  validatePeerReview,
  validatePasswordReset,
  validateSearch,
  validateObjectId,
  validateFileUpload,
  sanitizeInput
};
