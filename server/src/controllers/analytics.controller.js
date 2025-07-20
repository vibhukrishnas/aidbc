const Analytics = require('../models/Analytics');
const Debate = require('../models/Debate');
const User = require('../models/User');

class AnalyticsController {
  // Track user events
  async trackEvent(req, res, next) {
    try {
      const { eventType, eventData } = req.body;
      const userId = req.user.id;
      
      await Analytics.create({
        user: userId,
        eventType,
        eventData,
        timestamp: new Date(),
        sessionId: req.sessionID
      });
      
      res.json({
        success: true,
        message: 'Event tracked successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user analytics
  async getUserAnalytics(req, res, next) {
    try {
      const userId = req.params.userId || req.user.id;
      const { startDate, endDate } = req.query;
      
      const query = { user: userId };
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }
      
      // Debate analytics
      const debateStats = await Debate.aggregate([
        { $match: query },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
            },
            count: { $sum: 1 },
            avgScore: { $avg: '$feedback.overallScore' },
            totalDuration: { $sum: '$duration' }
          }
        },
        { $sort: { '_id.date': 1 } }
      ]);
      
      // Skill progression
      const skillProgression = await Debate.aggregate([
        { $match: query },
        { $sort: { createdAt: 1 } },
        {
          $group: {
            _id: null,
            argumentation: { $push: '$feedback.scores.argumentation' },
            delivery: { $push: '$feedback.scores.delivery' },
            rebuttal: { $push: '$feedback.scores.rebuttal' },
            structure: { $push: '$feedback.scores.structure' }
          }
        }
      ]);
      
      // Language usage
      const languageStats = await Debate.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$language',
            count: { $sum: 1 },
            avgScore: { $avg: '$feedback.overallScore' }
          }
        }
      ]);
      
      res.json({
        success: true,
        data: {
          debateStats,
          skillProgression: skillProgression[0] || {},
          languageStats,
          summary: await generateSummary(userId)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get platform-wide analytics (admin only)
  async getPlatformAnalytics(req, res, next) {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
      }
      
      const now = new Date();
      const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
      
      // Active users
      const activeUsers = await User.countDocuments({
        lastActiveAt: { $gte: thirtyDaysAgo }
      });
      
      // Total debates
      const totalDebates = await Debate.countDocuments();
      const recentDebates = await Debate.countDocuments({
        createdAt: { $gte: thirtyDaysAgo }
      });
      
      // Language distribution
      const languageDistribution = await Debate.aggregate([
        {
          $group: {
            _id: '$language',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]);
      
      // Topic popularity
      const topicPopularity = await Debate.aggregate([
        {
          $group: {
            _id: '$topic',
            count: { $sum: 1 },
            avgScore: { $avg: '$feedback.overallScore' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'topics',
            localField: '_id',
            foreignField: '_id',
            as: 'topicInfo'
          }
        },
        { $unwind: '$topicInfo' }
      ]);
      
      // User growth
      const userGrowth = await User.aggregate([
        {
          $group: {
            _id: {
              month: { $month: '$createdAt' },
              year: { $year: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]);
      
      res.json({
        success: true,
        data: {
          overview: {
            totalUsers: await User.countDocuments(),
            activeUsers,
            totalDebates,
            recentDebates
          },
          languageDistribution,
          topicPopularity,
          userGrowth
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Export user data (GDPR compliance)
  async exportUserData(req, res, next) {
    try {
      const userId = req.user.id;
      
      const userData = {
        profile: await User.findById(userId).select('-password'),
        debates: await Debate.find({ user: userId }),
        analytics: await Analytics.find({ user: userId }),
        exportDate: new Date()
      };
      
      res.json({
        success: true,
        data: userData
      });
    } catch (error) {
      next(error);
    }
  }
}

// Helper function
async function generateSummary(userId) {
  const user = await User.findById(userId);
  const totalDebates = await Debate.countDocuments({ user: userId });
  const lastWeekDebates = await Debate.countDocuments({
    user: userId,
    createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
  });
  
  return {
    totalDebates,
    lastWeekDebates,
    averageScore: user.averageScore,
    level: user.level,
    streak: user.currentStreak,
    preferredLanguage: user.preferences.language
  };
}

module.exports = new AnalyticsController();
