/**
 * Authentication Routes Reference
 * Mounts under /api/auth in Express.
 */
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimiter.middleware');

// POST /api/auth/register (rate-limited)
router.post('/register', registerLimiter, authController.register);

// POST /api/auth/login (rate-limited)
router.post('/login', loginLimiter, authController.login);

// GET /api/auth/me (authenticated)
router.get('/me', protect, authController.getMe);

// POST /api/auth/logout
router.post('/logout', authController.logout);

module.exports = router;
