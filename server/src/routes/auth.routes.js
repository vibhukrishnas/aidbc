const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');
const { validationRules, validate } = require('../middleware/validation');

// Register
router.post('/register', 
  authLimiter,
  validate(validationRules.register),
  async (req, res, next) => {
    try {
      const { username, email, password } = req.body;
      
      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email }, { username }]
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: existingUser.email === email ? 'Email already registered' : 'Username already taken'
        });
      }
      
      // Create new user
      const user = new User({
        username,
        email,
        password
      });
      
      await user.save();
      
      // Generate token
      const token = generateToken(user._id);
      
      res.status(201).json({
        success: true,
        data: {
          token,
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            level: user.level,
            xp: user.xp,
            totalXP: user.totalXP,
            coins: user.coins
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Login
router.post('/login',
  authLimiter,
  validate(validationRules.login),
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      
      // Find user with password
      const user = await User.findOne({ email }).select('+password');
      
      if (!user || !await user.comparePassword(password)) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password'
        });
      }
      
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'Account is deactivated'
        });
      }
      
      // Update last active
      user.lastActiveAt = new Date();
      await user.save();
      
      // Generate token
      const token = generateToken(user._id);
      
      res.json({
        success: true,
        data: {
          token,
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            level: user.level,
            xp: user.xp,
            totalXP: user.totalXP,
            coins: user.coins,
            preferences: user.preferences,
            achievements: user.achievements.length,
            streak: user.currentStreak
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Logout (client-side token removal, but we can track it)
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Forgot password
router.post('/forgot-password',
  authLimiter,
  async (req, res, next) => {
    try {
      const { email } = req.body;
      
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      // Generate reset token (in real app, would send email)
      const resetToken = Math.random().toString(36).substring(2, 15);
      
      // Store token and expiry (simplified - in real app use proper crypto)
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
      await user.save();
      
      res.json({
        success: true,
        message: 'Password reset instructions sent to email',
        // In development, include token (remove in production)
        ...(process.env.NODE_ENV === 'development' && { resetToken })
      });
    } catch (error) {
      next(error);
    }
  }
);

// Reset password
router.post('/reset-password',
  validate(validationRules.login),
  async (req, res, next) => {
    try {
      const { token, password } = req.body;
      
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpire: { $gt: Date.now() }
      });
      
      if (!user) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or expired reset token'
        });
      }
      
      // Update password
      user.password = password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      
      // Generate new token
      const authToken = generateToken(user._id);
      
      res.json({
        success: true,
        message: 'Password reset successful',
        data: {
          token: authToken,
          user: {
            id: user._id,
            username: user.username,
            email: user.email
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Verify token
router.get('/verify', 
  require('../middleware/auth').authenticate,
  (req, res) => {
    res.json({
      success: true,
      data: {
        user: {
          id: req.user._id,
          username: req.user.username,
          email: req.user.email,
          level: req.user.level,
          xp: req.user.xp,
          totalXP: req.user.totalXP,
          coins: req.user.coins,
          preferences: req.user.preferences,
          achievements: req.user.achievements.length,
          streak: req.user.currentStreak
        }
      }
    });
  }
);

module.exports = router;
