/**
 * Server Entry Point
 * Initializes and starts the Debate Coach AI server
 */

require('dotenv').config();

const { startServer } = require('./app');

// Start the server
if (require.main === module) {
  startServer().catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}
