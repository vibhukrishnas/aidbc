// API Configuration
export const API_ENDPOINTS = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  SARVAM_AI_URL: process.env.REACT_APP_SARVAM_AI_URL || 'https://api.sarvam.ai/v1'
};

// Application Constants
export const APP_CONFIG = {
  NAME: 'AI Debate Coach',
  VERSION: '1.0.0',
  DESCRIPTION: 'Accessible AI-powered debate coaching platform',
  AUTHOR: 'Your Team'
};

// Debate Configuration
export const DEBATE_CONFIG = {
  MIN_RESPONSE_LENGTH: 50,
  MAX_RESPONSE_LENGTH: 2000,
  TIME_LIMITS: {
    BEGINNER: 300, // 5 minutes
    INTERMEDIATE: 600, // 10 minutes
    ADVANCED: 900 // 15 minutes
  },
  SCORING: {
    MIN_SCORE: 0,
    MAX_SCORE: 100,
    CATEGORIES: ['argumentation', 'delivery', 'rebuttal', 'structure']
  }
};

// Language Support
export const SUPPORTED_LANGUAGES = {
  en: 'English',
  hi: 'हिंदी',
  ta: 'தமிழ்',
  te: 'తెలుగు',
  kn: 'ಕನ್ನಡ',
  ml: 'മലയാളം',
  bn: 'বাংলা',
  gu: 'ગુજરાતી',
  mr: 'मराठी',
  pa: 'ਪੰਜਾਬੀ'
};

// User Levels
export const USER_LEVELS = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced'
};

// Topic Categories
export const TOPIC_CATEGORIES = {
  TECHNOLOGY: 'technology',
  ENVIRONMENT: 'environment',
  EDUCATION: 'education',
  POLITICS: 'politics',
  ECONOMICS: 'economics',
  SOCIAL: 'social',
  HEALTH: 'health',
  CULTURE: 'culture'
};

// Accessibility Features
export const ACCESSIBILITY_FEATURES = {
  SCREEN_READER: 'screen_reader',
  HIGH_CONTRAST: 'high_contrast',
  LARGE_TEXT: 'large_text',
  KEYBOARD_NAVIGATION: 'keyboard_navigation',
  VOICE_INPUT: 'voice_input',
  AUDIO_FEEDBACK: 'audio_feedback'
};

// Gamification
export const GAMIFICATION = {
  XP_PER_DEBATE: 100,
  XP_BONUS_STREAK: 50,
  LEVELS: {
    NOVICE: { min: 0, max: 500 },
    APPRENTICE: { min: 501, max: 1500 },
    SKILLED: { min: 1501, max: 3000 },
    EXPERT: { min: 3001, max: 6000 },
    MASTER: { min: 6001, max: 10000 },
    GRANDMASTER: { min: 10001, max: Infinity }
  },
  BADGES: {
    FIRST_DEBATE: 'first_debate',
    STREAK_7: 'seven_day_streak',
    PERFECT_SCORE: 'perfect_score',
    MULTILINGUAL: 'multilingual_debater',
    MENTOR: 'mentor'
  }
};

// Achievements
export const ACHIEVEMENTS = [
  {
    id: 'first_debate',
    name: 'First Steps',
    description: 'Complete your first debate',
    icon: '🎯',
    xpReward: 50,
    condition: (stats) => stats.debatesCompleted >= 1
  },
  {
    id: 'streak_master',
    name: 'Streak Master',
    description: 'Maintain a 7-day debate streak',
    icon: '🔥',
    xpReward: 200,
    condition: (stats) => stats.longestStreak >= 7
  },
  {
    id: 'perfect_score',
    name: 'Perfect Score',
    description: 'Achieve a perfect score in a debate',
    icon: '⭐',
    xpReward: 300,
    condition: (stats) => stats.perfectScores >= 1
  },
  {
    id: 'multilingual',
    name: 'Polyglot',
    description: 'Complete debates in 3 different languages',
    icon: '🌍',
    xpReward: 250,
    condition: (stats) => stats.languagesUsed >= 3
  },
  {
    id: 'level_up',
    name: 'Rising Star',
    description: 'Reach level 5',
    icon: '🌟',
    xpReward: 500,
    condition: (stats) => stats.level >= 5
  }
];

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  AUTH_ERROR: 'Authentication failed. Please log in again.',
  PERMISSION_ERROR: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  RATE_LIMIT: 'Too many requests. Please wait and try again.'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  DEBATE_SUBMITTED: 'Debate response submitted successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  SETTINGS_SAVED: 'Settings saved successfully!',
  FEEDBACK_SENT: 'Feedback sent successfully!'
};

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'debate_coach_token',
  USER_PREFERENCES: 'debate_coach_preferences',
  THEME: 'debate_coach_theme',
  LANGUAGE: 'debate_coach_language',
  ACCESSIBILITY: 'debate_coach_accessibility'
};

// Theme Configuration
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  HIGH_CONTRAST: 'high_contrast'
};

// Animation Durations (in milliseconds)
export const ANIMATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500
};

// File Upload
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['audio/wav', 'audio/mp3', 'audio/webm'],
  CHUNK_SIZE: 1024 * 1024 // 1MB chunks
};

export default {
  API_ENDPOINTS,
  APP_CONFIG,
  DEBATE_CONFIG,
  SUPPORTED_LANGUAGES,
  USER_LEVELS,
  TOPIC_CATEGORIES,
  ACCESSIBILITY_FEATURES,
  GAMIFICATION,
  ACHIEVEMENTS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  STORAGE_KEYS,
  THEMES,
  ANIMATIONS,
  FILE_UPLOAD
};