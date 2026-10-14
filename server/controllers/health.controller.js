/**
 * Health check controller
 * Confirms that the API server is operational
 */
const getHealth = (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'UrbanPulse API is operational',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
};

module.exports = {
  getHealth
};
