const express = require('express');
const { 
  login, verifyOtp, resendOtp, forgotPassword, resetPassword, registerUser, 
  refresh, logout, logoutAllDevices 
} = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');
const { loginLimiter, otpVerifyLimiter, forgotPasswordLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

router.post('/login', loginLimiter, login);
router.post('/register', registerUser); // Should be restricted ideally, but kept as is based on existing logic
router.post('/verify-otp', otpVerifyLimiter, verifyOtp);
router.post('/resend-otp', otpVerifyLimiter, resendOtp);
router.post('/forgot-password', forgotPasswordLimiter, forgotPassword);
router.post('/reset-password', forgotPasswordLimiter, resetPassword);

// New JWT Flow routes
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/logout-all-devices', verifyToken, logoutAllDevices);

module.exports = router;
