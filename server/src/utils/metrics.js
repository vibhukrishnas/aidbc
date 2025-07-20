const logger = require('./logger');

class MetricsCollector {
  constructor() {
    this.metrics = {
      requests: new Map(),
      debateScores: [],
      apiLatency: [],
      userActivity: new Map()
    };
    
    // Reset metrics periodically
    setInterval(() => this.resetMetrics(), 24 * 60 * 60 * 1000); // Daily
  }

  // Track API request
  trackRequest(endpoint, method, duration, statusCode) {
    const key = `${method}:${endpoint}`;
    
    if (!this.metrics.requests.has(key)) {
      this.metrics.requests.set(key, {
        count: 0,
        totalDuration: 0,
        errors: 0
      });
    }
    
    const metric = this.metrics.requests.get(key);
    metric.count++;
    metric.totalDuration += duration;
    
    if (statusCode >= 400) {
      metric.errors++;
    }
  }

  // Track debate score
  trackDebateScore(userId, score, category) {
    this.metrics.debateScores.push({
      userId,
      score,
      category,
      timestamp: new Date()
    });
  }

  // Track API latency
  trackAPILatency(service, duration) {
    this.metrics.apiLatency.push({
      service,
      duration,
      timestamp: new Date()
    });
  }

  // Track user activity
  trackUserActivity(userId, action) {
    const today = new Date().toDateString();
    const key = `${userId}:${today}`;
    
    if (!this.metrics.userActivity.has(key)) {
      this.metrics.userActivity.set(key, {
        actions: [],
        debateCount: 0
      });
    }
    
    const activity = this.metrics.userActivity.get(key);
    activity.actions.push({
      action,
      timestamp: new Date()
    });
    
    if (action === 'debate_completed') {
      activity.debateCount++;
    }
  }

  // Get metrics summary
  getSummary() {
    const requestSummary = {};
    
    this.metrics.requests.forEach((value, key) => {
      requestSummary[key] = {
        count: value.count,
        avgDuration: value.totalDuration / value.count,
        errorRate: (value.errors / value.count) * 100
      };
    });
    
    const avgDebateScore = this.metrics.debateScores.length > 0
      ? this.metrics.debateScores.reduce((sum, d) => sum + d.score, 0) / this.metrics.debateScores.length
      : 0;
    
    const avgAPILatency = this.metrics.apiLatency.length > 0
      ? this.metrics.apiLatency.reduce((sum, l) => sum + l.duration, 0) / this.metrics.apiLatency.length
      : 0;
    
    return {
      requests: requestSummary,
      avgDebateScore: Math.round(avgDebateScore),
      avgAPILatency: Math.round(avgAPILatency),
      activeUsers: this.metrics.userActivity.size,
      totalDebates: Array.from(this.metrics.userActivity.values())
        .reduce((sum, activity) => sum + activity.debateCount, 0)
    };
  }

  // Reset metrics
  resetMetrics() {
    logger.info('Resetting metrics');
    
    // Archive current metrics before resetting
    const summary = this.getSummary();
    logger.info('Daily metrics summary:', summary);
    
    // Reset
    this.metrics.requests.clear();
    this.metrics.debateScores = [];
    this.metrics.apiLatency = [];
    this.metrics.userActivity.clear();
  }

  // Express middleware for tracking requests
  middleware() {
    return (req, res, next) => {
      const start = Date.now();
      
      // Track response
      res.on('finish', () => {
        const duration = Date.now() - start;
        this.trackRequest(req.path, req.method, duration, res.statusCode);
      });
      
      next();
    };
  }
}

module.exports = new MetricsCollector();
