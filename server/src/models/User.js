const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Information
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  
  // Profile Information
  profile: {
    firstName: String,
    lastName: String,
    avatar: String,
    bio: String,
    dateOfBirth: Date,
    grade: String,
    school: String,
    city: String,
    country: { type: String, default: 'India' }
  },

  // Debate Statistics
  stats: {
    totalDebates: { type: Number, default: 0 },
    totalXP: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    categoryScores: {
      argumentation: { type: Number, default: 0 },
      delivery: { type: Number, default: 0 },
      rebuttal: { type: Number, default: 0 },
      structure: { type: Number, default: 0 }
    }
  },

  // Preferences
  preferences: {
    language: { type: String, default: 'en' },
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    topics: [String],
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      reminders: { type: Boolean, default: true }
    },
    accessibility: {
      screenReader: { type: Boolean, default: false },
      highContrast: { type: Boolean, default: false },
      largeText: { type: Boolean, default: false },
      voiceInput: { type: Boolean, default: false },
      audioFeedback: { type: Boolean, default: false }
    }
  },

  // Achievements and Badges
  achievements: [{
    badgeId: String,
    name: String,
    description: String,
    earnedAt: { type: Date, default: Date.now },
    category: String
  }],

  // System Fields
  role: { type: String, enum: ['student', 'teacher', 'admin'], default: 'student' },
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  lastActiveAt: { type: Date, default: Date.now },
  loginCount: { type: Number, default: 0 },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ 'stats.totalXP': -1 });
userSchema.index({ lastActiveAt: -1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash password if it's modified
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to update timestamps
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to calculate level from XP
userSchema.methods.calculateLevel = function() {
  const xp = this.stats.totalXP;
  if (xp < 500) return 1;
  if (xp < 1500) return 2;
  if (xp < 3000) return 3;
  if (xp < 6000) return 4;
  if (xp < 10000) return 5;
  return Math.floor(xp / 2000) + 1; // Level 6+
};

// Instance method to add XP and update level
userSchema.methods.addXP = function(points) {
  this.stats.totalXP += points;
  this.stats.level = this.calculateLevel();
  return this.save();
};

// Instance method to update streak
userSchema.methods.updateStreak = function(isConsecutive = true) {
  if (isConsecutive) {
    this.stats.currentStreak += 1;
    if (this.stats.currentStreak > this.stats.longestStreak) {
      this.stats.longestStreak = this.stats.currentStreak;
    }
  } else {
    this.stats.currentStreak = 1;
  }
  return this.save();
};

// Static method to get leaderboard
userSchema.statics.getLeaderboard = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ 'stats.totalXP': -1 })
    .limit(limit)
    .select('username profile.firstName profile.lastName stats.totalXP stats.level')
    .lean();
};

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  if (this.profile.firstName && this.profile.lastName) {
    return `${this.profile.firstName} ${this.profile.lastName}`;
  }
  return this.username;
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('User', userSchema);