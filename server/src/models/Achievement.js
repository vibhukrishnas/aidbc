// Achievement model
const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['debate', 'social', 'learning', 'milestone', 'special'],
    required: true
  },
  criteria: {
    type: {
      type: String,
      enum: ['count', 'score', 'streak', 'time', 'custom'],
      required: true
    },
    metric: {
      type: String,
      required: true // e.g., 'totalDebates', 'averageScore', 'currentStreak'
    },
    threshold: {
      type: Number,
      required: true
    },
    operator: {
      type: String,
      enum: ['gte', 'lte', 'eq'],
      default: 'gte'
    }
  },
  rewards: {
    xp: {
      type: Number,
      default: 0
    },
    badge: String,
    title: String,
    specialPrivileges: [String]
  },
  rarity: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  isHidden: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  unlockedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    unlockedAt: {
      type: Date,
      default: Date.now
    }
  }],
  totalUnlocks: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Virtual to calculate rarity percentage
achievementSchema.virtual('rarityPercentage').get(function() {
  const totalUsers = 1000; // This should be fetched from User model
  return this.totalUnlocks > 0 ? (this.totalUnlocks / totalUsers) * 100 : 0;
});

// Method to check if user qualifies for achievement
achievementSchema.methods.checkQualification = function(userStats) {
  const { metric, threshold, operator } = this.criteria;
  const userValue = userStats[metric];
  
  if (userValue === undefined) return false;
  
  switch (operator) {
    case 'gte':
      return userValue >= threshold;
    case 'lte':
      return userValue <= threshold;
    case 'eq':
      return userValue === threshold;
    default:
      return false;
  }
};

// Static method to get achievements for user
achievementSchema.statics.getAchievementsForUser = async function(userId) {
  const User = require('./User');
  const user = await User.findById(userId);
  
  if (!user) return [];
  
  const userStats = {
    totalDebates: user.totalDebates,
    averageScore: user.averageScore,
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    level: user.level,
    totalXP: user.totalXP
  };
  
  const allAchievements = await this.find({ isActive: true });
  const qualifiedAchievements = [];
  
  for (const achievement of allAchievements) {
    if (achievement.checkQualification(userStats) && 
        !user.achievements.includes(achievement._id)) {
      qualifiedAchievements.push(achievement);
    }
  }
  
  return qualifiedAchievements;
};

// Pre-save middleware to update total unlocks
achievementSchema.pre('save', function(next) {
  if (this.isModified('unlockedBy')) {
    this.totalUnlocks = this.unlockedBy.length;
  }
  next();
});

module.exports = mongoose.model('Achievement', achievementSchema);
