const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Topic title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Topic description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  // Categorization
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['technology', 'environment', 'education', 'politics', 'economics', 'social', 'health', 'culture', 'sports', 'other']
  },
  tags: [String],
  
  // Difficulty and Metadata
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate'
  },
  estimatedTime: {
    type: Number, // in minutes
    default: 10
  },
  
  // Multilingual Support
  translations: {
    hi: {
      title: String,
      description: String
    },
    ta: {
      title: String,
      description: String
    },
    te: {
      title: String,
      description: String
    },
    kn: {
      title: String,
      description: String
    },
    ml: {
      title: String,
      description: String
    },
    bn: {
      title: String,
      description: String
    },
    gu: {
      title: String,
      description: String
    },
    mr: {
      title: String,
      description: String
    },
    pa: {
      title: String,
      description: String
    }
  },
  
  // Content Structure
  structure: {
    prompt: String,
    context: String,
    keyPoints: [String],
    counterArguments: [String],
    resources: [{
      title: String,
      url: String,
      type: { type: String, enum: ['article', 'video', 'research', 'statistics'] }
    }]
  },
  
  // Statistics
  stats: {
    totalDebates: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 },
    popularityScore: { type: Number, default: 0 }
  },
  
  // Moderation
  status: {
    type: String,
    enum: ['draft', 'review', 'approved', 'rejected', 'archived'],
    default: 'draft'
  },
  moderationNotes: String,
  
  // System Fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes for performance
topicSchema.index({ category: 1, difficulty: 1 });
topicSchema.index({ status: 1, isActive: 1 });
topicSchema.index({ 'stats.popularityScore': -1 });
topicSchema.index({ tags: 1 });
topicSchema.index({ createdAt: -1 });

// Pre-save middleware to update timestamps
topicSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Instance method to get localized content
topicSchema.methods.getLocalized = function(language = 'en') {
  if (language === 'en') {
    return {
      title: this.title,
      description: this.description
    };
  }
  
  const translation = this.translations[language];
  return {
    title: translation?.title || this.title,
    description: translation?.description || this.description
  };
};

// Instance method to update statistics
topicSchema.methods.updateStats = function(score) {
  this.stats.totalDebates += 1;
  
  // Update average score
  const currentTotal = this.stats.averageScore * (this.stats.totalDebates - 1);
  this.stats.averageScore = (currentTotal + score) / this.stats.totalDebates;
  
  // Update popularity score (combination of total debates and average score)
  this.stats.popularityScore = this.stats.totalDebates * (this.stats.averageScore / 100);
  
  return this.save();
};

// Static method to get topics by category
topicSchema.statics.getByCategory = function(category, options = {}) {
  const query = { category, status: 'approved', isActive: true };
  
  return this.find(query)
    .sort(options.sort || { 'stats.popularityScore': -1 })
    .limit(options.limit || 20)
    .select(options.select || '-translations -structure.resources')
    .lean();
};

// Static method to get featured topics
topicSchema.statics.getFeatured = function(limit = 5) {
  return this.find({ 
    isFeatured: true, 
    status: 'approved', 
    isActive: true 
  })
    .sort({ 'stats.popularityScore': -1 })
    .limit(limit)
    .select('-translations -structure.resources')
    .lean();
};

// Static method to search topics
topicSchema.statics.search = function(query, options = {}) {
  const searchRegex = new RegExp(query, 'i');
  
  return this.find({
    $and: [
      { status: 'approved', isActive: true },
      {
        $or: [
          { title: searchRegex },
          { description: searchRegex },
          { tags: { $in: [searchRegex] } }
        ]
      }
    ]
  })
    .sort(options.sort || { 'stats.popularityScore': -1 })
    .limit(options.limit || 20)
    .select('-translations -structure.resources')
    .lean();
};

// Static method to get random topics
topicSchema.statics.getRandom = function(count = 1, difficulty = null) {
  const matchStage = { 
    status: 'approved', 
    isActive: true 
  };
  
  if (difficulty) {
    matchStage.difficulty = difficulty;
  }
  
  return this.aggregate([
    { $match: matchStage },
    { $sample: { size: count } },
    { $project: { translations: 0, 'structure.resources': 0 } }
  ]);
};

module.exports = mongoose.model('Topic', topicSchema);