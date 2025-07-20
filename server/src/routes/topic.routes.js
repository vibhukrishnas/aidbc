const express = require('express');
const router = express.Router();
const { validationRules, validate } = require('../middleware/validation');
const { generalLimiter } = require('../middleware/rateLimit');
const { authenticate, optionalAuth } = require('../middleware/auth');

// Apply general rate limiting
router.use(generalLimiter);

// Get all topics (with optional filtering and search)
router.get('/',
  optionalAuth,
  validate([
    ...validationRules.pagination,
    ...validationRules.dateRange
  ]),
  async (req, res, next) => {
    try {
      const { 
        page = 1, 
        limit = 20, 
        category, 
        difficulty, 
        search,
        sort = 'trending' 
      } = req.query;
      
      const Topic = require('../models/Topic');
      
      // Build query
      const query = { isActive: true };
      
      if (category) query.category = category;
      if (difficulty) query.difficulty = difficulty;
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { keywords: { $in: [new RegExp(search, 'i')] } }
        ];
      }
      
      // Build sort
      let sortQuery = {};
      switch (sort) {
        case 'trending':
          sortQuery = { 'trending.score': -1, 'statistics.totalDebates': -1 };
          break;
        case 'popular':
          sortQuery = { 'statistics.totalDebates': -1, 'statistics.views': -1 };
          break;
        case 'recent':
          sortQuery = { createdAt: -1 };
          break;
        case 'title':
          sortQuery = { title: 1 };
          break;
        default:
          sortQuery = { 'trending.score': -1 };
      }
      
      const topics = await Topic.find(query)
        .sort(sortQuery)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .select('title description category difficulty keywords estimatedTime statistics trending tags')
        .lean();
      
      const total = await Topic.countDocuments(query);
      
      // Add user-specific data if authenticated
      if (req.user) {
        const Debate = require('../models/Debate');
        const userDebatedTopics = await Debate.find({ user: req.user.id }).distinct('topic');
        
        topics.forEach(topic => {
          topic.hasDebated = userDebatedTopics.some(debatedId => 
            debatedId.toString() === topic._id.toString()
          );
        });
      }
      
      res.json({
        success: true,
        data: {
          topics,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          },
          filters: {
            category,
            difficulty,
            search,
            sort
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get topic by ID
router.get('/:topicId',
  optionalAuth,
  validate(validationRules.mongoId('topicId')),
  async (req, res, next) => {
    try {
      const topicId = req.params.topicId;
      
      const Topic = require('../models/Topic');
      let topic = await Topic.findById(topicId);
      
      if (!topic || !topic.isActive) {
        return res.status(404).json({
          success: false,
          error: 'Topic not found'
        });
      }
      
      // Increment view count
      await topic.addView();
      
      // Get localized content if user has language preference
      const language = req.user?.preferences?.language || 'en';
      const localizedContent = topic.getLocalizedContent(language);
      
      // Get user-specific data if authenticated
      let userDebateCount = 0;
      let userBestScore = 0;
      let hasDebated = false;
      
      if (req.user) {
        const Debate = require('../models/Debate');
        const userDebates = await Debate.find({ 
          user: req.user.id, 
          topic: topicId 
        }).select('feedback.overallScore');
        
        userDebateCount = userDebates.length;
        hasDebated = userDebateCount > 0;
        
        if (userDebates.length > 0) {
          userBestScore = Math.max(...userDebates.map(d => d.feedback.overallScore || 0));
        }
      }
      
      // Get recent debates for this topic (public ones)
      const Debate = require('../models/Debate');
      const recentDebates = await Debate.find({
        topic: topicId,
        isPublic: true
      })
      .populate('user', 'username avatar level')
      .select('feedback.overallScore createdAt user')
      .sort({ createdAt: -1 })
      .limit(5);
      
      const topicData = {
        ...topic.toObject(),
        ...localizedContent,
        userStats: {
          debateCount: userDebateCount,
          bestScore: userBestScore,
          hasDebated
        },
        recentDebates: recentDebates.map(debate => ({
          id: debate._id,
          score: debate.feedback.overallScore,
          date: debate.createdAt,
          user: debate.user
        }))
      };
      
      res.json({
        success: true,
        data: topicData
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get trending topics
router.get('/lists/trending',
  optionalAuth,
  validate(validationRules.pagination),
  async (req, res, next) => {
    try {
      const { limit = 10, category } = req.query;
      
      const Topic = require('../models/Topic');
      const topics = await Topic.getTrending(limit, category);
      
      res.json({
        success: true,
        data: topics
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get beginner-friendly topics
router.get('/lists/beginner',
  optionalAuth,
  async (req, res, next) => {
    try {
      const { limit = 5 } = req.query;
      
      const Topic = require('../models/Topic');
      const topics = await Topic.getBeginnerFriendly(limit);
      
      res.json({
        success: true,
        data: topics
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get topic categories with counts
router.get('/meta/categories',
  async (req, res, next) => {
    try {
      const Topic = require('../models/Topic');
      
      const categories = await Topic.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            avgDifficulty: { $avg: { 
              $switch: {
                branches: [
                  { case: { $eq: ['$difficulty', 'beginner'] }, then: 1 },
                  { case: { $eq: ['$difficulty', 'intermediate'] }, then: 2 },
                  { case: { $eq: ['$difficulty', 'advanced'] }, then: 3 }
                ],
                default: 2
              }
            }}
          }
        },
        { $sort: { count: -1 } }
      ]);
      
      const formattedCategories = categories.map(cat => ({
        name: cat._id,
        count: cat.count,
        difficulty: cat.avgDifficulty < 1.5 ? 'beginner' : 
                   cat.avgDifficulty < 2.5 ? 'intermediate' : 'advanced'
      }));
      
      res.json({
        success: true,
        data: formattedCategories
      });
    } catch (error) {
      next(error);
    }
  }
);

// Search topics
router.get('/search/:searchTerm',
  optionalAuth,
  validate(validationRules.pagination),
  async (req, res, next) => {
    try {
      const { searchTerm } = req.params;
      const { category, difficulty, page = 1, limit = 20 } = req.query;
      
      if (searchTerm.length < 2) {
        return res.status(400).json({
          success: false,
          error: 'Search term must be at least 2 characters'
        });
      }
      
      const Topic = require('../models/Topic');
      const topics = await Topic.searchTopics(searchTerm, category, difficulty);
      
      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedTopics = topics.slice(startIndex, endIndex);
      
      res.json({
        success: true,
        data: {
          topics: paginatedTopics,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: topics.length,
            pages: Math.ceil(topics.length / limit)
          },
          searchTerm
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Create new topic (admin only)
router.post('/',
  authenticate,
  validate(validationRules.createTopic),
  async (req, res, next) => {
    try {
      // Check if user is admin
      if (!req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
      }
      
      const Topic = require('../models/Topic');
      const topicData = {
        ...req.body,
        createdBy: req.user.id
      };
      
      const topic = new Topic(topicData);
      await topic.save();
      
      res.status(201).json({
        success: true,
        data: topic,
        message: 'Topic created successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get topic statistics
router.get('/:topicId/stats',
  validate(validationRules.mongoId('topicId')),
  async (req, res, next) => {
    try {
      const topicId = req.params.topicId;
      
      const Topic = require('../models/Topic');
      const Debate = require('../models/Debate');
      
      const topic = await Topic.findById(topicId);
      if (!topic) {
        return res.status(404).json({
          success: false,
          error: 'Topic not found'
        });
      }
      
      // Get detailed statistics
      const debateStats = await Debate.aggregate([
        { $match: { topic: topic._id } },
        {
          $group: {
            _id: null,
            totalDebates: { $sum: 1 },
            avgScore: { $avg: '$feedback.overallScore' },
            maxScore: { $max: '$feedback.overallScore' },
            minScore: { $min: '$feedback.overallScore' },
            totalViews: { $sum: '$viewCount' },
            languages: { $addToSet: '$language' }
          }
        }
      ]);
      
      // Score distribution
      const scoreDistribution = await Debate.aggregate([
        { $match: { topic: topic._id } },
        {
          $bucket: {
            groupBy: '$feedback.overallScore',
            boundaries: [0, 60, 70, 80, 90, 100],
            default: 'other',
            output: { count: { $sum: 1 } }
          }
        }
      ]);
      
      const stats = debateStats[0] || {
        totalDebates: 0,
        avgScore: 0,
        maxScore: 0,
        minScore: 0,
        totalViews: 0,
        languages: []
      };
      
      res.json({
        success: true,
        data: {
          topic: {
            id: topic._id,
            title: topic.title,
            category: topic.category,
            difficulty: topic.difficulty
          },
          statistics: {
            ...stats,
            scoreDistribution,
            views: topic.statistics.views,
            positionPreference: topic.positionPreference,
            popularityRating: topic.popularityRating
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
