/**
 * Rate Limiting Middleware Reference
 * Protects login, registration, and general API endpoints from automated attacks and credential stuffing.
 */
const rateLimit = require('express-rate-limit');

// Login Rate Limiter: Max 5 requests per IP within 15 minutes
exports.loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true, // Return RateLimit-* headers
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many login attempts from this IP address. Please try again after 15 minutes.',
  },
  skipSuccessfulRequests: false, // Throttles repeat failed requests
});

// Registration Rate Limiter: Max 5 registrations per IP within 15 minutes
exports.registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many account creation attempts. Please try again after 15 minutes.',
  },
});

// General API Rate Limiter
exports.generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many requests. Please slow down.',
  },
});
