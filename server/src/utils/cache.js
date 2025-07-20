const NodeCache = require('node-cache');
const redis = require('./redis');
const logger = require('./logger');

class CacheService {
  constructor() {
    // In-memory cache as fallback
    this.memoryCache = new NodeCache({
      stdTTL: 600, // 10 minutes default
      checkperiod: 120 // Check for expired keys every 2 minutes
    });
  }

  // Get from cache
  async get(key) {
    try {
      // Try Redis first
      if (redis.isConnected()) {
        const value = await redis.get(key);
        if (value) {
          return JSON.parse(value);
        }
      }
      
      // Fallback to memory cache
      return this.memoryCache.get(key);
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  // Set cache value
  async set(key, value, ttl = 600) {
    try {
      const stringValue = JSON.stringify(value);
      
      // Set in Redis if available
      if (redis.isConnected()) {
        await redis.setex(key, ttl, stringValue);
      }
      
      // Also set in memory cache
      this.memoryCache.set(key, value, ttl);
      
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  }

  // Delete from cache
  async del(key) {
    try {
      if (redis.isConnected()) {
        await redis.del(key);
      }
      
      this.memoryCache.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  }

  // Clear all cache
  async flush() {
    try {
      if (redis.isConnected()) {
        await redis.flushdb();
      }
      
      this.memoryCache.flushAll();
      logger.info('Cache flushed');
      return true;
    } catch (error) {
      logger.error('Cache flush error:', error);
      return false;
    }
  }

  // Cache middleware for Express routes
  middleware(keyGenerator, ttl = 600) {
    return async (req, res, next) => {
      const key = typeof keyGenerator === 'function' 
        ? keyGenerator(req) 
        : `${req.originalUrl}`;
      
      const cached = await this.get(key);
      
      if (cached) {
        logger.info(`Cache hit: ${key}`);
        return res.json(cached);
      }
      
      // Store original json method
      const originalJson = res.json;
      
      // Override json method to cache response
      res.json = (body) => {
        // Cache successful responses only
        if (res.statusCode >= 200 && res.statusCode < 300) {
          this.set(key, body, ttl);
        }
        
        // Call original json method
        return originalJson.call(res, body);
      };
      
      next();
    };
  }
}

module.exports = new CacheService();
