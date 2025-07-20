require('dotenv').config();

const config = {
  // Server Configuration
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT) || 3001,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',

  // Database Configuration
  MONGODB_URI: process.env.MONGODB_URI,
  
  // Sarvam AI Configuration
  SARVAM_API_KEY: process.env.SARVAM_API_KEY,
  SARVAM_API_BASE_URL: process.env.SARVAM_API_BASE_URL || 'https://api.sarvam.ai/v1',
  SARVAM_TIMEOUT: parseInt(process.env.SARVAM_TIMEOUT) || 30000,

  // Authentication
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 12,

  // Redis Configuration (Optional)
  REDIS_URL: process.env.REDIS_URL,

  // Rate Limiting
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW) || 15,
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,

  // File Upload
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 10485760,
  UPLOAD_PATH: process.env.UPLOAD_PATH || './uploads',

  // Email Configuration (Optional)
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: parseInt(process.env.EMAIL_PORT) || 587,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,

  // Analytics (Optional)
  GOOGLE_ANALYTICS_ID: process.env.GOOGLE_ANALYTICS_ID,

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FILE: process.env.LOG_FILE || './logs/app.log',

  // Feature Flags
  ENABLE_SPEECH_RECOGNITION: process.env.ENABLE_SPEECH_RECOGNITION !== 'false',
  ENABLE_MULTILINGUAL: process.env.ENABLE_MULTILINGUAL !== 'false',
  ENABLE_GAMIFICATION: process.env.ENABLE_GAMIFICATION !== 'false',

  // Supported Languages
  SUPPORTED_LANGUAGES: process.env.SUPPORTED_LANGUAGES || 'en,hi,ta,te,kn,ml,bn,gu,mr,pa'
};

// Add computed properties
config.isDevelopment = config.NODE_ENV === 'development';
config.isProduction = config.NODE_ENV === 'production';
config.isTesting = config.NODE_ENV === 'test';

// Parse supported languages array
config.SUPPORTED_LANGUAGES_ARRAY = config.SUPPORTED_LANGUAGES.split(',').map(lang => lang.trim());

// Basic validation for required variables
if (!config.SARVAM_API_KEY && config.isProduction) {
  console.error('❌ SARVAM_API_KEY is required in production');
  process.exit(1);
}

if (!config.JWT_SECRET || config.JWT_SECRET === 'your-super-secret-jwt-key-change-this') {
  if (config.isProduction) {
    console.error('❌ JWT_SECRET must be set to a secure value in production');
    process.exit(1);
  } else {
    console.warn('⚠️  Using default JWT_SECRET - change this for production!');
  }
}

// Log configuration status
if (config.isDevelopment) {
  console.log('🔧 Environment Configuration:');
  console.log(`   NODE_ENV: ${config.NODE_ENV}`);
  console.log(`   PORT: ${config.PORT}`);
  console.log(`   SARVAM_API_KEY: ${config.SARVAM_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`   JWT_SECRET: ${config.JWT_SECRET ? '✅ Set' : '❌ Missing'}`);
  console.log(`   MONGODB_URI: ${config.MONGODB_URI}`);
}

module.exports = config;