const rateLimit = require('express-rate-limit');

// Placeholder for future Redis integration.
// To use Redis:
// const { RedisStore } = require('rate-limit-redis');
// const Redis = require('ioredis');
// const redisClient = new Redis(process.env.REDIS_URL);
// const store = new RedisStore({ sendCommand: (...args) => redisClient.call(...args) });
const store = undefined; // Uses built-in MemoryStore by default

// Custom handler for returning 429 errors in JSON format
const handler = (req, res, next, options) => {
  res.status(429).json({
    success: false,
    message: options.message || "Too many requests, please try again later",
    errorCode: 'TOO_MANY_REQUESTS'
  });
};

// 1. AUTH endpoints (Strictest)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  keyGenerator: (req) => {
    const identifier = req.body.email || req.body.mobile || 'unknown';
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    return `${ip}_${identifier}`;
  },
  handler,
  message: "Too many login attempts. Please try again in 15 minutes.",
  store,
  validate: { xForwardedForHeader: false, default: false }
});

const otpVerifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  keyGenerator: (req) => {
    const identifier = req.body.email || req.body.mobile || 'unknown';
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    return `${ip}_${identifier}`;
  },
  handler,
  message: "Too many verification attempts. Please request a new OTP in 10 minutes.",
  store,
  validate: { xForwardedForHeader: false, default: false }
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  keyGenerator: (req) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    return `${ip}_${req.body.email || 'unknown'}`;
  },
  handler,
  message: "Too many password reset requests. Please try again in an hour.",
  store,
  validate: { xForwardedForHeader: false, default: false }
});

// 2. WRITE endpoints (Moderate)
const writeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  keyGenerator: (req) => {
    return req.user ? req.user.id : (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown');
  },
  handler,
  message: "Slow down a bit. Too many write requests.",
  store,
  validate: { xForwardedForHeader: false, default: false }
});

// File upload endpoints (Tighter limit)
const uploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10,
  keyGenerator: (req) => {
    return req.user ? req.user.id : (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown');
  },
  handler,
  message: "Upload limit reached. Please wait a few minutes before uploading more files.",
  store,
  validate: { xForwardedForHeader: false, default: false }
});

// 3. READ endpoints (Generous)
const readLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300,
  keyGenerator: (req) => {
    return req.user ? req.user.id : (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown');
  },
  handler,
  message: "Rate limit exceeded for read requests. Slow down.",
  store,
  validate: { xForwardedForHeader: false, default: false }
});

// 4. GLOBAL fallback limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  handler,
  message: "Too many requests from this IP, please try again after 15 minutes.",
  store,
  validate: { xForwardedForHeader: false, default: false }
});

module.exports = {
  loginLimiter,
  otpVerifyLimiter,
  forgotPasswordLimiter,
  writeLimiter,
  uploadLimiter,
  readLimiter,
  globalLimiter
};
