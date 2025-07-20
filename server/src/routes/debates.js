const express = require('express');
const { body, param, validationResult } = require('express-validator');
const Debate = require('../models/Debate');
const Topic = require('../models/Topic');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const nlpProcessor = require('../../../ai-engine/models/nlp-processor');
const scoringRubric = require('../../../ai-engine/models/scoring-rubric');

const router = express.Router();

/**
 * @route   POST /api/debates
 * @desc    Submit a debate response
 * @access  Private
 */
router.post('/', authenticate, [
  body('topicId')
    .isMongoId()
    .withMessage('Invalid topic ID'),
  body('response')
    .isLength({ min: 50, max: 5000 })
    .withMessage('Response must be between 50 and 5000 characters'),
  body('language')
    .optional()
    .isIn(['en', 'hi', 'ta', 'te', 'kn', 'ml', 'bn', 'gu', 'mr', 'pa'])
    .withMessage('Invalid language')
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { topicId, response, language = 'en', difficulty } = req.body;

    // Verify topic exists
    const topic = await Topic.findOne({
      _id: topicId,
      status: 'approved',
      isActive: true
    });

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found'
      });
    }

    // Analyze the response using NLP processor
    const analysis = nlpProcessor.analyzeText(response);
    
    // Calculate scores using scoring rubric
    const scores = {
      argumentation: scoringRubric.calculateScore(response, 'argumentation'),
      delivery: scoringRubric.calculateScore(response, 'delivery'),
      rebuttal: scoringRubric.calculateScore(response, 'rebuttal'),
      structure: scoringRubric.calculateScore(response, 'structure')
    };

    // Generate feedback (simplified for demo)
    const feedback = {
      strengths: [
        "Clear expression of your main argument",
        "Good use of supporting evidence",
        "Well-structured response"
      ],
      improvements: [
        "Consider addressing counterarguments",
        "Add more specific examples",
        "Strengthen your conclusion"
      ],
      summary: "Good effort! Your debate skills are developing well. Focus on the suggested improvements for even better results."
    };

    // Create debate record
    const debate = new Debate({
      user: req.user.id,
      topic: topicId,
      response,
      language,
      analysis: {
        wordCount: analysis.basicMetrics.wordCount,
        sentenceCount: analysis.basicMetrics.sentenceCount,
        paragraphCount: analysis.basicMetrics.paragraphCount,
        readabilityScore: analysis.readability.fleschReadingEase,
        sentiment: analysis.sentiment,
        debateElements: analysis.debateElements,
        languageQuality: analysis.languageQuality
      },
      scores,
      feedback,
      performance: {
        timeSpent: req.body.timeSpent || 0,
        startedAt: req.body.startedAt ? new Date(req.body.startedAt) : new Date(),
        submittedAt: new Date(),
        difficulty: difficulty || topic.difficulty,
        isCompleted: true
      },
      status: 'completed'
    });

    // Calculate XP and badges
    const xpEarned = debate.calculateXP();
    const badges = debate.checkBadges();

    await debate.save();

    // Update user stats
    const user = await User.findById(req.user.id);
    user.stats.totalDebates += 1;
    user.stats.totalXP += xpEarned;
    user.stats.level = user.calculateLevel();
    
    // Update average scores
    const totalScore = scores.argumentation + scores.delivery + scores.rebuttal + scores.structure;
    const avgScore = totalScore / 4;
    
    if (user.stats.averageScore === 0) {
      user.stats.averageScore = avgScore;
    } else {
      user.stats.averageScore = (user.stats.averageScore * (user.stats.totalDebates - 1) + avgScore) / user.stats.totalDebates;
    }

    // Update category scores
    Object.keys(scores).forEach(category => {
      if (user.stats.categoryScores[category] === 0) {
        user.stats.categoryScores[category] = scores[category];
      } else {
        user.stats.categoryScores[category] = (user.stats.categoryScores[category] * (user.stats.totalDebates - 1) + scores[category]) / user.stats.totalDebates;
      }
    });

    await user.save();

    // Update topic stats
    await topic.updateStats(avgScore);

    // Populate the response
    await debate.populate('topic', 'title category difficulty');

    res.status(201).json({
      success: true,
      message: 'Debate submitted successfully!',
      data: {
        debate,
        rewards: {
          xpEarned,
          badges,
          levelUp: user.stats.level > user.stats.level - 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/debates
 * @desc    Get user's debate history
 * @access  Private
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    const debates = await Debate.find({
      user: req.user.id,
      status: 'completed'
    })
      .populate('topic', 'title category difficulty')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-analysis -feedback.detailedFeedback')
      .lean();

    const total = await Debate.countDocuments({
      user: req.user.id,
      status: 'completed'
    });

    res.json({
      success: true,
      data: {
        debates,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: debates.length,
          totalItems: total
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/debates/:id
 * @desc    Get single debate by ID
 * @access  Private
 */
router.get('/:id', authenticate, [
  param('id')
    .isMongoId()
    .withMessage('Invalid debate ID')
], async (req, res, next) => {
  try {
    const debate = await Debate.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate('topic', 'title category difficulty description');

    if (!debate) {
      return res.status(404).json({
        success: false,
        message: 'Debate not found'
      });
    }

    res.json({
      success: true,
      data: { debate }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/debates/analytics/progress
 * @desc    Get user's progress analytics
 * @access  Private
 */
router.get('/analytics/progress', authenticate, async (req, res, next) => {
  try {
    const analytics = await Debate.getUserAnalytics(req.user.id);
    
    res.json({
      success: true,
      data: { analytics: analytics[0] || {} }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;