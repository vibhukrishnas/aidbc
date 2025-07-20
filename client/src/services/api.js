import axios from 'axios';
import { storage } from './storage';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class ApiService {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Request interceptor
    this.client.interceptors.request.use(
      config => {
        const token = storage.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      error => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      response => response.data,
      error => {
        if (error.response?.status === 401) {
          // Handle unauthorized
          storage.clearAuth();
          window.location.href = '/login';
        }
        
        // Offline fallback
        if (!navigator.onLine) {
          return this.handleOfflineRequest(error.config);
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(credentials) {
    const response = await this.client.post('/auth/login', credentials);
    storage.setToken(response.token);
    storage.setUser(response.user);
    return response;
  }

  async register(userData) {
    const response = await this.client.post('/auth/register', userData);
    storage.setToken(response.token);
    storage.setUser(response.user);
    return response;
  }

  async logout() {
    storage.clearAuth();
    return true;
  }

  // Debate endpoints
  async getTopics(language = 'en') {
    return this.client.get(`/debate/topics/${language}`);
  }

  async submitDebate(debateData) {
    return this.client.post('/debate/submit', debateData);
  }

  async getDebateHistory(userId) {
    return this.client.get(`/debate/history/${userId || storage.getUser()?.id}`);
  }

  // User endpoints
  async getProfile(userId) {
    return this.client.get(`/users/profile/${userId || storage.getUser()?.id}`);
  }

  async updateProfile(userData) {
    return this.client.patch('/users/profile', userData);
  }

  // Gamification endpoints
  async getLeaderboard(timeframe = 'weekly') {
    return this.client.get(`/gamification/leaderboard?timeframe=${timeframe}`);
  }

  async getAchievements() {
    return this.client.get('/gamification/achievements');
  }

  // Analytics endpoints
  async trackEvent(eventData) {
    return this.client.post('/analytics/track', eventData);
  }

  async getStats(userId) {
    return this.client.get(`/analytics/stats/${userId || storage.getUser()?.id}`);
  }

  // Offline handling
  handleOfflineRequest(config) {
    // Return cached data for GET requests
    if (config.method === 'get') {
      const cachedData = storage.getCache(config.url);
      if (cachedData) {
        return Promise.resolve(cachedData);
      }
    }
    
    // Queue POST requests for later sync
    if (config.method === 'post') {
      storage.queueRequest(config);
      return Promise.resolve({
        offline: true,
        message: 'Request queued for sync when online'
      });
    }
    
    return Promise.reject(new Error('No internet connection'));
  }
}

export const api = new ApiService();
