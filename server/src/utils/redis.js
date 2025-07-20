const Redis = require('ioredis');
const config = require('../config/environment');
const logger = require('./logger');

class RedisClient {
  constructor() {
    this.client = null;
    this.connected = false;
    
    if (config.REDIS_URL) {
      this.connect();
    }
  }

  connect() {
    try {
      this.client = new Redis(config.REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        }
      });

      this.client.on('connect', () => {
        this.connected = true;
        logger.info('Redis connected');
      });

      this.client.on('error', (err) => {
        this.connected = false;
        logger.error('Redis error:', err);
      });

      this.client.on('close', () => {
        this.connected = false;
        logger.info('Redis connection closed');
      });
    } catch (error) {
      logger.error('Failed to create Redis client:', error);
    }
  }

  isConnected() {
    return this.connected && this.client;
  }

  // Wrapper methods with error handling
  async get(key) {
    if (!this.isConnected()) return null;
    
    try {
      return await this.client.get(key);
    } catch (error) {
      logger.error('Redis get error:', error);
      return null;
    }
  }

  async set(key, value) {
    if (!this.isConnected()) return false;
    
    try {
      await this.client.set(key, value);
      return true;
    } catch (error) {
      logger.error('Redis set error:', error);
      return false;
    }
  }

  async setex(key, seconds, value) {
    if (!this.isConnected()) return false;
    
    try {
      await this.client.setex(key, seconds, value);
      return true;
    } catch (error) {
      logger.error('Redis setex error:', error);
      return false;
    }
  }

  async del(key) {
    if (!this.isConnected()) return false;
    
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error('Redis del error:', error);
      return false;
    }
  }

  async flushdb() {
    if (!this.isConnected()) return false;
    
    try {
      await this.client.flushdb();
      return true;
    } catch (error) {
      logger.error('Redis flushdb error:', error);
      return false;
    }
  }

  async quit() {
    if (this.client) {
      await this.client.quit();
      this.connected = false;
    }
  }
}

module.exports = new RedisClient();
