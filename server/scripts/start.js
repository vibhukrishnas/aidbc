#!/usr/bin/env node

/**
 * AI Debate Coach Server Startup Script
 * Handles environment validation and graceful startup
 */

const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function displayBanner() {
  console.log(colors.cyan);
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    🎯 AI Debate Coach                        ║');
  console.log('║                  Backend Server Starting                     ║');
  console.log('║                                                              ║');
  console.log('║  Accessible AI-powered debate education platform            ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);
}

function checkEnvironment() {
  log('blue', '🔍 Checking environment configuration...');
  
  const envPath = path.join(__dirname, '../../.env');
  
  if (!fs.existsSync(envPath)) {
    log('red', '❌ .env file not found!');
    log('yellow', '💡 Run: cp .env.example .env');
    log('yellow', '   Then add your API keys and restart');
    process.exit(1);
  }
  
  // Load environment variables
  require('dotenv').config({ path: envPath });
  
  // Check critical variables
  const criticalVars = [
    { name: 'SARVAM_API_KEY', description: 'Sarvam AI API key' },
    { name: 'JWT_SECRET', description: 'JWT signing secret' }
  ];
  
  let hasErrors = false;
  
  criticalVars.forEach(({ name, description }) => {
    const value = process.env[name];
    if (!value || (name === 'JWT_SECRET' && value === 'your-super-secret-jwt-key-change-this')) {
      log('red', `❌ ${name}: Missing or using default value`);
      log('yellow', `   Description: ${description}`);
      hasErrors = true;
    } else {
      log('green', `✅ ${name}: Configured`);
    }
  });
  
  if (hasErrors) {
    log('red', '\n🚨 Environment configuration errors found!');
    log('yellow', '\n📖 Setup instructions:');
    log('yellow', '   1. Edit .env file with your actual values');
    log('yellow', '   2. Get Sarvam AI key: https://www.sarvam.ai/');
    log('yellow', '   3. Generate JWT secret: openssl rand -base64 64');
    log('yellow', '   4. Restart the server');
    process.exit(1);
  }
  
  log('green', '✅ Environment configuration valid');
}

function checkDependencies() {
  log('blue', '📦 Checking dependencies...');
  
  const packagePath = path.join(__dirname, '../package.json');
  const nodeModulesPath = path.join(__dirname, '../node_modules');
  
  if (!fs.existsSync(nodeModulesPath)) {
    log('red', '❌ Dependencies not installed!');
    log('yellow', '💡 Run: npm install');
    process.exit(1);
  }
  
  log('green', '✅ Dependencies installed');
}

async function startServer() {
  try {
    displayBanner();
    checkEnvironment();
    checkDependencies();
    
    log('blue', '🚀 Starting AI Debate Coach server...\n');
    
    // Import and start the main application
    const { app, server } = require('../src/app');
    
    // The app.js file handles the actual server startup
    // This script just validates environment and dependencies
    
  } catch (error) {
    log('red', '❌ Failed to start server:');
    console.error(error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  log('red', '❌ Uncaught Exception:');
  console.error(error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log('red', '❌ Unhandled Rejection:');
  console.error('Reason:', reason);
  process.exit(1);
});

// Start the server
startServer();