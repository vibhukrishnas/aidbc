const express = require('express');
const router = express.Router();
const debateController = require('../controllers/debate.controller');
const { validationRules, validate } = require('../middleware/validation');
const { aiLimiter, generalLimiter } = require('../middleware/rateLimit');
const { authenticate, optionalAuth } = require('../middleware/auth');

// Apply general rate limiting
router.use(generalLimiter);

// Submit debate (with AI analysis rate limiting)
router.post('/submit',
  authenticate,
  aiLimiter,
  validate(validationRules.submitDebate),
  debateController.submitDebate
);

// Get user's debates
router.get('/my-debates',
  authenticate,
  validate(validationRules.pagination),
  debateController.getUserDebates
);

// Get specific debate by ID
router.get('/:debateId',
  optionalAuth,
  validate(validationRules.mongoId('debateId')),
  debateController.getDebate
);

// Get public debates (trending, recent, top-rated)
router.get('/',
  optionalAuth,
  validate([
    ...validationRules.pagination,
    ...validationRules.dateRange
  ]),
  debateController.getPublicDebates
);

// Update debate visibility
router.put('/:debateId/visibility',
  authenticate,
  validate(validationRules.mongoId('debateId')),
  async (req, res, next) => {
    try {
      const { isPublic } = req.body;
      const debateId = req.params.debateId;
      
      const Debate = require('../models/Debate');
      const debate = await Debate.findOne({
        _id: debateId,
        user: req.user.id
      });
      
      if (!debate) {
        return res.status(404).json({
          success: false,
          error: 'Debate not found or unauthorized'
        });
      }
      
      debate.isPublic = isPublic;
      await debate.save();
      
      res.json({
        success: true,
        data: { isPublic: debate.isPublic }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Share debate
router.post('/:debateId/share',
  authenticate,
  validate(validationRules.mongoId('debateId')),
  async (req, res, next) => {
    try {
      const debateId = req.params.debateId;
      
      const Debate = require('../models/Debate');
      const debate = await Debate.findById(debateId);
      
      if (!debate || (!debate.isPublic && debate.user.toString() !== req.user.id)) {
        return res.status(404).json({
          success: false,
          error: 'Debate not found or private'
        });
      }
      
      await debate.incrementShareCount();
      
      res.json({
        success: true,
        data: {
          shareUrl: `${process.env.CLIENT_URL}/debates/${debateId}`,
          shareCount: debate.shareCount
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Like/Unlike debate
router.post('/:debateId/like',
  authenticate,
  validate(validationRules.mongoId('debateId')),
  async (req, res, next) => {
    try {
      const debateId = req.params.debateId;
      const userId = req.user.id;
      
      const Debate = require('../models/Debate');
      const debate = await Debate.findById(debateId);
      
      if (!debate || !debate.isPublic) {
        return res.status(404).json({
          success: false,
          error: 'Debate not found or private'
        });
      }
      
      const likeIndex = debate.likes.indexOf(userId);
      
      if (likeIndex > -1) {
        // Unlike
        debate.likes.splice(likeIndex, 1);
      } else {
        // Like
        debate.likes.push(userId);
      }
      
      await debate.save();
      
      res.json({
        success: true,
        data: {
          isLiked: likeIndex === -1,
          likeCount: debate.likes.length
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Request peer review
router.post('/:debateId/peer-review',
  authenticate,
  validate(validationRules.mongoId('debateId')),
  async (req, res, next) => {
    try {
      const debateId = req.params.debateId;
      
      const Debate = require('../models/Debate');
      const debate = await Debate.findOne({
        _id: debateId,
        user: req.user.id
      });
      
      if (!debate) {
        return res.status(404).json({
          success: false,
          error: 'Debate not found or unauthorized'
        });
      }
      
      if (debate.peerReviewRequested) {
        return res.status(400).json({
          success: false,
          error: 'Peer review already requested'
        });
      }
      
      debate.peerReviewRequested = true;
      debate.isPublic = true; // Must be public for peer review
      await debate.save();
      
      // Emit event for potential reviewers
      const io = req.app.get('io');
      io.emit('peer-review:available', {
        debateId: debate._id,
        topic: debate.topic,
        score: debate.feedback.overallScore
      });
      
      res.json({
        success: true,
        message: 'Peer review requested successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Add peer review
router.post('/:debateId/review',
  authenticate,
  validate([
    ...validationRules.mongoId('debateId'),
    ...validationRules.pagination
  ]),
  async (req, res, next) => {
    try {
      const debateId = req.params.debateId;
      const { rating, feedback } = req.body;
      
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          error: 'Rating must be between 1 and 5'
        });
      }
      
      const Debate = require('../models/Debate');
      const debate = await Debate.findById(debateId);
      
      if (!debate || !debate.peerReviewRequested || !debate.isPublic) {
        return res.status(404).json({
          success: false,
          error: 'Debate not available for review'
        });
      }
      
      // Check if user is trying to review their own debate
      if (debate.user.toString() === req.user.id) {
        return res.status(400).json({
          success: false,
          error: 'Cannot review your own debate'
        });
      }
      
      // Check if user already reviewed this debate
      const existingReview = debate.peerReviews.find(
        review => review.reviewer.toString() === req.user.id
      );
      
      if (existingReview) {
        return res.status(400).json({
          success: false,
          error: 'You have already reviewed this debate'
        });
      }
      
      // Add review
      debate.peerReviews.push({
        reviewer: req.user.id,
        rating,
        feedback
      });
      
      // Update review status
      if (debate.peerReviews.length >= 3) {
        debate.peerReviewStatus = 'completed';
      } else {
        debate.peerReviewStatus = 'in_progress';
      }
      
      await debate.save();
      
      // Reward reviewer with XP
      req.user.addXP(25);
      await req.user.save();
      
      // Notify debate author
      const io = req.app.get('io');
      io.to(`user:${debate.user}`).emit('notification', {
        type: 'peer_review',
        message: `Your debate received a peer review (${rating}/5 stars)`,
        debateId: debate._id
      });
      
      res.json({
        success: true,
        message: 'Review submitted successfully',
        data: {
          xpEarned: 25,
          reviewCount: debate.peerReviews.length
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get debates available for peer review
router.get('/peer-review/available',
  authenticate,
  validate(validationRules.pagination),
  async (req, res, next) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      
      const Debate = require('../models/Debate');
      const debates = await Debate.find({
        peerReviewRequested: true,
        peerReviewStatus: { $ne: 'completed' },
        user: { $ne: req.user.id },
        'peerReviews.reviewer': { $ne: req.user.id }
      })
      .populate('user', 'username avatar level')
      .populate('topic', 'title category')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
      
      const total = await Debate.countDocuments({
        peerReviewRequested: true,
        peerReviewStatus: { $ne: 'completed' },
        user: { $ne: req.user.id },
        'peerReviews.reviewer': { $ne: req.user.id }
      });
      
      res.json({
        success: true,
        data: {
          debates,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
