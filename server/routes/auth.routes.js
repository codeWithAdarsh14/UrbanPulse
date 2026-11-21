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

// GET /api/auth/profile (authenticated alias)
router.get('/profile', protect, authController.getMe);

// PUT /api/auth/profile (authenticated)
router.put('/profile', protect, authController.updateProfile);

// POST /api/auth/logout
router.post('/logout', authController.logout);

module.exports = router;
