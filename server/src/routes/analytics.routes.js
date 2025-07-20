const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { validationRules, validate } = require('../middleware/validation');
const { generalLimiter } = require('../middleware/rateLimit');
const { authenticate, adminOnly } = require('../middleware/auth');

// Apply authentication and rate limiting
router.use(authenticate);
router.use(generalLimiter);

// Track user event
router.post('/track',
  async (req, res, next) => {
    try {
      const { eventType, eventData = {} } = req.body;
      
      if (!eventType) {
        return res.status(400).json({
          success: false,
          error: 'Event type is required'
        });
      }
      
      const Analytics = require('../models/Analytics');
      
      // Extract request metadata
      const userAgent = req.get('User-Agent') || '';
      const deviceType = getDeviceType(userAgent);
      const browser = getBrowser(userAgent);
      const os = getOS(userAgent);
      
      await Analytics.create({
        user: req.user.id,
        eventType,
        eventData,
        userAgent,
        ipAddress: req.ip,
        referer: req.get('Referer'),
        deviceType,
        browser,
        os,
        sessionId: req.sessionID || `session_${Date.now()}`
      });
      
      res.json({
        success: true,
        message: 'Event tracked successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get user analytics
router.get('/user/:userId?',
  validate([
    ...validationRules.dateRange,
    ...validationRules.pagination
  ]),
  analyticsController.getUserAnalytics
);

// Get dashboard data for current user
router.get('/dashboard',
  async (req, res, next) => {
    try {
      const { timeframe = '30d' } = req.query;
      const userId = req.user.id;
      
      let startDate;
      switch (timeframe) {
        case '7d':
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      }
      
      const Analytics = require('../models/Analytics');
      const Debate = require('../models/Debate');
      
      // Activity overview
      const activityData = await Analytics.aggregate([
        {
          $match: {
            user: req.user._id,
            timestamp: { $gte: startDate }
          }
        },
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
      
      // Debate performance over time
      const debatePerformance = await Debate.aggregate([
        {
          $match: {
            user: req.user._id,
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            avgScore: { $avg: '$feedback.overallScore' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);
      
      // Skill trends
      const skillTrends = await Debate.aggregate([
        {
          $match: {
            user: req.user._id,
            createdAt: { $gte: startDate }
          }
        },
        { $sort: { createdAt: 1 } },
        {
          $project: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            'feedback.scores.argumentation': 1,
            'feedback.scores.delivery': 1,
            'feedback.scores.rebuttal': 1,
            'feedback.scores.structure': 1
          }
        }
      ]);
      
      // Most active times
      const activeHours = await Analytics.aggregate([
        {
          $match: {
            user: req.user._id,
            timestamp: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: { $hour: '$timestamp' },
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]);
      
      // Device usage
      const deviceStats = await Analytics.aggregate([
        {
          $match: {
            user: req.user._id,
            timestamp: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$deviceType',
            count: { $sum: 1 }
          }
        }
      ]);
      
      res.json({
        success: true,
        data: {
          timeframe,
          activity: {
            overview: activityData,
            totalEvents: activityData.reduce((sum, item) => sum + item.count, 0)
          },
          debates: {
            performance: debatePerformance,
            skillTrends,
            totalDebates: debatePerformance.reduce((sum, item) => sum + item.count, 0)
          },
          patterns: {
            activeHours: activeHours.slice(0, 5),
            devices: deviceStats
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get platform analytics (admin only)
router.get('/platform',
  adminOnly,
  validate([
    ...validationRules.dateRange,
    ...validationRules.pagination
  ]),
  analyticsController.getPlatformAnalytics
);

// Export user data
router.get('/export',
  analyticsController.exportUserData
);

// Get popular topics analytics
router.get('/topics/popular',
  async (req, res, next) => {
    try {
      const { timeframe = '30d' } = req.query;
      
      let startDate;
      switch (timeframe) {
        case '7d':
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      }
      
      const Debate = require('../models/Debate');
      const topicStats = await Debate.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $lookup: {
            from: 'topics',
            localField: 'topic',
            foreignField: '_id',
            as: 'topicInfo'
          }
        },
        { $unwind: '$topicInfo' },
        {
          $group: {
            _id: '$topic',
            title: { $first: '$topicInfo.title' },
            category: { $first: '$topicInfo.category' },
            debateCount: { $sum: 1 },
            avgScore: { $avg: '$feedback.overallScore' },
            totalViews: { $sum: '$viewCount' }
          }
        },
        { $sort: { debateCount: -1 } },
        { $limit: 20 }
      ]);
      
      res.json({
        success: true,
        data: {
          timeframe,
          topics: topicStats
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Helper functions
function getDeviceType(userAgent) {
  if (/mobile/i.test(userAgent)) return 'mobile';
  if (/tablet|ipad/i.test(userAgent)) return 'tablet';
  if (/desktop|windows|mac/i.test(userAgent)) return 'desktop';
  return 'unknown';
}

function getBrowser(userAgent) {
  if (/chrome/i.test(userAgent)) return 'Chrome';
  if (/firefox/i.test(userAgent)) return 'Firefox';
  if (/safari/i.test(userAgent)) return 'Safari';
  if (/edge/i.test(userAgent)) return 'Edge';
  return 'Unknown';
}

function getOS(userAgent) {
  if (/windows/i.test(userAgent)) return 'Windows';
  if (/mac/i.test(userAgent)) return 'macOS';
  if (/linux/i.test(userAgent)) return 'Linux';
  if (/android/i.test(userAgent)) return 'Android';
  if (/ios/i.test(userAgent)) return 'iOS';
  return 'Unknown';
}

module.exports = router;
