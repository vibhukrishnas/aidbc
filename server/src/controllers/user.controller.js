const User = require('../models/User');
const { validationResult } = require('express-validator');

class UserController {
  // Get user profile
  async getProfile(req, res, next) {
    try {
      const userId = req.params.userId || req.user.id;
      
      const user = await User.findById(userId)
        .select('-password')
        .populate('achievements')
        .populate({
          path: 'debateHistory',
          select: 'topic createdAt feedback.overallScore',
          populate: {
            path: 'topic',
            select: 'title category'
          },
          options: { limit: 10, sort: { createdAt: -1 } }
        });
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  // Update user profile
  async updateProfile(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const allowedUpdates = ['username', 'email', 'bio', 'avatar', 'preferences'];
      const updates = {};
      
      Object.keys(req.body).forEach(key => {
        if (allowedUpdates.includes(key)) {
          updates[key] = req.body[key];
        }
      });
      
      const user = await User.findByIdAndUpdate(
        req.user.id,
        updates,
        { new: true, runValidators: true }
      ).select('-password');
      
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  // Update user preferences
  async updatePreferences(req, res, next) {
    try {
      const { language, theme, notifications } = req.body;
      
      const user = await User.findByIdAndUpdate(
        req.user.id,
        {
          'preferences.language': language,
          'preferences.theme': theme,
          'preferences.notifications': notifications
        },
        { new: true }
      ).select('preferences');
      
      res.json({
        success: true,
        data: user.preferences
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user statistics
  async getUserStats(req, res, next) {
    try {
      const userId = req.params.userId || req.user.id;
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      // Calculate additional stats
      const stats = {
        basicInfo: {
          username: user.username,
          level: user.level,
          totalXP: user.totalXP,
          currentXP: user.xp,
          xpToNextLevel: calculateXPToNextLevel(user.level) - user.xp
        },
        debateStats: {
          totalDebates: user.totalDebates,
          averageScore: user.averageScore,
          highestScore: user.highestScore,
          currentStreak: user.currentStreak,
          longestStreak: user.longestStreak
        },
        achievements: {
          unlocked: user.achievements.length,
          total: 20, // Total available achievements
          recent: user.achievements.slice(-3)
        },
        activity: {
          joinDate: user.createdAt,
          lastActive: user.lastActiveAt,
          daysActive: calculateDaysActive(user.createdAt)
        }
      };
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete user account
  async deleteAccount(req, res, next) {
    try {
      const { password } = req.body;
      
      // Verify password
      const user = await User.findById(req.user.id);
      const isMatch = await user.comparePassword(password);
      
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: 'Incorrect password'
        });
      }
      
      // Soft delete
      user.isActive = false;
      user.deletedAt = new Date();
      await user.save();
      
      res.json({
        success: true,
        message: 'Account deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user's learning path
  async getLearningPath(req, res, next) {
    try {
      const user = await User.findById(req.user.id);
      
      // Generate personalized learning path based on performance
      const learningPath = {
        currentLevel: user.level,
        suggestedTopics: await getSuggestedTopics(user),
        skillsToImprove: await getSkillsToImprove(user),
        nextMilestones: getNextMilestones(user)
      };
      
      res.json({
        success: true,
        data: learningPath
      });
    } catch (error) {
      next(error);
    }
  }
}

// Helper functions
function calculateXPToNextLevel(level) {
  return level * 100;
}

function calculateDaysActive(joinDate) {
  const now = new Date();
  const join = new Date(joinDate);
  const diffTime = Math.abs(now - join);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

async function getSuggestedTopics(user) {
  const Topic = require('../models/Topic');
  
  // Get topics user hasn't debated yet
  const debatedTopicIds = user.debateHistory.map(d => d.topic);
  
  return Topic.find({
    _id: { $nin: debatedTopicIds }
  })
  .limit(5)
  .select('title description difficulty category');
}

async function getSkillsToImprove(user) {
  const Debate = require('../models/Debate');
  
  // Get last 5 debates
  const recentDebates = await Debate.find({ user: user._id })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('feedback.scores');
  
  // Find lowest scoring areas
  const skillAverages = {
    argumentation: 0,
    delivery: 0,
    rebuttal: 0,
    structure: 0
  };
  
  recentDebates.forEach(debate => {
    Object.keys(skillAverages).forEach(skill => {
      skillAverages[skill] += debate.feedback.scores[skill] || 0;
    });
  });
  
  // Convert to percentages and sort
  return Object.entries(skillAverages)
    .map(([skill, total]) => ({
      skill,
      average: recentDebates.length > 0 ? total / recentDebates.length : 0
    }))
    .sort((a, b) => a.average - b.average)
    .slice(0, 2);
}

function getNextMilestones(user) {
  const milestones = [];
  
  // Level milestone
  const nextLevelMilestone = Math.ceil(user.level / 5) * 5;
  milestones.push({
    type: 'level',
    target: nextLevelMilestone,
    current: user.level,
    reward: `Unlock ${nextLevelMilestone === 5 ? 'Silver' : nextLevelMilestone === 10 ? 'Gold' : 'Platinum'} Badge`
  });
  
  // Debates milestone
  const nextDebateMilestone = Math.ceil(user.totalDebates / 10) * 10;
  milestones.push({
    type: 'debates',
    target: nextDebateMilestone,
    current: user.totalDebates,
    reward: 'Veteran Debater Achievement'
  });
  
  // Streak milestone
  if (user.currentStreak < 7) {
    milestones.push({
      type: 'streak',
      target: 7,
      current: user.currentStreak,
      reward: 'Week Warrior Badge'
    });
  }
  
  return milestones;
}

module.exports = new UserController();
