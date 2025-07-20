class StorageService {
  constructor() {
    this.prefix = 'debate_coach_';
  }

  // Generic storage methods
  set(key, value) {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Storage error:', error);
      return false;
    }
  }

  get(key) {
    try {
      const item = localStorage.getItem(this.prefix + key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Storage error:', error);
      return null;
    }
  }

  remove(key) {
    localStorage.removeItem(this.prefix + key);
  }

  clear() {
    Object.keys(localStorage)
      .filter(key => key.startsWith(this.prefix))
      .forEach(key => localStorage.removeItem(key));
  }

  // Auth specific
  setToken(token) {
    this.set('auth_token', token);
  }

  getToken() {
    return this.get('auth_token');
  }

  setUser(user) {
    this.set('user', user);
  }

  getUser() {
    return this.get('user');
  }

  clearAuth() {
    this.remove('auth_token');
    this.remove('user');
  }

  // Cache management
  setCache(key, data, ttl = 3600000) { // 1 hour default
    const cacheData = {
      data,
      timestamp: Date.now(),
      ttl
    };
    this.set(`cache_${key}`, cacheData);
  }

  getCache(key) {
    const cacheData = this.get(`cache_${key}`);
    if (!cacheData) return null;

    const isExpired = Date.now() - cacheData.timestamp > cacheData.ttl;
    if (isExpired) {
      this.remove(`cache_${key}`);
      return null;
    }

    return cacheData.data;
  }

  // Offline queue
  queueRequest(request) {
    const queue = this.get('offline_queue') || [];
    queue.push({
      ...request,
      timestamp: Date.now()
    });
    this.set('offline_queue', queue);
  }

  getOfflineQueue() {
    return this.get('offline_queue') || [];
  }

  clearOfflineQueue() {
    this.remove('offline_queue');
  }

  // User preferences
  setPreference(key, value) {
    const preferences = this.get('preferences') || {};
    preferences[key] = value;
    this.set('preferences', preferences);
  }

  getPreference(key) {
    const preferences = this.get('preferences') || {};
    return preferences[key];
  }
}

export const storage = new StorageService();
