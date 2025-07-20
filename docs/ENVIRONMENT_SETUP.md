# 🔧 Environment Variables Setup Guide

This guide explains how to properly set up and use environment variables in the AI Debate Coach application.

## 📋 Quick Setup Checklist

1. ✅ Install dotenv package
2. ✅ Create .env file from template
3. ✅ Add your API keys
4. ✅ Load environment variables in app
5. ✅ Access variables using process.env

## 🚀 Step-by-Step Setup

### 1. Install dotenv Package
```bash
npm install dotenv
```

### 2. Create Your .env File
```bash
cp .env.example .env
```

### 3. Add Your Actual Values
Edit `.env` file with your real credentials:
```env
# Critical API Keys
SARVAM_API_KEY=sk_bpqw77xq_OmuR59FMUH4hRE2yn1tO21gfdoi
JWT_SECRET=2d0e7fb155187fb23d8679be23414e2e
MONGODB_URI=mongodb://localhost:27017/debate-coach
REDIS_URL=redis://localhost:6379

# Server Configuration
NODE_ENV=development
PORT=3001
CLIENT_URL=http://localhost:3000

# Sarvam AI Configuration
SARVAM_API_BASE_URL=https://api.sarvam.ai/v1
SARVAM_TIMEOUT=30000

# Authentication
JWT_EXPIRE=7d
BCRYPT_ROUNDS=12

# Optional Features
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log
```

## 📝 How to Access Environment Variables

### Load Environment Variables (Top of app.js)
```javascript
require('dotenv').config();
```

### Access Individual Variables
```javascript
// Critical API Keys
const sarvamApiKey = process.env.SARVAM_API_KEY;
const jwtSecret = process.env.JWT_SECRET;
const mongodbUri = process.env.MONGODB_URI;
const redisUrl = process.env.REDIS_URL;

// Server Configuration
const nodeEnv = process.env.NODE_ENV;
const port = process.env.PORT;
const clientUrl = process.env.CLIENT_URL;

// Sarvam AI Configuration
const sarvamApiBaseUrl = process.env.SARVAM_API_BASE_URL;
const sarvamTimeout = process.env.SARVAM_TIMEOUT;

// Authentication
const jwtExpire = process.env.JWT_EXPIRE;
const bcryptRounds = process.env.BCRYPT_ROUNDS;

// Optional API Keys
const googleAnalyticsId = process.env.GOOGLE_ANALYTICS_ID;
const emailHost = process.env.EMAIL_HOST;
const emailPort = process.env.EMAIL_PORT;
const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;

// Rate Limiting
const rateLimitWindow = process.env.RATE_LIMIT_WINDOW;
const rateLimitMaxRequests = process.env.RATE_LIMIT_MAX_REQUESTS;

// File Upload
const maxFileSize = process.env.MAX_FILE_SIZE;
const uploadPath = process.env.UPLOAD_PATH;

// Logging
const logLevel = process.env.LOG_LEVEL;
const logFile = process.env.LOG_FILE;
```

## 📊 Complete Environment Variables Reference

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `SARVAM_API_KEY` | String | ✅ | - | Sarvam AI API key |
| `JWT_SECRET` | String | ✅ | - | JWT signing secret |
| `MONGODB_URI` | String | ✅ | `mongodb://localhost:27017/debate-coach` | MongoDB connection |
| `REDIS_URL` | String | ❌ | - | Redis cache URL |
| `NODE_ENV` | String | ❌ | `development` | Environment mode |
| `PORT` | Number | ❌ | `3001` | Server port |
| `CLIENT_URL` | String | ❌ | `http://localhost:3000` | Frontend URL |
| `SARVAM_API_BASE_URL` | String | ❌ | `https://api.sarvam.ai/v1` | Sarvam API base |
| `SARVAM_TIMEOUT` | Number | ❌ | `30000` | API timeout (ms) |
| `JWT_EXPIRE` | String | ❌ | `7d` | JWT expiration |
| `BCRYPT_ROUNDS` | Number | ❌ | `12` | Password hashing rounds |
| `GOOGLE_ANALYTICS_ID` | String | ❌ | - | GA tracking ID |
| `EMAIL_HOST` | String | ❌ | - | SMTP host |
| `EMAIL_PORT` | Number | ❌ | `587` | SMTP port |
| `EMAIL_USER` | String | ❌ | - | Email username |
| `EMAIL_PASS` | String | ❌ | - | Email password |
| `RATE_LIMIT_WINDOW` | Number | ❌ | `15` | Rate limit window (min) |
| `RATE_LIMIT_MAX_REQUESTS` | Number | ❌ | `100` | Max requests per window |
| `MAX_FILE_SIZE` | Number | ❌ | `10485760` | Max upload size (bytes) |
| `UPLOAD_PATH` | String | ❌ | `./uploads` | Upload directory |
| `LOG_LEVEL` | String | ❌ | `info` | Logging level |
| `LOG_FILE` | String | ❌ | `./logs/app.log` | Log file path |

## 🔒 Security Best Practices

### ✅ DO:
- Use environment variables for all secrets
- Keep .env file in .gitignore
- Use different values for different environments
- Validate required variables on startup
- Use strong, random secrets

### ❌ DON'T:
- Commit .env files to version control
- Hardcode secrets in source code
- Share API keys in plain text
- Use weak or predictable secrets
- Log sensitive environment variables

## 🚀 Environment-Specific Configurations

### Development (.env)
```env
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/debate-coach
CLIENT_URL=http://localhost:3000
LOG_LEVEL=debug
```

### Production
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/debate-coach
CLIENT_URL=https://your-domain.com
LOG_LEVEL=error
```

### Testing (.env.test)
```env
NODE_ENV=test
MONGODB_URI=mongodb://localhost:27017/debate-coach-test
JWT_SECRET=test-secret-key
```

## 🔧 Validation and Error Handling

The application automatically validates required environment variables on startup:

```javascript
// In server/src/config/environment.js
const requiredVars = ['SARVAM_API_KEY', 'JWT_SECRET'];

if (config.isProduction) {
  requiredVars.push('MONGODB_URI');
}

const missingVars = requiredVars.filter(varName => !config[varName]);

if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars.join(', '));
  if (config.isProduction) {
    process.exit(1);
  }
}
```

## 🐳 Docker Environment Variables

For Docker deployments, you can:

1. **Use .env file:**
```yaml
# docker-compose.yml
services:
  server:
    env_file:
      - .env
```

2. **Set directly in compose:**
```yaml
services:
  server:
    environment:
      - SARVAM_API_KEY=${SARVAM_API_KEY}
      - JWT_SECRET=${JWT_SECRET}
```

3. **Use Docker secrets:**
```yaml
services:
  server:
    secrets:
      - sarvam_api_key
      - jwt_secret
```

## ☁️ Cloud Platform Environment Variables

### Vercel
```bash
vercel env add SARVAM_API_KEY
vercel env add JWT_SECRET
```

### Railway
```bash
railway variables set SARVAM_API_KEY=your-key
railway variables set JWT_SECRET=your-secret
```

### Heroku
```bash
heroku config:set SARVAM_API_KEY=your-key
heroku config:set JWT_SECRET=your-secret
```

## 🧪 Testing Environment Variables

Create a `.env.test` file for testing:
```env
NODE_ENV=test
MONGODB_URI=mongodb://localhost:27017/debate-coach-test
JWT_SECRET=test-jwt-secret
SARVAM_API_KEY=test-api-key
```

## 🔍 Debugging Environment Variables

To debug environment variable loading:

```javascript
// Add this to your app.js for debugging
console.log('Environment Variables Loaded:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('SARVAM_API_KEY:', process.env.SARVAM_API_KEY ? '✅ Set' : '❌ Missing');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Missing');
```

## 📞 Troubleshooting

### Common Issues:

1. **Variables not loading:**
   - Ensure `require('dotenv').config()` is at the top
   - Check .env file exists and has correct syntax
   - Restart your server after changes

2. **Undefined variables:**
   - Check spelling in .env file
   - Ensure no spaces around = sign
   - Check for trailing spaces

3. **Production issues:**
   - Set variables directly on hosting platform
   - Don't rely on .env files in production
   - Use platform-specific secret management

Remember: Always restart your server after updating environment variables! 🔄