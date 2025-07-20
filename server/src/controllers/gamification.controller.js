const User = require('../models/User');
const Achievement = require('../models/Achievement');
const Leaderboard = require('../services/leaderboard.service');

class GamificationController {
  // Get leaderboard
  async getLeaderboard(req, res, next) {
    try {
      const { timeframe = 'weekly', limit = 50 } = req.query;
      
      const leaderboardData = await Leaderboard.getLeaderboard(timeframe, limit);
      
      // Add current user's rank if not in top
      const userRank = await Leaderboard.getUserRank(req.user.id, timeframe);
      
      res.json({
        success: true,
        data: {
          timeframe,
          leaderboard: leaderboardData,
          currentUserRank: userRank
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get all achievements
  async getAchievements(req, res, next) {
    try {
      const achievements = await Achievement.find({ isActive: true })
        .sort({ order: 1 });
      
      const user = await User.findById(req.user.id)
        .select('achievements');
      
      const userAchievementIds = user.achievements.map(a => a.toString());
      
      const achievementsWithStatus = achievements.map(achievement => ({
        ...achievement.toObject(),
        unlocked: userAchievementIds.includes(achievement._id.toString()),
        progress: calculateAchievementProgress(achievement, user)
      }));
      
      res.json({
        success: true,
        data: achievementsWithStatus
      });
    } catch (error) {
      next(error);
    }
  }

  // Unlock achievement
  async unlockAchievement(req, res, next) {
    try {
      const { achievementId } = req.body;
      
      const achievement = await Achievement.findById(achievementId);
      if (!achievement) {
        return res.status(404).json({
          success: false,
          error: 'Achievement not found'
        });
      }
      
      const user = await User.findById(req.user.id);
      
      // Check if already unlocked
      if (user.achievements.includes(achievementId)) {
        return res.status(400).json({
          success: false,
          error: 'Achievement already unlocked'
        });
      }
      
      // Verify achievement conditions
      if (!checkAchievementConditions(achievement, user)) {
        return res.status(400).json({
          success: false,
          error: 'Achievement conditions not met'
        });
      }
      
      // Unlock achievement
      user.achievements.push(achievementId);
      user.totalXP += achievement.xpReward || 50;
      await user.save();
      
      // Emit achievement unlocked event
      const io = req.app.get('io');
      io.to(`user:${req.user.id}`).emit('achievement:unlocked', {
        achievement: achievement.toObject(),
        xpReward: achievement.xpReward
      });
      
      res.json({
        success: true,
        data: {
          achievement,
          xpReward: achievement.xpReward
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user badges
  async getUserBadges(req, res, next) {
    try {
      const userId = req.params.userId || req.user.id;
      
      const user = await User.findById(userId)
        .populate('achievements');
      
      const badges = user.achievements.filter(a => a.type === 'badge');
      
      res.json({
        success: true,
        data: badges
      });
    } catch (error) {
      next(error);
    }
  }

  // Purchase power-up
  async purchasePowerUp(req, res, next) {
    try {
      const { powerUpId } = req.body;
      
      const powerUp = getPowerUpById(powerUpId);
      if (!powerUp) {
        return res.status(404).json({
          success: false,
          error: 'Power-up not found'
        });
      }
      
      const user = await User.findById(req.user.id);
      
      // Check if user has enough coins
      if (user.coins < powerUp.cost) {
        return res.status(400).json({
          success: false,
          error: 'Insufficient coins'
        });
      }
      
      // Deduct coins and add power-up
      user.coins -= powerUp.cost;
      user.powerUps.push({
        id: powerUpId,
        expiresAt: new Date(Date.now() + powerUp.duration)
      });
      await user.save();
      
      res.json({
        success: true,
        data: {
          powerUp,
          remainingCoins: user.coins
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Daily rewards
  async claimDailyReward(req, res, next) {
    try {
      const user = await User.findById(req.user.id);
      
      // Check if already claimed today
      const lastClaim = user.lastDailyReward;
      const now = new Date();
      
      if (lastClaim && isSameDay(lastClaim, now)) {
        return res.status(400).json({
          success: false,
          error: 'Daily reward already claimed'
        });
      }
      
      // Calculate streak
      const isConsecutive = lastClaim && isYesterday(lastClaim, now);
      if (isConsecutive) {
        user.dailyStreak += 1;
      } else {
        user.dailyStreak = 1;
      }
      
      // Calculate reward based on streak
      const baseReward = 10;
      const streakBonus = Math.min(user.dailyStreak * 5, 50);
      const totalCoins = baseReward + streakBonus;
      
      user.coins += totalCoins;
      user.lastDailyReward = now;
      await user.save();
      
      res.json({
        success: true,
        data: {
          coinsEarned: totalCoins,
          currentStreak: user.dailyStreak,
          totalCoins: user.coins
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

// Helper functions
function calculateAchievementProgress(achievement, user) {
  switch (achievement.type) {
    case 'debates':
      return {
        current: user.totalDebates,
        target: achievement.requirement.count,
        percentage: Math.min(100, (user.totalDebates / achievement.requirement.count) * 100)
      };
    case 'level':
      return {
        current: user.level,
        target: achievement.requirement.level,
        percentage: Math.min(100, (user.level / achievement.requirement.level) * 100)
      };
    case 'streak':
      return {
        current: user.currentStreak,
        target: achievement.requirement.days,
        percentage: Math.min(100, (user.currentStreak / achievement.requirement.days) * 100)
      };
    default:
      return { current: 0, target: 1, percentage: 0 };
  }
}

function checkAchievementConditions(achievement, user) {
  switch (achievement.type) {
    case 'debates':
      return user.totalDebates >= achievement.requirement.count;
    case 'level':
      return user.level >= achievement.requirement.level;
    case 'score':
      return user.highestScore >= achievement.requirement.score;
    case 'streak':
      return user.currentStreak >= achievement.requirement.days;
    default:
      return false;
  }
}

function getPowerUpById(id) {
  const powerUps = {
    focus_mode: {
      id: 'focus_mode',
      name: 'Focus Mode',
      cost: 50,
      duration: 3600000, // 1 hour
      effect: { xpMultiplier: 2 }
    },
    confidence_boost: {
      id: 'confidence_boost',
      name: 'Confidence Boost',
      cost: 30,
      duration: 1800000, // 30 minutes
      effect: { scoreBonus: 0.1 }
    }
  };
  
  return powerUps[id];
}

function isSameDay(date1, date2) {
  return date1.toDateString() === date2.toDateString();
}

function isYesterday(date1, date2) {
  const yesterday = new Date(date2);
  yesterday.setDate(yesterday.getDate() - 1);
  return date1.toDateString() === yesterday.toDateString();
}

module.exports = new GamificationController();
