#!/bin/bash

echo '🏆 AI Debate Coach - Championship Setup'
echo '======================================='

# Check Node.js versioncho ' AI Debate Coach - Championship Setup'
ec# Sarvam AI setup instructions
echo '🤖 Sarvam AI Setup:'
echo '✅ API key already configured in .env file'
echo '🔗 Dashboard: https://www.sarvam.ai/'
echo ''

echo '✅ Setup complete! Next steps:'
echo '1. Start MongoDB service'
echo '2. Run: npm run dev:all'=================================='

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo ' Node.js is required but not installed.'
    echo 'Please install Node.js 18+ from https://nodejs.org/'
    exit 1
fi

NODE_VERSION=$(node -v | cut -d. -f1 | cut -dv -f2)
if [ $NODE_VERSION -lt 18 ]; then
    echo '❌ Node.js 18+ is required. Current version:' $(node -v)
    exit 1
fi

echo ' Node.js version:' $(node -v)

# Install root dependencies
echo ' Installing root dependencies...'
npm install --silent

# Install client dependencies
echo ' Setting up client...'
cd client
npm install --silent
cd ..

# Install server dependencies
echo ' Setting up server...'
cd server
npm install --silent
cd ..

# Install AI engine dependencies
echo ' Setting up AI engine...'
cd ai-engine
npm install --silent
cd ..

# Copy environment template
if [ ! -f .env ]; then
    echo ' Creating environment file...'
    cp .env.example .env
    echo ' Please edit .env file with your configuration'
fi

# Create uploads directory
mkdir -p uploads temp

# Database setup instructions
echo ''
echo ' Database Setup Required:'
echo '1. Install MongoDB: https://www.mongodb.com/try/download/community'
echo '2. Start MongoDB service'
echo '3. Update MONGODB_URI in .env file'
echo ''

# Sarvam AI setup instructions
echo ' Sarvam AI Setup Required:'
echo '1. Get API key from: https://www.sarvam.ai/'
echo '2. Add SARVAM_AI_API_KEY to .env file'
echo ''

echo ' Setup complete! Next steps:'
echo '1. Configure .env file with your API keys'
echo '2. Start MongoDB service'
echo '3. Run: npm run dev:all'
echo '4. Open: http://localhost:3000'
echo ''
echo ' For judges: See JUDGES_GUIDE.md for quick evaluation'
echo ' Documentation: docs/SETUP.md'
