const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { validationRules, validate } = require('../middleware/validation');
const { generalLimiter } = require('../middleware/rateLimit');
const { authenticate, optionalAuth } = require('../middleware/auth');

// Apply general rate limiting
router.use(generalLimiter);

// Get user profile (public route with optional auth for enhanced data)
router.get('/profile/:userId', 
  optionalAuth,
  validate(validationRules.mongoId('userId')),
  userController.getProfile
);

// Get current user profile (authenticated)
router.get('/profile', 
  authenticate,
  userController.getProfile
);

// Update user profile
router.put('/profile',
  authenticate,
  validate(validationRules.updateProfile),
  userController.updateProfile
);

// Update user preferences
router.put('/preferences',
  authenticate,
  userController.updatePreferences
);

// Get user statistics
router.get('/stats/:userId?',
  optionalAuth,
  userController.getUserStats
);

// Get user's learning path
router.get('/learning-path',
  authenticate,
  userController.getLearningPath
);

// Delete user account
router.delete('/account',
  authenticate,
  userController.deleteAccount
);

// Search users (for social features)
router.get('/search',
  authenticate,
  validate(validationRules.pagination),
  async (req, res, next) => {
    try {
      const { q, page = 1, limit = 20 } = req.query;
      
      const query = {
        isActive: true,
        $or: [
          { username: { $regex: q, $options: 'i' } },
          { bio: { $regex: q, $options: 'i' } }
        ]
      };
      
      const users = await require('../models/User')
        .find(query)
        .select('username avatar level totalXP bio')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ totalXP: -1 });
      
      const total = await require('../models/User').countDocuments(query);
      
      res.json({
        success: true,
        data: {
          users,
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

// Follow/Unfollow user
router.post('/follow/:userId',
  authenticate,
  validate(validationRules.mongoId('userId')),
  async (req, res, next) => {
    try {
      const targetUserId = req.params.userId;
      const currentUserId = req.user.id;
      
      if (targetUserId === currentUserId) {
        return res.status(400).json({
          success: false,
          error: 'Cannot follow yourself'
        });
      }
      
      const User = require('../models/User');
      const [currentUser, targetUser] = await Promise.all([
        User.findById(currentUserId),
        User.findById(targetUserId)
      ]);
      
      if (!targetUser || !targetUser.isActive) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      const isFollowing = currentUser.following.includes(targetUserId);
      
      if (isFollowing) {
        // Unfollow
        currentUser.following.pull(targetUserId);
        targetUser.followers.pull(currentUserId);
      } else {
        // Follow
        currentUser.following.push(targetUserId);
        targetUser.followers.push(currentUserId);
      }
      
      await Promise.all([currentUser.save(), targetUser.save()]);
      
      // Emit socket event for real-time update
      const io = req.app.get('io');
      if (!isFollowing) {
        io.to(`user:${targetUserId}`).emit('notification', {
          type: 'new_follower',
          message: `${currentUser.username} started following you`,
          user: {
            id: currentUser._id,
            username: currentUser.username,
            avatar: currentUser.avatar
          }
        });
      }
      
      res.json({
        success: true,
        data: {
          isFollowing: !isFollowing,
          followersCount: targetUser.followers.length,
          followingCount: currentUser.following.length
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get user's followers
router.get('/followers/:userId?',
  optionalAuth,
  validate(validationRules.pagination),
  async (req, res, next) => {
    try {
      const userId = req.params.userId || req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }
      
      const { page = 1, limit = 20 } = req.query;
      
      const User = require('../models/User');
      const user = await User.findById(userId)
        .populate({
          path: 'followers',
          select: 'username avatar level totalXP',
          options: {
            limit: limit * 1,
            skip: (page - 1) * limit,
            sort: { totalXP: -1 }
          }
        });
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      res.json({
        success: true,
        data: {
          followers: user.followers,
          total: user.followers.length,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(user.followers.length / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get user's following
router.get('/following/:userId?',
  optionalAuth,
  validate(validationRules.pagination),
  async (req, res, next) => {
    try {
      const userId = req.params.userId || req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }
      
      const { page = 1, limit = 20 } = req.query;
      
      const User = require('../models/User');
      const user = await User.findById(userId)
        .populate({
          path: 'following',
          select: 'username avatar level totalXP',
          options: {
            limit: limit * 1,
            skip: (page - 1) * limit,
            sort: { totalXP: -1 }
          }
        });
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      res.json({
        success: true,
        data: {
          following: user.following,
          total: user.following.length,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(user.following.length / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
