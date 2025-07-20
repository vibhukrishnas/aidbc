// Leaderboard service for managing rankings and competitions
const User = require('../models/User');
const Debate = require('../models/Debate');

class LeaderboardService {
  constructor() {
    this.timeframes = {
      daily: 24 * 60 * 60 * 1000,
      weekly: 7 * 24 * 60 * 60 * 1000,
      monthly: 30 * 24 * 60 * 60 * 1000,
      allTime: null
    };
  }

  // Get leaderboard for specified timeframe
  async getLeaderboard(timeframe = 'weekly', limit = 50, category = 'overall') {
    try {
      const timeWindow = this.getTimeWindow(timeframe);
      
      switch (category) {
        case 'overall':
          return await this.getOverallLeaderboard(timeWindow, limit);
        case 'debates':
          return await this.getDebateCountLeaderboard(timeWindow, limit);
        case 'scores':
          return await this.getHighScoreLeaderboard(timeWindow, limit);
        case 'streaks':
          return await this.getStreakLeaderboard(limit);
        case 'newcomers':
          return await this.getNewcomerLeaderboard(timeWindow, limit);
        default:
          return await this.getOverallLeaderboard(timeWindow, limit);
      }
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      throw error;
    }
  }

  // Get overall leaderboard based on XP
  async getOverallLeaderboard(timeWindow, limit) {
    const query = { isActive: true };
    
    if (timeWindow) {
      query.lastActiveAt = { $gte: new Date(Date.now() - timeWindow) };
    }
    
    const users = await User.find(query)
      .sort({ totalXP: -1, level: -1 })
      .limit(limit)
      .select('username avatar level totalXP currentStreak achievements')
      .populate('achievements', 'name icon category');
    
    return users.map((user, index) => ({
      rank: index + 1,
      user: {
        id: user._id,
        username: user.username,
        avatar: user.avatar,
        level: user.level
      },
      score: user.totalXP,
      streak: user.currentStreak,
      badges: user.achievements.filter(a => a.category === 'badge').length,
      trend: 'stable' // Could be calculated based on recent activity
    }));
  }

  // Get debate count leaderboard
  async getDebateCountLeaderboard(timeWindow, limit) {
    const matchStage = { isActive: true };
    
    if (timeWindow) {
      // Get users who had debates in the timeframe
      const recentDebates = await Debate.find({
        createdAt: { $gte: new Date(Date.now() - timeWindow) }
      }).distinct('user');
      
      matchStage._id = { $in: recentDebates };
    }
    
    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'debates',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$user', '$$userId'] },
                ...(timeWindow && {
                  createdAt: { $gte: new Date(Date.now() - timeWindow) }
                })
              }
            }
          ],
          as: 'debates'
        }
      },
      {
        $addFields: {
          debateCount: { $size: '$debates' },
          avgScore: { $avg: '$debates.feedback.overallScore' }
        }
      },
      { $match: { debateCount: { $gt: 0 } } },
      { $sort: { debateCount: -1, avgScore: -1 } },
      { $limit: limit },
      {
        $project: {
          username: 1,
          avatar: 1,
          level: 1,
          debateCount: 1,
          avgScore: 1,
          currentStreak: 1
        }
      }
    ];
    
    const results = await User.aggregate(pipeline);
    
    return results.map((user, index) => ({
      rank: index + 1,
      user: {
        id: user._id,
        username: user.username,
        avatar: user.avatar,
        level: user.level
      },
      score: user.debateCount,
      avgScore: Math.round(user.avgScore || 0),
      streak: user.currentStreak,
      trend: 'stable'
    }));
  }

  // Get high score leaderboard
  async getHighScoreLeaderboard(timeWindow, limit) {
    const pipeline = [
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'debates',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$user', '$$userId'] },
                ...(timeWindow && {
                  createdAt: { $gte: new Date(Date.now() - timeWindow) }
                })
              }
            },
            { $sort: { 'feedback.overallScore': -1 } },
            { $limit: 1 }
          ],
          as: 'bestDebate'
        }
      },
      { $match: { 'bestDebate.0': { $exists: true } } },
      {
        $addFields: {
          highestScore: { $arrayElemAt: ['$bestDebate.feedback.overallScore', 0] },
          bestDebateId: { $arrayElemAt: ['$bestDebate._id', 0] }
        }
      },
      { $sort: { highestScore: -1, totalXP: -1 } },
      { $limit: limit }
    ];
    
    const results = await User.aggregate(pipeline);
    
    return results.map((user, index) => ({
      rank: index + 1,
      user: {
        id: user._id,
        username: user.username,
        avatar: user.avatar,
        level: user.level
      },
      score: Math.round(user.highestScore),
      bestDebateId: user.bestDebateId,
      totalDebates: user.totalDebates,
      trend: 'stable'
    }));
  }

  // Get streak leaderboard
  async getStreakLeaderboard(limit) {
    const users = await User.find({ 
      isActive: true,
      currentStreak: { $gt: 0 }
    })
    .sort({ currentStreak: -1, longestStreak: -1 })
    .limit(limit)
    .select('username avatar level currentStreak longestStreak totalDebates');
    
    return users.map((user, index) => ({
      rank: index + 1,
      user: {
        id: user._id,
        username: user.username,
        avatar: user.avatar,
        level: user.level
      },
      score: user.currentStreak,
      longestStreak: user.longestStreak,
      totalDebates: user.totalDebates,
      trend: 'stable'
    }));
  }

  // Get newcomer leaderboard (recent joiners with good performance)
  async getNewcomerLeaderboard(timeWindow = 30 * 24 * 60 * 60 * 1000, limit) {
    const cutoffDate = new Date(Date.now() - timeWindow);
    
    const pipeline = [
      {
        $match: {
          isActive: true,
          createdAt: { $gte: cutoffDate },
          totalDebates: { $gte: 3 } // Minimum debates to qualify
        }
      },
      { $sort: { averageScore: -1, totalXP: -1 } },
      { $limit: limit }
    ];
    
    const users = await User.aggregate(pipeline);
    
    return users.map((user, index) => ({
      rank: index + 1,
      user: {
        id: user._id,
        username: user.username,
        avatar: user.avatar,
        level: user.level
      },
      score: Math.round(user.averageScore),
      totalDebates: user.totalDebates,
      joinDate: user.createdAt,
      trend: 'rising'
    }));
  }

  // Get user's rank in specific leaderboard
  async getUserRank(userId, timeframe = 'weekly', category = 'overall') {
    try {
      const timeWindow = this.getTimeWindow(timeframe);
      const user = await User.findById(userId);
      
      if (!user) {
        return { rank: null, total: 0 };
      }
      
      let higherRankedCount = 0;
      let totalUsers = 0;
      
      switch (category) {
        case 'overall':
          higherRankedCount = await User.countDocuments({
            isActive: true,
            totalXP: { $gt: user.totalXP },
            ...(timeWindow && { lastActiveAt: { $gte: new Date(Date.now() - timeWindow) } })
          });
          totalUsers = await User.countDocuments({
            isActive: true,
            ...(timeWindow && { lastActiveAt: { $gte: new Date(Date.now() - timeWindow) } })
          });
          break;
          
        case 'streaks':
          higherRankedCount = await User.countDocuments({
            isActive: true,
            currentStreak: { $gt: user.currentStreak }
          });
          totalUsers = await User.countDocuments({
            isActive: true,
            currentStreak: { $gt: 0 }
          });
          break;
          
        default:
          // Fallback to overall ranking
          return await this.getUserRank(userId, timeframe, 'overall');
      }
      
      return {
        rank: higherRankedCount + 1,
        total: totalUsers,
        percentile: totalUsers > 0 ? Math.round(((totalUsers - higherRankedCount) / totalUsers) * 100) : 0
      };
    } catch (error) {
      console.error('Error getting user rank:', error);
      return { rank: null, total: 0, percentile: 0 };
    }
  }

  // Get seasonal competitions
  async getSeasonalCompetitions() {
    // This could be expanded to include seasonal events, tournaments, etc.
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return {
      monthly: {
        name: `${now.toLocaleString('default', { month: 'long' })} Challenge`,
        startDate: monthStart,
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0),
        prize: 'Monthly Champion Badge',
        participants: await User.countDocuments({
          isActive: true,
          lastActiveAt: { $gte: monthStart }
        })
      }
    };
  }

  // Get leaderboard trends (who's moving up/down)
  async getLeaderboardTrends(timeframe = 'weekly', limit = 20) {
    // This would require storing historical leaderboard data
    // For now, return a simple structure
    const currentLeaderboard = await this.getLeaderboard(timeframe, limit);
    
    return currentLeaderboard.map(entry => ({
      ...entry,
      trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.3 ? 'down' : 'stable',
      change: Math.floor(Math.random() * 5) // Placeholder
    }));
  }

  // Helper method to get time window in milliseconds
  getTimeWindow(timeframe) {
    return this.timeframes[timeframe] || this.timeframes.weekly;
  }

  // Create custom competition
  async createCompetition(name, duration, criteria, prizes) {
    // This would create a new competition in the database
    // Implementation depends on Competition model structure
    return {
      id: 'comp_' + Date.now(),
      name,
      duration,
      criteria,
      prizes,
      startDate: new Date(),
      endDate: new Date(Date.now() + duration),
      participants: []
    };
  }
}

module.exports = new LeaderboardService();
