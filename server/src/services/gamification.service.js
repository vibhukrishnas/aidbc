const User = require('../models/User');
const Achievement = require('../models/Achievement');
const logger = require('../utils/logger');

class GamificationService {
  // Check and award achievements after debate
  async checkDebateAchievements(userId, debateData) {
    try {
      const user = await User.findById(userId);
      const newAchievements = [];

      // First debate achievement
      if (user.totalDebates === 1) {
        const firstDebate = await this.unlockAchievement(userId, 'first_debate');
        if (firstDebate) newAchievements.push(firstDebate);
      }

      // Score-based achievements
      if (debateData.feedback.overallScore >= 90) {
        const perfectScore = await this.unlockAchievement(userId, 'perfect_score');
        if (perfectScore) newAchievements.push(perfectScore);
      }

      // Language achievements
      if (debateData.language !== 'en' && user.languagesUsed.length >= 3) {
        const polyglot = await this.unlockAchievement(userId, 'polyglot');
        if (polyglot) newAchievements.push(polyglot);
      }

      // Streak achievements
      await this.updateStreak(userId);
      if (user.currentStreak === 7) {
        const weekStreak = await this.unlockAchievement(userId, 'streak_7');
        if (weekStreak) newAchievements.push(weekStreak);
      }

      return newAchievements;
    } catch (error) {
      logger.error('Error checking achievements:', error);
      return [];
    }
  }

  // Unlock specific achievement
  async unlockAchievement(userId, achievementId) {
    try {
      const user = await User.findById(userId);
      const achievement = await Achievement.findOne({ id: achievementId });

      if (!achievement || user.hasAchievement(achievement._id)) {
        return null;
      }

      // Add achievement to user
      user.achievements.push(achievement._id);
      user.totalXP += achievement.xpReward;
      user.coins += achievement.coinReward || 0;
      await user.save();

      // Record unlock
      achievement.unlockedBy.push({ user: userId });
      await achievement.save();

      logger.info(`Achievement unlocked: ${achievementId} for user ${userId}`);

      return achievement;
    } catch (error) {
      logger.error('Error unlocking achievement:', error);
      return null;
    }
  }

  // Update user streak
  async updateStreak(userId) {
    try {
      const user = await User.findById(userId);
      const lastDebate = user.lastActiveAt;
      const now = new Date();

      // Check if it's a new day
      if (!this.isSameDay(lastDebate, now)) {
        if (this.isConsecutiveDay(lastDebate, now)) {
          user.currentStreak += 1;
        } else {
          user.currentStreak = 1;
        }
      }

      await user.save();
      return user.currentStreak;
    } catch (error) {
      logger.error('Error updating streak:', error);
      return 0;
    }
  }

  // Calculate XP for level
  calculateXPForLevel(level) {
    return level * 100;
  }

  // Apply power-up effects
  applyPowerUpEffects(userId, debateScore) {
    // This would check active power-ups and modify scores accordingly
    // Implementation depends on specific power-up effects
    return debateScore;
  }

  // Helper methods
  isSameDay(date1, date2) {
    return date1.toDateString() === date2.toDateString();
  }

  isConsecutiveDay(date1, date2) {
    const day1 = new Date(date1);
    day1.setHours(0, 0, 0, 0);
    const day2 = new Date(date2);
    day2.setHours(0, 0, 0, 0);
    
    const diffTime = Math.abs(day2 - day1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays === 1;
  }
}

module.exports = new GamificationService();
