const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const RefreshToken = require('../models/RefreshToken');
const { generateOTP, sendOTPEmail, sendResetPasswordEmail } = require('../services/otpService');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
const ACCESS_EXPIRES_IN = '15m';
const REFRESH_EXPIRES_IN = '3650d';

// Generate Token & Set Cookie
const issueTokenAndCookie = async (res, user, req) => {
  const token = jwt.sign(
    { userId: user._id, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  );

  const tokenId = uuidv4();
  const refreshToken = jwt.sign(
    { userId: user._id, tokenId },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN }
  );

  await RefreshToken.create({
    user_id: user._id,
    token_id: tokenId,
    expires_at: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000), // 10 years
    device_info: req ? (req.headers['user-agent'] || 'Unknown Device') : 'Unknown Device'
  });

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000 // 15 mins
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth/refresh', // Restrict to refresh endpoint for added security
    maxAge: 10 * 365 * 24 * 60 * 60 * 1000 // 10 years
  });

  return token;
};

// @route POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Identifier and password are required' });
    }

    const cleanIdentifier = identifier.trim();
    // Determine if identifier is an email or reg_no
    const isEmail = cleanIdentifier.includes('@');
    const query = isEmail 
      ? { email: cleanIdentifier.toLowerCase() } 
      : { $or: [{ reg_no: cleanIdentifier.toUpperCase() }, { employee_id: cleanIdentifier.toUpperCase() }] };

    const user = await User.findOne(query);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    let isMatch = false;
    if (user.role === 'student') {
      isMatch = (user.mobile === password);
    } else {
      if (user.password_hash) {
        isMatch = await bcrypt.compare(password, user.password_hash);
      } else {
        // Fallback for newly created staff who don't have a password yet
        isMatch = (user.mobile === password);
      }
    }
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // First time login flow
    if (user.is_first_login) {
      const otp = generateOTP();
      user.otp_code = otp;
      user.otp_expires_at = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
      await user.save();

      if (user.email) {
        await sendOTPEmail(user.email, otp);
      }

      return res.status(200).json({
        message: 'OTP sent for first-time login',
        requires_otp: true,
        email: user.email ? user.email.replace(/(.{2})(.*)(?=@)/, (gp1, gp2, gp3) => gp2 + '*'.repeat(gp3.length)) : null,
        userId: user._id
      });
    }

    await issueTokenAndCookie(res, user, req);
    res.status(200).json({
      message: 'Login successful',
      user: { userId: user._id, name: user.name, role: user.role }
    });

  } catch (error) {
    next(error);
  }
};

// @route POST /api/auth/verify-otp
const verifyOtp = async (req, res, next) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({ message: 'User ID and OTP are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.otp_code !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (new Date() > user.otp_expires_at) {
      return res.status(400).json({ message: 'OTP expired' });
    }

    // Mark used
    user.otp_code = null;
    user.otp_expires_at = null;
    user.is_first_login = false;
    await user.save();

    await issueTokenAndCookie(res, user, req);
    res.status(200).json({
      message: 'OTP verified, login successful',
      user: { userId: user._id, name: user.name, role: user.role }
    });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/auth/resend-otp
const resendOtp = async (req, res, next) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const otp = generateOTP();
    user.otp_code = otp;
    user.otp_expires_at = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    await user.save();

    if (user.email) {
      await sendOTPEmail(user.email, otp);
    }

    res.status(200).json({ message: 'OTP resent successfully' });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/auth/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    const { identifier } = req.body;
    if (!identifier) {
      return res.status(400).json({ message: 'Identifier is required' });
    }

    const cleanIdentifier = identifier.trim();
    const isEmail = cleanIdentifier.includes('@');
    const query = isEmail 
      ? { email: cleanIdentifier.toLowerCase() } 
      : { $or: [{ reg_no: cleanIdentifier.toUpperCase() }, { employee_id: cleanIdentifier.toUpperCase() }] };

    const user = await User.findOne(query);
    if (!user) {
      // Return 200 with fake masked email if not found to prevent user enumeration
      const fakeEmail = identifier.includes('@') ? identifier : 'user@example.com';
      const maskedEmail = fakeEmail.replace(/(.{2})(.*)(?=@)/, (gp1, gp2, gp3) => gp2 + '*'.repeat(gp3.length));
      return res.status(200).json({ 
        message: 'If the user exists, a reset link has been sent.',
        email: maskedEmail
      });
    }
    // Generate OTP for reset
    const otp = generateOTP();
    user.otp_code = otp;
    user.otp_expires_at = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    await user.save();

    if (user.email) {
      await sendOTPEmail(user.email, otp);
    }

    res.status(200).json({ 
      message: 'If the user exists, an OTP has been sent.',
      userId: user._id,
      email: user.email ? user.email.replace(/(.{2})(.*)(?=@)/, (gp1, gp2, gp3) => gp2 + '*'.repeat(gp3.length)) : null
    });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/auth/reset-password
const resetPassword = async (req, res, next) => {
  try {
    const { userId, otp, newPassword } = req.body;

    if (!userId || !otp || !newPassword) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const user = await User.findById(userId);

    if (!user || user.otp_code !== otp || new Date() > user.otp_expires_at) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password_hash = await bcrypt.hash(newPassword, salt);
    
    // Clear OTP
    user.otp_code = null;
    user.otp_expires_at = null;
    user.is_first_login = false; // ensure they can login now
    await user.save();

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/auth/register
const registerUser = async (req, res, next) => {
  try {
    const SystemSettings = require('../models/SystemSettings');
    const settings = await SystemSettings.findOne({ setting_id: 'singleton' });
    if (settings && settings.register_page_enabled === false) {
      return res.status(403).json({ message: 'Registration is currently disabled by the administrator' });
    }

    const { role } = req.body;
    if (role !== 'student') {
      return res.status(400).json({ message: 'You can only register as a student' });
    }

    const { reg_no, employee_id, name, email, mobile, dob, year, section, designation } = req.body;
    const UserSettings = require('../models/UserSettings');
    
    let newUser = null;

    if (role === 'student') {
      const regNoUpper = reg_no ? reg_no.toUpperCase() : undefined;
      const emailLower = email ? email.toLowerCase() : undefined;
      const existingUser = await User.findOne({ $or: [{ reg_no: regNoUpper }, { email: emailLower }] });
      if (existingUser) return res.status(400).json({ message: 'Registration number or Email already exists' });
      
      newUser = new User({ role, name, reg_no: regNoUpper, year, section, dob, mobile, email: emailLower, is_first_login: true });
    } else {
      const emailLower = email ? email.toLowerCase() : undefined;
      const existingUser = await User.findOne({ $or: [{ employee_id }, { email: emailLower }] });
      if (existingUser) return res.status(400).json({ message: 'Employee ID or Email already exists' });

      newUser = new User({ role, name, employee_id, designation, email: emailLower, dob, mobile, is_first_login: true });
    }

    await newUser.save();
    await UserSettings.create({ user_id: newUser._id });

    res.status(201).json({
      message: 'Registration successful. You can now login.',
      identifier: newUser.role === 'student' ? newUser.reg_no : newUser.email
    });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/auth/refresh
const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return res.status(401).json({ message: 'No refresh token provided' });
    }

    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const activeToken = await RefreshToken.findOne({ token_id: decoded.tokenId });

    if (!activeToken || activeToken.revoked) {
      // Token reuse detection or revoked token
      if (activeToken && activeToken.revoked) {
        // Suspected theft: revoke ALL tokens for user
        await RefreshToken.updateMany({ user_id: decoded.userId }, { revoked: true });
      }
      res.clearCookie('token');
      res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
      return res.status(401).json({ message: 'Session expired or invalid' });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    // Revoke old refresh token (rotation)
    activeToken.revoked = true;
    await activeToken.save();

    await issueTokenAndCookie(res, user, req);
    res.status(200).json({ message: 'Token refreshed' });
  } catch (error) {
    res.clearCookie('token');
    res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Refresh token expired' });
    }
    next(error);
  }
};

// @route POST /api/auth/logout
const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;
    if (refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
        await RefreshToken.findOneAndUpdate({ token_id: decoded.tokenId }, { revoked: true });
      } catch (err) {
        // Ignore JWT verification errors on logout
      }
    }
    res.clearCookie('token');
    res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/auth/logout-all-devices
const logoutAllDevices = async (req, res, next) => {
  try {
    // Requires authenticated user
    const userId = req.user.userId;
    await RefreshToken.updateMany({ user_id: userId }, { revoked: true });
    
    res.clearCookie('token');
    res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
    res.status(200).json({ message: 'Logged out of all devices successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { login, verifyOtp, resendOtp, forgotPassword, resetPassword, registerUser, refresh, logout, logoutAllDevices };
