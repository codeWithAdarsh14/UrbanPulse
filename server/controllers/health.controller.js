/**
 * Health check controller
 * Confirms that the API server is operational and reports DB connection status.
 */
const mongoose = require('mongoose');

// Mongoose readyState → human-readable label
const DB_STATES = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
  99: 'uninitialized'
};

const getHealth = (req, res) => {
  const dbState = mongoose.connection.readyState;

  res.status(200).json({
    status: 'ok',
    message: 'UrbanPulse API is operational',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      status: DB_STATES[dbState] ?? 'unknown',
      ready: dbState === 1
    }
  });
};

module.exports = {
  getHealth
};
