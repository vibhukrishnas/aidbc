const express = require('express');
const router = express.Router();
const gamificationController = require('../controllers/gamification.controller');
const { validationRules, validate } = require('../middleware/validation');
const { generalLimiter } = require('../middleware/rateLimit');
const { authenticate } = require('../middleware/auth');

// Apply authentication and rate limiting
router.use(authenticate);
router.use(generalLimiter);

// Get leaderboard
router.get('/leaderboard',
  validate(validationRules.pagination),
  gamificationController.getLeaderboard
);

// Get all achievements
router.get('/achievements',
  gamificationController.getAchievements
);

// Unlock achievement
router.post('/achievements/unlock',
  gamificationController.unlockAchievement
);

// Get user badges
router.get('/badges/:userId?',
  gamificationController.getUserBadges
);

// Purchase power-up
router.post('/power-ups/purchase',
  gamificationController.purchasePowerUp
);

// Get available power-ups
router.get('/power-ups',
  (req, res) => {
    const powerUps = [
      {
        id: 'focus_mode',
        name: 'Focus Mode',
        description: 'Double XP for the next hour',
        cost: 50,
        duration: 3600000, // 1 hour
        effect: { xpMultiplier: 2 },
        icon: '🎯'
      },
      {
        id: 'confidence_boost',
        name: 'Confidence Boost',
        description: '10% score bonus for 30 minutes',
        cost: 30,
        duration: 1800000, // 30 minutes
        effect: { scoreBonus: 0.1 },
        icon: '💪'
      },
      {
        id: 'time_extension',
        name: 'Time Extension',
        description: 'Extra 5 minutes for your next debate',
        cost: 20,
        duration: 0, // One-time use
        effect: { extraTime: 300 }, // 5 minutes
        icon: '⏰'
      },
      {
        id: 'hint_unlock',
        name: 'Hint Unlock',
        description: 'Get 3 helpful hints during debate',
        cost: 40,
        duration: 0, // One-time use
        effect: { hints: 3 },
        icon: '💡'
      }
    ];
    
    res.json({
      success: true,
      data: powerUps
    });
  }
);

// Claim daily reward
router.post('/daily-reward',
  gamificationController.claimDailyReward
);

// Get daily reward status
router.get('/daily-reward/status',
  async (req, res, next) => {
    try {
      const user = req.user;
      const now = new Date();
      const lastClaim = user.lastDailyReward;
      
      const canClaim = !lastClaim || !isSameDay(lastClaim, now);
      const streak = user.dailyStreak || 0;
      
      // Calculate next reward
      const baseReward = 10;
      const streakBonus = Math.min((streak + (canClaim ? 1 : 0)) * 5, 50);
      const nextReward = baseReward + streakBonus;
      
      res.json({
        success: true,
        data: {
          canClaim,
          currentStreak: streak,
          nextReward,
          lastClaimed: lastClaim
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get user's gamification overview
router.get('/overview',
  async (req, res, next) => {
    try {
      const user = await require('../models/User')
        .findById(req.user.id)
        .populate('achievements', 'name icon category');
      
      const activePowerUps = user.powerUps.filter(
        powerUp => powerUp.expiresAt > new Date()
      );
      
      const Debate = require('../models/Debate');
      const recentDebates = await Debate.find({ user: req.user.id })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('feedback.overallScore createdAt');
      
      // Calculate level progress
      const currentLevelXP = (user.level - 1) * 100;
      const nextLevelXP = user.level * 100;
      const levelProgress = Math.min(100, ((user.totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100);
      
      res.json({
        success: true,
        data: {
          level: user.level,
          xp: user.xp,
          totalXP: user.totalXP,
          levelProgress: Math.round(levelProgress),
          coins: user.coins,
          achievements: {
            unlocked: user.achievements.length,
            recent: user.achievements.slice(-3)
          },
          activePowerUps,
          streak: {
            current: user.currentStreak,
            longest: user.longestStreak,
            daily: user.dailyStreak
          },
          recentPerformance: recentDebates.map(debate => ({
            score: debate.feedback.overallScore,
            date: debate.createdAt
          }))
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get achievements progress
router.get('/achievements/progress',
  async (req, res, next) => {
    try {
      const Achievement = require('../models/Achievement');
      const achievements = await Achievement.find({ isActive: true });
      const user = req.user;
      
      const progressData = achievements.map(achievement => {
        const isUnlocked = user.achievements.some(
          userAchievement => userAchievement.toString() === achievement._id.toString()
        );
        
        let progress = 0;
        let current = 0;
        let target = 1;
        
        // Calculate progress based on achievement criteria
        switch (achievement.criteria.metric) {
          case 'totalDebates':
            current = user.totalDebates;
            target = achievement.criteria.threshold;
            progress = Math.min(100, (current / target) * 100);
            break;
          case 'currentStreak':
            current = user.currentStreak;
            target = achievement.criteria.threshold;
            progress = Math.min(100, (current / target) * 100);
            break;
          case 'level':
            current = user.level;
            target = achievement.criteria.threshold;
            progress = Math.min(100, (current / target) * 100);
            break;
          case 'averageScore':
            current = user.averageScore;
            target = achievement.criteria.threshold;
            progress = Math.min(100, (current / target) * 100);
            break;
        }
        
        return {
          id: achievement._id,
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          category: achievement.category,
          rarity: achievement.rarity,
          isUnlocked,
          progress: Math.round(progress),
          current,
          target,
          rewards: achievement.rewards
        };
      });
      
      // Group by category
      const categorized = progressData.reduce((acc, achievement) => {
        if (!acc[achievement.category]) {
          acc[achievement.category] = [];
        }
        acc[achievement.category].push(achievement);
        return acc;
      }, {});
      
      res.json({
        success: true,
        data: {
          achievements: progressData,
          categories: categorized,
          summary: {
            total: achievements.length,
            unlocked: progressData.filter(a => a.isUnlocked).length,
            inProgress: progressData.filter(a => !a.isUnlocked && a.progress > 0).length
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Helper function
function isSameDay(date1, date2) {
  return date1.toDateString() === date2.toDateString();
}

module.exports = router;
