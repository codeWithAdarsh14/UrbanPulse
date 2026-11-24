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
/**
 * Checks the operational status of the UrbanPulse API.
 *
 * Retrieves the current MongoDB connection state and returns
 * server health information in JSON format.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 *
 * @returns {void} Sends an HTTP 200 JSON response containing:
 *   - status: API operational status.
 *   - message: Descriptive health-check message.
 *   - timestamp: Current server time in ISO 8601 format.
 *   - uptime: Server uptime in seconds.
 *   - database.status: Human-readable database connection state.
 *   - database.ready: Whether the database is connected.
 */
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
