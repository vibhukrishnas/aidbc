const config = require('../config/environment');

/**
 * Request Logger Middleware
 * Logs all incoming requests with timestamp and response time
 */

const logger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const statusColor = status >= 400 ? '\x1b[31m' : status >= 300 ? '\x1b[33m' : '\x1b[32m';
    
    console.log(
      `${new Date().toISOString()} - ${req.method} ${req.originalUrl} - ` +
      `${statusColor}${status}\x1b[0m - ${duration}ms`
    );
  });
  
  next();
};

module.exports = logger;