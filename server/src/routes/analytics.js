const express = require('express');
const User = require('../models/User');
const Topic = require('../models/Topic');
const Debate = require('../models/Debate');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/analytics/platform
 * @desc    Get platform-wide analytics
 * @access  Private (Admin)
 */
router.get('/platform', authenticate, requireAdmin, async (req, res, next) => {
  try {
    // Get basic counts
    const totalUsers = await User.countDocuments({ isActive: true });
    const totalTopics = await Topic.countDocuments({ status: 'approved', isActive: true });
    const totalDebates = await Debate.countDocuments({ status: 'completed' });
    
    // Get active users (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const activeUsers = await User.countDocuments({
      lastActiveAt: { $gte: weekAgo },
      isActive: true
    });

    // Get average score
    const avgScoreResult = await Debate.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, avgScore: { $avg: '$overallScore' } } }
    ]);
    const avgScore = avgScoreResult[0]?.avgScore || 0;

    // Get language distribution
    const languageStats = await Debate.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$language', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get category popularity
    const categoryStats = await Topic.aggregate([
      { $match: { status: 'approved', isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 }, totalDebates: { $sum: '$stats.totalDebates' } } },
      { $sort: { totalDebates: -1 } }
    ]);

    const analytics = {
      overview: {
        totalUsers,
        activeUsers,
        totalTopics,
        totalDebates,
        avgScore: Math.round(avgScore * 100) / 100
      },
      languages: languageStats,
      categories: categoryStats,
      generatedAt: new Date()
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/analytics/user/:id
 * @desc    Get user-specific analytics
 * @access  Private
 */
router.get('/user/:id', authenticate, async (req, res, next) => {
  try {
    // Check if user can access this data (own data or admin)
    if (req.params.id !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const analytics = await Debate.getUserAnalytics(req.params.id);
    
    res.json({
      success: true,
      data: { analytics: analytics[0] || {} }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;