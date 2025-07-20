const mongoose = require('mongoose');

const debateSchema = new mongoose.Schema({
  // Basic Information
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  topic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
    required: [true, 'Topic is required']
  },
  
  // Debate Content
  response: {
    type: String,
    required: [true, 'Debate response is required'],
    minlength: [50, 'Response must be at least 50 characters'],
    maxlength: [5000, 'Response cannot exceed 5000 characters']
  },
  language: {
    type: String,
    default: 'en',
    enum: ['en', 'hi', 'ta', 'te', 'kn', 'ml', 'bn', 'gu', 'mr', 'pa']
  },
  
  // AI Analysis Results
  analysis: {
    // Basic metrics
    wordCount: Number,
    sentenceCount: Number,
    paragraphCount: Number,
    readabilityScore: Number,
    
    // NLP Analysis
    sentiment: {
      overall: { type: String, enum: ['positive', 'negative', 'neutral'] },
      confidence: Number
    },
    
    // Debate Elements
    debateElements: {
      claims: [String],
      evidence: [String],
      reasoning: [String],
      counterarguments: [String],
      concessions: [String]
    },
    
    // Language Quality
    languageQuality: {
      grammarScore: Number,
      vocabularyDiversity: Number,
      errors: [String],
      suggestions: [String]
    }
  },
  
  // Scoring
  scores: {
    argumentation: { type: Number, min: 0, max: 100 },
    delivery: { type: Number, min: 0, max: 100 },
    rebuttal: { type: Number, min: 0, max: 100 },
    structure: { type: Number, min: 0, max: 100 }
  },
  overallScore: { type: Number, min: 0, max: 100 },
  
  // AI Feedback
  feedback: {
    strengths: [String],
    improvements: [String],
    summary: String,
    detailedFeedback: {
      argumentation: String,
      delivery: String,
      rebuttal: String,
      structure: String
    },
    suggestions: [String]
  },
  
  // Performance Metrics
  performance: {
    timeSpent: Number, // in seconds
    startedAt: Date,
    submittedAt: Date,
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
    isCompleted: { type: Boolean, default: true }
  },
  
  // Gamification
  rewards: {
    xpEarned: { type: Number, default: 0 },
    badgesEarned: [String],
    streakBonus: { type: Number, default: 0 },
    perfectScoreBonus: { type: Number, default: 0 }
  },
  
  // Audio/Voice Data (if applicable)
  audio: {
    hasAudio: { type: Boolean, default: false },
    audioUrl: String,
    duration: Number, // in seconds
    transcription: String,
    confidence: Number
  },
  
  // Moderation and Quality
  moderation: {
    isReviewed: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: true },
    flags: [String],
    moderatorNotes: String,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date
  },
  
  // System Fields
  status: {
    type: String,
    enum: ['draft', 'submitted', 'analyzing', 'completed', 'failed'],
    default: 'submitted'
  },
  version: { type: Number, default: 1 },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes for performance
debateSchema.index({ user: 1, createdAt: -1 });
debateSchema.index({ topic: 1, createdAt: -1 });
debateSchema.index({ overallScore: -1 });
debateSchema.index({ status: 1 });
debateSchema.index({ 'performance.submittedAt': -1 });

// Pre-save middleware to update timestamps
debateSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Pre-save middleware to calculate overall score
debateSchema.pre('save', function(next) {
  if (this.scores.argumentation && this.scores.delivery && this.scores.rebuttal && this.scores.structure) {
    this.overallScore = Math.round(
      (this.scores.argumentation + this.scores.delivery + this.scores.rebuttal + this.scores.structure) / 4
    );
  }
  next();
});

// Instance method to calculate XP earned
debateSchema.methods.calculateXP = function() {
  let baseXP = 100; // Base XP for completing a debate
  
  // Score bonus (0-50 XP based on score)
  const scoreBonus = Math.round(this.overallScore / 2);
  
  // Difficulty bonus
  const difficultyBonus = {
    beginner: 0,
    intermediate: 25,
    advanced: 50
  }[this.performance.difficulty] || 0;
  
  // Length bonus (for detailed responses)
  const lengthBonus = this.analysis.wordCount > 200 ? 25 : 0;
  
  // Perfect score bonus
  const perfectBonus = this.overallScore >= 95 ? 50 : 0;
  
  const totalXP = baseXP + scoreBonus + difficultyBonus + lengthBonus + perfectBonus;
  
  this.rewards.xpEarned = totalXP;
  this.rewards.perfectScoreBonus = perfectBonus;
  
  return totalXP;
};

// Instance method to check for badge eligibility
debateSchema.methods.checkBadges = function() {
  const badges = [];
  
  // First debate badge
  if (this.user.stats.totalDebates === 1) {
    badges.push('first_debate');
  }
  
  // Perfect score badge
  if (this.overallScore >= 95) {
    badges.push('perfect_score');
  }
  
  // Multilingual badge (if user has debated in multiple languages)
  if (this.language !== 'en') {
    badges.push('multilingual_debater');
  }
  
  // Long response badge
  if (this.analysis.wordCount > 500) {
    badges.push('detailed_debater');
  }
  
  this.rewards.badgesEarned = badges;
  return badges;
};

// Static method to get user's debate history
debateSchema.statics.getUserHistory = function(userId, options = {}) {
  return this.find({ user: userId, status: 'completed' })
    .populate('topic', 'title category difficulty')
    .sort({ createdAt: -1 })
    .limit(options.limit || 20)
    .select(options.select || '-analysis -feedback.detailedFeedback')
    .lean();
};

// Static method to get topic statistics
debateSchema.statics.getTopicStats = function(topicId) {
  return this.aggregate([
    { $match: { topic: mongoose.Types.ObjectId(topicId), status: 'completed' } },
    {
      $group: {
        _id: null,
        totalDebates: { $sum: 1 },
        averageScore: { $avg: '$overallScore' },
        averageArgumentation: { $avg: '$scores.argumentation' },
        averageDelivery: { $avg: '$scores.delivery' },
        averageRebuttal: { $avg: '$scores.rebuttal' },
        averageStructure: { $avg: '$scores.structure' },
        averageWordCount: { $avg: '$analysis.wordCount' }
      }
    }
  ]);
};

// Static method to get user performance analytics
debateSchema.statics.getUserAnalytics = function(userId) {
  return this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId), status: 'completed' } },
    {
      $group: {
        _id: null,
        totalDebates: { $sum: 1 },
        averageScore: { $avg: '$overallScore' },
        totalXP: { $sum: '$rewards.xpEarned' },
        categoryAverages: {
          argumentation: { $avg: '$scores.argumentation' },
          delivery: { $avg: '$scores.delivery' },
          rebuttal: { $avg: '$scores.rebuttal' },
          structure: { $avg: '$scores.structure' }
        },
        languageDistribution: { $push: '$language' },
        improvementTrend: { $push: { date: '$createdAt', score: '$overallScore' } }
      }
    }
  ]);
};

// Static method to get recent debates for feed
debateSchema.statics.getRecentDebates = function(limit = 10) {
  return this.find({ status: 'completed', 'moderation.isApproved': true })
    .populate('user', 'username profile.firstName profile.lastName')
    .populate('topic', 'title category')
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('overallScore language createdAt')
    .lean();
};

module.exports = mongoose.model('Debate', debateSchema);