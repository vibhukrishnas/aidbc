#!/usr/bin/env node

/**
 * Environment Variable Validation Script
 * Run this to check if all required environment variables are properly set
 */

const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkEnvFile() {
  const envPath = path.join(__dirname, '..', '.env');
  const envExamplePath = path.join(__dirname, '..', '.env.example');
  
  console.log('🔍 Checking environment configuration...\n');
  
  // Check if .env file exists
  if (!fs.existsSync(envPath)) {
    log('red', '❌ .env file not found!');
    
    if (fs.existsSync(envExamplePath)) {
      log('yellow', '💡 Found .env.example file. Creating .env...');
      fs.copyFileSync(envExamplePath, envPath);
      log('green', '✅ .env file created from template');
      log('yellow', '⚠️  Please edit .env file with your actual values');
    } else {
      log('red', '❌ .env.example file also not found!');
      return false;
    }
  } else {
    log('green', '✅ .env file found');
  }
  
  return true;
}

function validateEnvironmentVariables() {
  // Load environment variables
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
  
  const requiredVars = [
    {
      name: 'SARVAM_API_KEY',
      description: 'Sarvam AI API key for AI functionality',
      example: 'sk_xxxxx...',
      validate: (value) => value && value.startsWith('sk_')
    },
    {
      name: 'JWT_SECRET',
      description: 'JWT signing secret (minimum 32 characters)',
      example: 'your-super-secret-jwt-key-change-this',
      validate: (value) => value && value.length >= 32
    }
  ];
  
  const optionalVars = [
    {
      name: 'MONGODB_URI',
      description: 'MongoDB connection string',
      default: 'mongodb://localhost:27017/debate-coach'
    },
    {
      name: 'REDIS_URL',
      description: 'Redis connection URL for caching',
      default: 'Not configured (optional)'
    },
    {
      name: 'PORT',
      description: 'Server port',
      default: '3001'
    },
    {
      name: 'CLIENT_URL',
      description: 'Frontend application URL',
      default: 'http://localhost:3000'
    }
  ];
  
  console.log('\n📋 Required Environment Variables:');
  console.log('=====================================');
  
  let hasErrors = false;
  
  requiredVars.forEach(variable => {
    const value = process.env[variable.name];
    const isValid = variable.validate ? variable.validate(value) : !!value;
    
    if (isValid) {
      log('green', `✅ ${variable.name}: Set and valid`);
    } else {
      log('red', `❌ ${variable.name}: Missing or invalid`);
      log('yellow', `   Description: ${variable.description}`);
      if (variable.example) {
        log('yellow', `   Example: ${variable.example}`);
      }
      hasErrors = true;
    }
  });
  
  console.log('\n📋 Optional Environment Variables:');
  console.log('===================================');
  
  optionalVars.forEach(variable => {
    const value = process.env[variable.name];
    
    if (value) {
      log('green', `✅ ${variable.name}: ${value}`);
    } else {
      log('yellow', `⚠️  ${variable.name}: Using default (${variable.default})`);
    }
  });
  
  return !hasErrors;
}

function displaySetupInstructions() {
  console.log('\n🚀 Quick Setup Instructions:');
  console.log('============================');
  console.log('1. Get your Sarvam AI API key:');
  console.log('   • Visit https://www.sarvam.ai/');
  console.log('   • Sign up for developer account');
  console.log('   • Generate API key');
  console.log('');
  console.log('2. Edit your .env file:');
  console.log('   • Open .env in your text editor');
  console.log('   • Replace placeholder values with real ones');
  console.log('   • Save the file');
  console.log('');
  console.log('3. Generate JWT secret:');
  console.log('   • Run: openssl rand -base64 64');
  console.log('   • Or use any random 32+ character string');
  console.log('');
  console.log('4. Start your application:');
  console.log('   • Run: npm install');
  console.log('   • Run: npm run dev');
}

function main() {
  console.log('🎯 AI Debate Coach - Environment Validation');
  console.log('==========================================');
  
  // Check if .env file exists
  if (!checkEnvFile()) {
    process.exit(1);
  }
  
  // Validate environment variables
  const isValid = validateEnvironmentVariables();
  
  if (isValid) {
    console.log('\n🎉 Environment validation successful!');
    log('green', '✅ All required environment variables are properly configured');
    console.log('\n🚀 You can now start your application with: npm run dev');
  } else {
    console.log('\n❌ Environment validation failed!');
    log('red', '🚨 Please fix the missing or invalid environment variables');
    displaySetupInstructions();
    process.exit(1);
  }
}

// Run the validation
if (require.main === module) {
  main();
}

module.exports = {
  checkEnvFile,
  validateEnvironmentVariables,
  displaySetupInstructions
};