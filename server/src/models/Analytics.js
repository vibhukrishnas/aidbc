// Analytics model for tracking user behavior
const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  eventType: {
    type: String,
    required: true,
    enum: [
      'debate_started',
      'debate_completed',
      'debate_abandoned',
      'topic_viewed',
      'feedback_viewed',
      'achievement_unlocked',
      'power_up_purchased',
      'power_up_used',
      'daily_reward_claimed',
      'profile_updated',
      'settings_changed',
      'tutorial_started',
      'tutorial_completed',
      'search_performed',
      'filter_applied',
      'share_clicked',
      'social_follow',
      'mentor_request',
      'language_changed'
    ]
  },
  
  eventData: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  sessionId: {
    type: String,
    index: true
  },
  
  // Request metadata
  userAgent: String,
  ipAddress: String,
  referer: String,
  
  // Calculated fields
  duration: Number, // milliseconds
  
  // Context
  deviceType: {
    type: String,
    enum: ['mobile', 'tablet', 'desktop', 'unknown'],
    default: 'unknown'
  },
  
  browser: String,
  os: String,
  
  // A/B testing
  experiments: [{
    name: String,
    variant: String
  }]
}, {
  timestamps: true
});

// Indexes for performance
analyticsSchema.index({ user: 1, timestamp: -1 });
analyticsSchema.index({ eventType: 1, timestamp: -1 });
analyticsSchema.index({ sessionId: 1, timestamp: -1 });
analyticsSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 }); // 1 year TTL

// Static methods for common analytics queries
analyticsSchema.statics.getUserActivity = function(userId, startDate, endDate) {
  const match = { user: userId };
  if (startDate || endDate) {
    match.timestamp = {};
    if (startDate) match.timestamp.$gte = startDate;
    if (endDate) match.timestamp.$lte = endDate;
  }
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          eventType: '$eventType'
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.date': 1 } }
  ]);
};

analyticsSchema.statics.getEventCounts = function(eventType, startDate, endDate) {
  const match = { eventType };
  if (startDate || endDate) {
    match.timestamp = {};
    if (startDate) match.timestamp.$gte = startDate;
    if (endDate) match.timestamp.$lte = endDate;
  }
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

analyticsSchema.statics.getFunnelAnalysis = function(events, timeWindow = 24 * 60 * 60 * 1000) {
  // Analyze conversion funnel between events
  return this.aggregate([
    { $match: { eventType: { $in: events } } },
    { $sort: { user: 1, timestamp: 1 } },
    {
      $group: {
        _id: '$user',
        events: {
          $push: {
            type: '$eventType',
            timestamp: '$timestamp'
          }
        }
      }
    }
  ]);
};

const Analytics = mongoose.model('Analytics', analyticsSchema);

module.exports = Analytics;
