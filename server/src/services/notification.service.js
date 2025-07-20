const logger = require('../utils/logger');

class NotificationService {
  constructor() {
    this.io = null;
  }

  // Initialize with Socket.IO instance
  initialize(io) {
    this.io = io;
  }

  // Send notification to specific user
  async notifyUser(userId, notification) {
    try {
      if (this.io) {
        this.io.to(`user:${userId}`).emit('notification', {
          id: Date.now(),
          ...notification,
          timestamp: new Date()
        });
      }

      // Also save to database for persistence
      await this.saveNotification(userId, notification);
      
      logger.info(`Notification sent to user ${userId}: ${notification.type}`);
    } catch (error) {
      logger.error('Error sending notification:', error);
    }
  }

  // Broadcast to all users
  async broadcast(notification) {
    try {
      if (this.io) {
        this.io.emit('broadcast', {
          id: Date.now(),
          ...notification,
          timestamp: new Date()
        });
      }
      
      logger.info(`Broadcast sent: ${notification.type}`);
    } catch (error) {
      logger.error('Error broadcasting:', error);
    }
  }

  // Send achievement notification
  async notifyAchievement(userId, achievement) {
    await this.notifyUser(userId, {
      type: 'achievement',
      title: 'Achievement Unlocked!',
      message: `You earned "${achievement.name}"`,
      icon: achievement.icon,
      data: achievement
    });
  }

  // Send level up notification
  async notifyLevelUp(userId, newLevel) {
    await this.notifyUser(userId, {
      type: 'levelup',
      title: 'Level Up!',
      message: `Congratulations! You reached level ${newLevel}`,
      icon: '🎉',
      data: { level: newLevel }
    });
  }

  // Send debate feedback ready notification
  async notifyFeedbackReady(userId, debateId) {
    await this.notifyUser(userId, {
      type: 'feedback',
      title: 'Feedback Ready',
      message: 'Your debate analysis is complete',
      icon: '📊',
      data: { debateId }
    });
  }

  // Send daily reminder
  async sendDailyReminder(userId) {
    await this.notifyUser(userId, {
      type: 'reminder',
      title: 'Daily Debate Challenge',
      message: 'Ready for today\'s debate practice?',
      icon: '🎯',
      action: {
        label: 'Start Debate',
        url: '/debate'
      }
    });
  }

  // Send streak reminder
  async sendStreakReminder(userId, currentStreak) {
    await this.notifyUser(userId, {
      type: 'streak',
      title: 'Keep Your Streak Alive!',
      message: `You're on a ${currentStreak}-day streak. Don't break it!`,
      icon: '🔥',
      action: {
        label: 'Continue Streak',
        url: '/debate'
      }
    });
  }

  // Save notification to database
  async saveNotification(userId, notification) {
    // In a real implementation, save to a notifications collection
    // For now, just log it
    logger.info(`Notification saved for user ${userId}`);
  }

  // Get user notifications
  async getUserNotifications(userId, limit = 20) {
    // In a real implementation, fetch from database
    return [];
  }

  // Mark notifications as read
  async markAsRead(userId, notificationIds) {
    // In a real implementation, update database
    logger.info(`Marked ${notificationIds.length} notifications as read for user ${userId}`);
  }
}

module.exports = new NotificationService();
