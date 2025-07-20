#!/bin/bash

# AI Debate Coach - Quick Setup Script
# This script helps you get the project running quickly for hackathon demos

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log() {
    echo -e "${GREEN}[SETUP]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Banner
echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    AI Debate Coach                           ║"
echo "║                   Quick Setup Script                         ║"
echo "║                                                              ║"
echo "║  This script will help you set up the project quickly       ║"
echo "║  for hackathon demos and development.                        ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check prerequisites
log "Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    error "Node.js is not installed. Please install Node.js 14+ from https://nodejs.org/"
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 14 ]; then
    error "Node.js version must be 14 or higher. Current version: $(node --version)"
fi

log "✅ Node.js $(node --version) found"

# Check npm
if ! command -v npm &> /dev/null; then
    error "npm is not installed. Please install npm."
fi

log "✅ npm $(npm --version) found"

# Check if MongoDB is running (optional)
if command -v mongod &> /dev/null; then
    if pgrep -x "mongod" > /dev/null; then
        log "✅ MongoDB is running"
    else
        warn "MongoDB is installed but not running. You may need to start it manually."
        info "To start MongoDB: mongod (or brew services start mongodb-community on Mac)"
    fi
else
    warn "MongoDB not found locally. You can use MongoDB Atlas instead."
    info "Get MongoDB Atlas: https://www.mongodb.com/atlas"
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    log "Creating .env file from template..."
    cp .env.example .env
    log "✅ .env file created"
else
    log "✅ .env file already exists"
fi

# Check if critical environment variables are set
log "Checking environment variables..."

if ! grep -q "SARVAM_API_KEY=your_sarvam_api_key_here" .env; then
    log "✅ SARVAM_API_KEY appears to be configured"
else
    warn "SARVAM_API_KEY not configured"
    echo ""
    echo -e "${YELLOW}To get your Sarvam AI API key:${NC}"
    echo "1. Visit https://www.sarvam.ai/"
    echo "2. Sign up for a developer account"
    echo "3. Navigate to API Keys section"
    echo "4. Generate a new API key"
    echo "5. Replace 'your_sarvam_api_key_here' in .env file"
    echo ""
fi

if ! grep -q "JWT_SECRET=your-super-secret-jwt-key-change-this" .env; then
    log "✅ JWT_SECRET appears to be configured"
else
    warn "JWT_SECRET not configured"
    echo ""
    echo -e "${YELLOW}To generate a JWT secret:${NC}"
    echo "Option 1: openssl rand -base64 64"
    echo "Option 2: Use any random 32+ character string"
    echo "Replace 'your-super-secret-jwt-key-change-this' in .env file"
    echo ""
fi

# Install dependencies
log "Installing dependencies..."

if [ ! -d "node_modules" ]; then
    npm install
    log "✅ Dependencies installed"
else
    log "✅ Dependencies already installed"
fi

# Create necessary directories
log "Creating necessary directories..."
mkdir -p logs uploads temp
log "✅ Directories created"

# Generate JWT secret if not configured
if grep -q "JWT_SECRET=your-super-secret-jwt-key-change-this" .env; then
    log "Generating JWT secret..."
    JWT_SECRET=$(openssl rand -base64 64 2>/dev/null || node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
    sed -i.bak "s/JWT_SECRET=your-super-secret-jwt-key-change-this/JWT_SECRET=$JWT_SECRET/" .env
    rm -f .env.bak
    log "✅ JWT secret generated"
fi

# Check if we can connect to MongoDB
log "Testing MongoDB connection..."
if node -e "
const mongoose = require('mongoose');
const config = require('./server/src/config/environment');
mongoose.connect(config.MONGODB_URI, {useNewUrlParser: true, useUnifiedTopology: true})
  .then(() => {
    console.log('MongoDB connection successful');
    process.exit(0);
  })
  .catch((err) => {
    console.log('MongoDB connection failed:', err.message);
    process.exit(1);
  });
" 2>/dev/null; then
    log "✅ MongoDB connection successful"
else
    warn "MongoDB connection failed"
    echo ""
    echo -e "${YELLOW}MongoDB setup options:${NC}"
    echo "1. Local MongoDB: Install from https://www.mongodb.com/try/download/community"
    echo "2. MongoDB Atlas: Create free cluster at https://www.mongodb.com/atlas"
    echo "3. Update MONGODB_URI in .env file with your connection string"
    echo ""
fi

# Setup complete
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                     Setup Complete!                          ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${BLUE}Next steps:${NC}"
echo "1. Configure your API keys in .env file (if not done already)"
echo "2. Start the development server: npm run dev"
echo "3. Open http://localhost:3000 in your browser"
echo ""

echo -e "${BLUE}Quick commands:${NC}"
echo "• Start development: npm run dev"
echo "• Start production: npm start"
echo "• Run tests: npm test"
echo "• View logs: tail -f logs/app.log"
echo ""

echo -e "${BLUE}Useful URLs:${NC}"
echo "• Frontend: http://localhost:3000"
echo "• Backend API: http://localhost:3001"
echo "• Health Check: http://localhost:3001/health"
echo "• Admin Dashboard: http://localhost:3000/admin"
echo ""

echo -e "${YELLOW}Need help?${NC}"
echo "• Check README.md for detailed documentation"
echo "• View troubleshooting guide in docs/"
echo "• Open an issue on GitHub"
echo ""

log "Happy coding! 🚀"