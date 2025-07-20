const express = require('express');
const { query, param } = require('express-validator');
const Topic = require('../models/Topic');
const { authenticate, optionalAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/topics
 * @desc    Get all topics with filtering and pagination
 * @access  Public
 */
router.get('/', [
  query('category')
    .optional()
    .isIn(['technology', 'environment', 'education', 'politics', 'economics', 'social', 'health', 'culture', 'sports', 'other'])
    .withMessage('Invalid category'),
  query('difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Invalid difficulty level'),
  query('language')
    .optional()
    .isIn(['en', 'hi', 'ta', 'te', 'kn', 'ml', 'bn', 'gu', 'mr', 'pa'])
    .withMessage('Invalid language'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
], async (req, res, next) => {
  try {
    const {
      category,
      difficulty,
      language = 'en',
      search,
      featured,
      limit = 20,
      page = 1,
      sort = 'popularity'
    } = req.query;

    // Build query
    const query = {
      status: 'approved',
      isActive: true
    };

    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (featured === 'true') query.isFeatured = true;

    // Handle search
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { tags: { $in: [searchRegex] } }
      ];
    }

    // Sort options
    const sortOptions = {
      popularity: { 'stats.popularityScore': -1 },
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      title: { title: 1 },
      difficulty: { difficulty: 1 }
    };

    const sortBy = sortOptions[sort] || sortOptions.popularity;

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const topics = await Topic.find(query)
      .sort(sortBy)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-translations -structure.resources -moderationNotes')
      .lean();

    // Get total count for pagination
    const total = await Topic.countDocuments(query);

    // Localize topics if language is not English
    const localizedTopics = topics.map(topic => {
      if (language !== 'en' && topic.translations && topic.translations[language]) {
        return {
          ...topic,
          title: topic.translations[language].title || topic.title,
          description: topic.translations[language].description || topic.description
        };
      }
      return topic;
    });

    res.json({
      success: true,
      data: {
        topics: localizedTopics,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: topics.length,
          totalItems: total
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/topics/featured
 * @desc    Get featured topics
 * @access  Public
 */
router.get('/featured', [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Limit must be between 1 and 10'),
  query('language')
    .optional()
    .isIn(['en', 'hi', 'ta', 'te', 'kn', 'ml', 'bn', 'gu', 'mr', 'pa'])
    .withMessage('Invalid language')
], async (req, res, next) => {
  try {
    const { limit = 5, language = 'en' } = req.query;

    const topics = await Topic.getFeatured(parseInt(limit));

    // Localize topics
    const localizedTopics = topics.map(topic => {
      if (language !== 'en' && topic.translations && topic.translations[language]) {
        return {
          ...topic,
          title: topic.translations[language].title || topic.title,
          description: topic.translations[language].description || topic.description
        };
      }
      return topic;
    });

    res.json({
      success: true,
      data: { topics: localizedTopics }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/topics/random
 * @desc    Get random topics
 * @access  Public
 */
router.get('/random', [
  query('count')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Count must be between 1 and 5'),
  query('difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Invalid difficulty level'),
  query('language')
    .optional()
    .isIn(['en', 'hi', 'ta', 'te', 'kn', 'ml', 'bn', 'gu', 'mr', 'pa'])
    .withMessage('Invalid language')
], async (req, res, next) => {
  try {
    const { count = 1, difficulty, language = 'en' } = req.query;

    const topics = await Topic.getRandom(parseInt(count), difficulty);

    // Localize topics
    const localizedTopics = topics.map(topic => {
      if (language !== 'en' && topic.translations && topic.translations[language]) {
        return {
          ...topic,
          title: topic.translations[language].title || topic.title,
          description: topic.translations[language].description || topic.description
        };
      }
      return topic;
    });

    res.json({
      success: true,
      data: { topics: localizedTopics }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/topics/categories
 * @desc    Get topic categories with counts
 * @access  Public
 */
router.get('/categories', async (req, res, next) => {
  try {
    const categories = await Topic.aggregate([
      {
        $match: { status: 'approved', isActive: true }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgScore: { $avg: '$stats.averageScore' },
          totalDebates: { $sum: '$stats.totalDebates' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/topics/:id
 * @desc    Get single topic by ID
 * @access  Public
 */
router.get('/:id', [
  param('id')
    .isMongoId()
    .withMessage('Invalid topic ID'),
  query('language')
    .optional()
    .isIn(['en', 'hi', 'ta', 'te', 'kn', 'ml', 'bn', 'gu', 'mr', 'pa'])
    .withMessage('Invalid language')
], optionalAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { language = 'en' } = req.query;

    const topic = await Topic.findOne({
      _id: id,
      status: 'approved',
      isActive: true
    }).lean();

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found'
      });
    }

    // Localize topic
    let localizedTopic = { ...topic };
    if (language !== 'en' && topic.translations && topic.translations[language]) {
      localizedTopic.title = topic.translations[language].title || topic.title;
      localizedTopic.description = topic.translations[language].description || topic.description;
    }

    // Remove sensitive data
    delete localizedTopic.translations;
    delete localizedTopic.moderationNotes;

    // Get user's previous attempts if authenticated
    let userAttempts = [];
    if (req.user) {
      const Debate = require('../models/Debate');
      userAttempts = await Debate.find({
        user: req.user.id,
        topic: id,
        status: 'completed'
      })
        .select('overallScore createdAt language')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();
    }

    res.json({
      success: true,
      data: {
        topic: localizedTopic,
        userAttempts
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/topics/:id/stats
 * @desc    Get topic statistics
 * @access  Public
 */
router.get('/:id/stats', [
  param('id')
    .isMongoId()
    .withMessage('Invalid topic ID')
], async (req, res, next) => {
  try {
    const { id } = req.params;

    const topic = await Topic.findById(id).select('stats').lean();

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found'
      });
    }

    // Get detailed stats from debates
    const Debate = require('../models/Debate');
    const detailedStats = await Debate.getTopicStats(id);

    const stats = {
      basic: topic.stats,
      detailed: detailedStats[0] || {}
    };

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/topics/:id/start
 * @desc    Start a debate session for a topic
 * @access  Private
 */
router.post('/:id/start', [
  param('id')
    .isMongoId()
    .withMessage('Invalid topic ID')
], authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { language = 'en', difficulty } = req.body;

    const topic = await Topic.findOne({
      _id: id,
      status: 'approved',
      isActive: true
    }).lean();

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found'
      });
    }

    // Create a debate session (you might want to store this in a separate collection)
    const session = {
      topicId: id,
      userId: req.user.id,
      language,
      difficulty: difficulty || topic.difficulty,
      startedAt: new Date(),
      sessionId: `${req.user.id}_${id}_${Date.now()}`
    };

    // Localize topic for response
    let localizedTopic = { ...topic };
    if (language !== 'en' && topic.translations && topic.translations[language]) {
      localizedTopic.title = topic.translations[language].title || topic.title;
      localizedTopic.description = topic.translations[language].description || topic.description;
    }

    res.json({
      success: true,
      message: 'Debate session started',
      data: {
        session,
        topic: localizedTopic
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;