// Debate validation
export const validateDebateResponse = (response) => {
  const errors = [];
  
  if (!response || response.trim().length === 0) {
    errors.push('Response cannot be empty');
  }
  
  if (response.trim().length < 50) {
    errors.push('Response must be at least 50 characters');
  }
  
  if (response.length > 2000) {
    errors.push('Response cannot exceed 2000 characters');
  }
  
  // Check for basic structure
  const sentences = response.split(/[.!?]+/).filter(s => s.trim());
  if (sentences.length < 3) {
    errors.push('Try to include at least 3 complete sentences');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// User input validation
export const validateUsername = (username) => {
  const errors = [];
  
  if (!username || username.trim().length === 0) {
    errors.push('Username is required');
  }
  
  if (username.length < 3) {
    errors.push('Username must be at least 3 characters');
  }
  
  if (username.length > 20) {
    errors.push('Username cannot exceed 20 characters');
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    errors.push('Username can only contain letters, numbers, hyphens, and underscores');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateEmail = (email) => {
  const errors = [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email || email.trim().length === 0) {
    errors.push('Email is required');
  }
  
  if (!emailRegex.test(email)) {
    errors.push('Please enter a valid email address');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validatePassword = (password) => {
  const errors = [];
  
  if (!password || password.length === 0) {
    errors.push('Password is required');
  }
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Topic validation
export const validateTopic = (topic) => {
  const errors = [];
  
  if (!topic.title || topic.title.trim().length === 0) {
    errors.push('Topic title is required');
  }
  
  if (topic.title && topic.title.length > 100) {
    errors.push('Topic title cannot exceed 100 characters');
  }
  
  if (!topic.description || topic.description.trim().length === 0) {
    errors.push('Topic description is required');
  }
  
  if (topic.description && topic.description.length > 500) {
    errors.push('Topic description cannot exceed 500 characters');
  }
  
  const validDifficulties = ['beginner', 'intermediate', 'advanced'];
  if (!validDifficulties.includes(topic.difficulty)) {
    errors.push('Invalid difficulty level');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Score validation
export const validateScore = (score, category) => {
  if (typeof score !== 'number') {
    return { isValid: false, error: 'Score must be a number' };
  }
  
  if (score < 0 || score > 100) {
    return { isValid: false, error: 'Score must be between 0 and 100' };
  }
  
  return { isValid: true };
};

// Language validation
export const validateLanguageCode = (code) => {
  const validCodes = ['en', 'hi', 'ta', 'te', 'kn', 'ml', 'bn', 'gu', 'mr', 'pa'];
  return validCodes.includes(code);
};

// File validation (for future audio uploads)
export const validateAudioFile = (file) => {
  const errors = [];
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['audio/webm', 'audio/mp3', 'audio/wav', 'audio/ogg'];
  
  if (!file) {
    errors.push('No file selected');
  }
  
  if (file && file.size > maxSize) {
    errors.push('File size cannot exceed 10MB');
  }
  
  if (file && !allowedTypes.includes(file.type)) {
    errors.push('Invalid file type. Please upload an audio file');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Sanitization helpers
export const sanitizeInput = (input) => {
  // Remove any potential XSS attempts
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
};

export const sanitizeHtml = (html) => {
  // For rich text content - allow only safe tags
  const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'h3', 'h4', 'ul', 'ol', 'li'];
  const allowedAttributes = [];
  
  // This is a simple implementation - consider using DOMPurify in production
  let cleaned = html;
  
  // Remove all tags except allowed ones
  const tagRegex = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
  cleaned = cleaned.replace(tagRegex, (match, tag) => {
    if (allowedTags.includes(tag.toLowerCase())) {
      return match;
    }
    return '';
  });
  
  return cleaned;
};
