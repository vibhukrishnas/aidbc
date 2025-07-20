# Debate Coach AI - Server

Backend API for the AI-powered debate coaching platform.

## 🚀 Features

- **Authentication & Authorization** - JWT-based user authentication
- **AI Integration** - Sarvam AI for debate analysis and feedback
- **Real-time Communication** - Socket.IO for live updates
- **Gamification** - XP, levels, achievements, and leaderboards
- **Analytics** - Comprehensive user and platform analytics
- **Multilingual Support** - Content in multiple languages
- **Rate Limiting** - API protection against abuse
- **Input Validation** - Secure data validation and sanitization

## 🛠️ Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database with Mongoose ODM
- **Socket.IO** - Real-time communication
- **JWT** - Authentication tokens
- **Sarvam AI** - AI-powered content analysis
- **bcryptjs** - Password hashing
- **Helmet** - Security headers

## 📦 Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start MongoDB:**
   ```bash
   # Using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   
   # Or install locally
   # https://docs.mongodb.com/manual/installation/
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | `development` |
| `PORT` | Server port | `3001` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/debate-coach-ai` |
| `JWT_SECRET` | JWT signing secret | Required |
| `SARVAM_API_KEY` | Sarvam AI API key | Required |
| `CLIENT_URL` | Frontend URL for CORS | `http://localhost:3000` |

### Required Setup

1. **Get Sarvam AI API Key:**
   - Visit [Sarvam AI](https://api.sarvam.ai)
   - Register and get your API key
   - Add it to your `.env` file

2. **MongoDB Setup:**
   - Install MongoDB locally or use MongoDB Atlas
   - Update `MONGODB_URI` in `.env`

## 📁 Project Structure

```
server/
├── src/
│   ├── config/          # Configuration files
│   │   ├── database.js  # Database connection
│   │   ├── environment.js # Environment variables
│   │   └── sarvam-ai.js # AI service config
│   ├── controllers/     # Route controllers
│   │   ├── auth.controller.js
│   │   ├── debate.controller.js
│   │   ├── gamification.controller.js
│   │   └── user.controller.js
│   ├── middleware/      # Express middleware
│   │   ├── auth.js      # Authentication
│   │   ├── validation.js # Input validation
│   │   ├── rateLimit.js # Rate limiting
│   │   └── errorHandler.js
│   ├── models/          # Database models
│   │   ├── User.js
│   │   ├── Debate.js
│   │   ├── Topic.js
│   │   └── Achievement.js
│   ├── routes/          # API routes
│   │   ├── auth.routes.js
│   │   ├── debate.routes.js
│   │   ├── user.routes.js
│   │   └── gamification.routes.js
│   ├── services/        # Business logic
│   │   ├── sarvamAI.service.js
│   │   ├── scoring.service.js
│   │   └── leaderboard.service.js
│   ├── utils/           # Utility functions
│   ├── app.js           # Express app setup
│   └── server.js        # Server entry point
├── tests/               # Test files
├── package.json
└── README.md
```

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh tokens

### Debates
- `GET /api/debate/topics` - Get available topics
- `POST /api/debate/start` - Start a new debate
- `POST /api/debate/:id/submit` - Submit debate response
- `GET /api/debate/:id/feedback` - Get AI feedback

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/stats` - Get user statistics

### Gamification
- `GET /api/gamification/leaderboard` - Get leaderboard
- `GET /api/gamification/achievements` - Get achievements
- `POST /api/gamification/claim-reward` - Claim daily reward

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 📝 Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run seed` - Seed database with sample data

## 🔒 Security Features

- **JWT Authentication** - Secure token-based auth
- **Rate Limiting** - Prevent API abuse
- **Input Validation** - Sanitize all inputs
- **CORS Protection** - Configured for specific origins
- **Helmet Security** - Security headers
- **MongoDB Sanitization** - Prevent NoSQL injection

## 🌍 Internationalization

The API supports multiple languages for topics and feedback:
- English (en)
- Hindi (hi)
- Tamil (ta)
- Telugu (te)
- Kannada (kn)
- Malayalam (ml)
- Bengali (bn)
- Gujarati (gu)
- Marathi (mr)
- Punjabi (pa)

## 📊 Monitoring & Logging

- **Winston** - Structured logging
- **Health Check** - `/health` endpoint
- **Error Tracking** - Centralized error handling

## 🚀 Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Configure production MongoDB URI
3. Set secure JWT secrets
4. Configure proper CORS origins

### Docker Deployment
```bash
# Build image
docker build -t debate-coach-api .

# Run container
docker run -p 3001:3001 --env-file .env debate-coach-api
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, please open an issue on GitHub or contact the development team.
