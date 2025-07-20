const express = require('express');
const User = require('../models/User');
const Debate = require('../models/Debate');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/users/leaderboard
 * @desc    Get user leaderboard
 * @access  Public
 */
router.get('/leaderboard', async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    
    const leaderboard = await User.getLeaderboard(parseInt(limit));
    
    res.json({
      success: true,
      data: { leaderboard }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/users/profile/:id
 * @desc    Get public user profile
 * @access  Public
 */
router.get('/profile/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('username profile stats achievements createdAt')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get recent debates (public info only)
    const recentDebates = await Debate.find({
      user: req.params.id,
      status: 'completed'
    })
      .populate('topic', 'title category')
      .select('overallScore language createdAt')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.json({
      success: true,
      data: {
        user,
        recentDebates
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;