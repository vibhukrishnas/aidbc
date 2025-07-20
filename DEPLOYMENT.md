# 🚀 Deployment Guide - AI Debate Coach

This guide covers multiple deployment scenarios for the AI Debate Coach platform.

## 📋 Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)
- MongoDB (local or cloud)
- Sarvam AI API key

## 🐳 Docker Deployment (Recommended)

### 1. Quick Start with Docker Compose

```bash
# Clone the repository
git clone <your-repo-url>
cd debate-coach-ai

# Create environment file
cp .env.example .env

# Edit .env with your configuration
nano .env

# Build and start all services
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

### 2. Environment Variables

Create `.env` file in the root directory:

```env
# Required
SARVAM_API_KEY=your_sarvam_ai_api_key
JWT_SECRET=your-super-secret-jwt-key-256-bits-long

# Optional
MONGODB_URI=mongodb://admin:password123@localhost:27017/debate-coach-ai?authSource=admin
CLIENT_URL=http://localhost:3000
LOG_LEVEL=info
```

### 3. Services Overview

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **MongoDB**: localhost:27017
- **Redis**: localhost:6379 (optional caching)

## 🌐 Cloud Deployment

### Vercel + MongoDB Atlas + Railway

#### 1. Frontend (Vercel)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
cd client
vercel --prod

# Set environment variables in Vercel dashboard
REACT_APP_API_URL=https://your-api-domain.com/api
REACT_APP_SOCKET_URL=https://your-api-domain.com
```

#### 2. Backend (Railway/Heroku)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy backend
cd server
railway login
railway init
railway up

# Or use Heroku
heroku create debate-coach-api
git push heroku main
```

#### 3. Database (MongoDB Atlas)
1. Create cluster at [MongoDB Atlas](https://cloud.mongodb.com/)
2. Get connection string
3. Update `MONGODB_URI` in your deployment environment

### Docker Cloud Deployment

#### 1. Build Images
```bash
# Build backend
docker build -t debate-coach-api ./server

# Build frontend
docker build -t debate-coach-client ./client

# Tag for registry
docker tag debate-coach-api your-registry/debate-coach-api:latest
docker tag debate-coach-client your-registry/debate-coach-client:latest

# Push to registry
docker push your-registry/debate-coach-api:latest
docker push your-registry/debate-coach-client:latest
```

#### 2. Kubernetes Deployment
```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: debate-coach-api
spec:
  replicas: 2
  selector:
    matchLabels:
      app: debate-coach-api
  template:
    metadata:
      labels:
        app: debate-coach-api
    spec:
      containers:
      - name: api
        image: your-registry/debate-coach-api:latest
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: mongodb-uri
```

## 🔧 Manual Deployment

### 1. Server Setup
```bash
# Install dependencies
cd server
npm install

# Run database migrations
npm run seed

# Start production server
npm start
```

### 2. Client Setup
```bash
# Install dependencies
cd client
npm install

# Build for production
npm run build

# Serve with nginx or serve
npx serve -s build -l 3000
```

## 📊 Production Checklist

### Security
- [ ] Set strong JWT secrets
- [ ] Configure CORS properly
- [ ] Set up HTTPS/SSL certificates
- [ ] Enable rate limiting
- [ ] Configure security headers

### Performance
- [ ] Set up CDN for static assets
- [ ] Configure database indexes
- [ ] Enable gzip compression
- [ ] Set up caching (Redis)
- [ ] Monitor application performance

### Monitoring
- [ ] Set up logging aggregation
- [ ] Configure health checks
- [ ] Set up uptime monitoring
- [ ] Configure error tracking
- [ ] Set up performance monitoring

### Backup & Recovery
- [ ] Configure automated database backups
- [ ] Set up disaster recovery plan
- [ ] Test backup restoration
- [ ] Configure monitoring alerts

## 🐛 Troubleshooting

### Common Issues

#### MongoDB Connection Failed
```bash
# Check if MongoDB is running
docker-compose ps mongodb

# View MongoDB logs
docker-compose logs mongodb

# Restart MongoDB
docker-compose restart mongodb
```

#### API Server Not Starting
```bash
# Check API logs
docker-compose logs api

# Common issues:
# - Missing environment variables
# - Database connection problems
# - Port conflicts
```

#### Frontend Build Issues
```bash
# Clear cache and rebuild
cd client
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Performance Issues

#### Slow API Response
- Check database query performance
- Verify Sarvam AI API response times
- Monitor server resource usage
- Consider adding caching

#### High Memory Usage
- Monitor Node.js memory usage
- Check for memory leaks
- Configure garbage collection
- Scale horizontally if needed

## 📈 Scaling

### Horizontal Scaling
```yaml
# docker-compose.scale.yml
version: '3.8'
services:
  api:
    scale: 3  # Run 3 API instances
  
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    # Load balance across API instances
```

### Database Scaling
- Use MongoDB replica sets
- Implement read replicas
- Consider sharding for large datasets
- Set up connection pooling

## 🔒 Security Hardening

### API Security
```javascript
// Additional security middleware
app.use(require('express-rate-limit')({
  windowMs: 15 * 60 * 1000,
  max: 100
}));

app.use(require('helmet')({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.sarvam.ai"]
    }
  }
}));
```

### Database Security
- Use connection strings with authentication
- Limit database user permissions
- Enable audit logging
- Regular security updates

## 📞 Support

For deployment issues:
1. Check the logs first
2. Consult this troubleshooting guide
3. Open an issue on GitHub
4. Contact the development team

## 🎯 Success Metrics

After deployment, monitor:
- Response times < 200ms
- Uptime > 99.9%
- Error rate < 0.1%
- User satisfaction scores
- Debate completion rates

---

**Happy Deploying! 🚀**
