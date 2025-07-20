const Debate = require('../models/Debate');
const Topic = require('../models/Topic');
const User = require('../models/User');
const sarvamAIService = require('../services/sarvamAI.service');
const scoringService = require('../services/scoring.service');
const { validationResult } = require('express-validator');

class DebateController {
  // Get all debate topics
  async getTopics(req, res, next) {
    try {
      const { language = 'en' } = req.params;
      const { category, difficulty } = req.query;
      
      // Build query
      const query = {};
      if (category) query.category = category;
      if (difficulty) query.difficulty = difficulty;
      
      let topics = await Topic.find(query)
        .select('-__v')
        .sort({ createdAt: -1 });
      
      // Translate topics if not English
      if (language !== 'en') {
        topics = await sarvamAIService.translateTopics(topics, language);
      }
      
      res.json({
        success: true,
        count: topics.length,
        language,
        data: topics
      });
    } catch (error) {
      next(error);
    }
  }

  // Submit a debate response
  async submitDebate(req, res, next) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { topicId, response, language = 'en' } = req.body;
      const userId = req.user.id;

      // Get topic
      const topic = await Topic.findById(topicId);
      if (!topic) {
        return res.status(404).json({
          success: false,
          error: 'Topic not found'
        });
      }

      // Generate AI feedback
      const aiFeedback = await sarvamAIService.analyzeDebate(response, topic, language);
      
      // Calculate scores
      const scores = scoringService.calculateScores(response, aiFeedback);
      
      // Create debate record
      const debate = await Debate.create({
        user: userId,
        topic: topicId,
        response,
        language,
        feedback: {
          ...aiFeedback,
          scores,
          overallScore: scores.overall
        },
        duration: req.body.duration || 0
      });

      // Update user statistics
      await User.findByIdAndUpdate(userId, {
        $inc: {
          totalDebates: 1,
          totalXP: Math.floor(scores.overall * 0.5)
        },
        $push: {
          debateHistory: debate._id
        },
        lastActiveAt: new Date()
      });

      // Emit real-time update
      const io = req.app.get('io');
      io.to(`user:${userId}`).emit('debate:completed', {
        debateId: debate._id,
        score: scores.overall,
        xpEarned: Math.floor(scores.overall * 0.5)
      });

      res.status(201).json({
        success: true,
        data: {
          debateId: debate._id,
          feedback: debate.feedback,
          xpEarned: Math.floor(scores.overall * 0.5)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get debate history
  async getDebateHistory(req, res, next) {
    try {
      const userId = req.params.userId || req.user.id;
      const { page = 1, limit = 10 } = req.query;
      
      const debates = await Debate.find({ user: userId })
        .populate('topic', 'title category difficulty')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .select('-response'); // Don't send full response in list
      
      const total = await Debate.countDocuments({ user: userId });
      
      res.json({
        success: true,
        data: debates,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get single debate details
  async getDebateDetails(req, res, next) {
    try {
      const { debateId } = req.params;
      
      const debate = await Debate.findById(debateId)
        .populate('topic')
        .populate('user', 'username avatar level');
      
      if (!debate) {
        return res.status(404).json({
          success: false,
          error: 'Debate not found'
        });
      }
      
      // Check if user has permission to view
      if (debate.user._id.toString() !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }
      
      res.json({
        success: true,
        data: debate
      });
    } catch (error) {
      next(error);
    }
  }

  // Get debate statistics
  async getDebateStats(req, res, next) {
    try {
      const userId = req.params.userId || req.user.id;
      
      const stats = await Debate.aggregate([
        { $match: { user: userId } },
        {
          $group: {
            _id: null,
            totalDebates: { $sum: 1 },
            averageScore: { $avg: '$feedback.overallScore' },
            highestScore: { $max: '$feedback.overallScore' },
            totalDuration: { $sum: '$duration' },
            averageArgumentation: { $avg: '$feedback.scores.argumentation' },
            averageDelivery: { $avg: '$feedback.scores.delivery' },
            averageRebuttal: { $avg: '$feedback.scores.rebuttal' },
            averageStructure: { $avg: '$feedback.scores.structure' }
          }
        }
      ]);
      
      const categoryStats = await Debate.aggregate([
        { $match: { user: userId } },
        {
          $lookup: {
            from: 'topics',
            localField: 'topic',
            foreignField: '_id',
            as: 'topicInfo'
          }
        },
        { $unwind: '$topicInfo' },
        {
          $group: {
            _id: '$topicInfo.category',
            count: { $sum: 1 },
            averageScore: { $avg: '$feedback.overallScore' }
          }
        }
      ]);
      
      res.json({
        success: true,
        data: {
          overall: stats[0] || {},
          byCategory: categoryStats
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Create a new topic (admin only)
  async createTopic(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const topic = await Topic.create(req.body);
      
      res.status(201).json({
        success: true,
        data: topic
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DebateController();
