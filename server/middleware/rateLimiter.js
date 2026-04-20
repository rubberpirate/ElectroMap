const rateLimit = require('express-rate-limit');

const makeLimiterMessage = (message) => ({
  success: false,
  message,
  data: null,
  errors: null,
  timestamp: new Date().toISOString(),
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: makeLimiterMessage('Too many requests, please try again later.'),
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: makeLimiterMessage('Too many authentication attempts, please try again later.'),
});

module.exports = {
  generalLimiter,
  authLimiter,
};
