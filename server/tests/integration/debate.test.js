const request = require('supertest');
const { app } = require('../../src/app');
const User = require('../../src/models/User');
const Topic = require('../../src/models/Topic');
const { generateToken } = require('../../src/middleware/auth');

describe('Debate API', () => {
  let token;
  let userId;
  let topicId;
  
  beforeAll(async () => {
    // Create test user
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Test123!'
    });
    
    userId = user._id;
    token = generateToken(userId);
    
    // Create test topic
    const topic = await Topic.create({
      title: 'Test Topic',
      description: 'This is a test debate topic',
      category: 'Technology',
      difficulty: 'beginner'
    });
    
    topicId = topic._id;
  });
  
  afterAll(async () => {
    await User.deleteMany({});
    await Topic.deleteMany({});
  });
  
  describe('POST /api/debate/submit', () => {
    it('should submit a debate successfully', async () => {
      const response = await request(app)
        .post('/api/debate/submit')
        .set('Authorization', `Bearer ${token}`)
        .send({
          topicId: topicId,
          response: 'This is my debate response. I believe technology is important for education. It provides access to information and enables personalized learning.',
          language: 'en'
        });
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('feedback');
      expect(response.body.data).toHaveProperty('xpEarned');
    });
    
    it('should reject short responses', async () => {
      const response = await request(app)
        .post('/api/debate/submit')
        .set('Authorization', `Bearer ${token}`)
        .send({
          topicId: topicId,
          response: 'Too short',
          language: 'en'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/debate/submit')
        .send({
          topicId: topicId,
          response: 'This is a valid response but no auth token provided.',
          language: 'en'
        });
      
      expect(response.status).toBe(401);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/debate/submit')
        .set('Authorization', `Bearer ${token}`)
        .send({
          // Missing topicId and response
          language: 'en'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/debate/history', () => {
    it('should get user debate history', async () => {
      const response = await request(app)
        .get('/api/debate/history')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('debates');
      expect(Array.isArray(response.body.data.debates)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/debate/history?page=1&limit=5')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination.limit).toBe(5);
    });
  });

  describe('GET /api/topics', () => {
    it('should get available topics', async () => {
      const response = await request(app)
        .get('/api/topics');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('topics');
      expect(Array.isArray(response.body.data.topics)).toBe(true);
    });

    it('should filter by category', async () => {
      const response = await request(app)
        .get('/api/topics?category=Technology');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      if (response.body.data.topics.length > 0) {
        expect(response.body.data.topics[0].category).toBe('Technology');
      }
    });

    it('should filter by difficulty', async () => {
      const response = await request(app)
        .get('/api/topics?difficulty=beginner');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      if (response.body.data.topics.length > 0) {
        expect(response.body.data.topics[0].difficulty).toBe('beginner');
      }
    });
  });
});
