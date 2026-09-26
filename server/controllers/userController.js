const User = require('../models/User');
const UserSettings = require('../models/UserSettings');
const Year = require('../models/Year');
const Section = require('../models/Section');
const { validationResult } = require('express-validator');
const nodemailer = require('nodemailer');

const { ROLES } = require('../config/constants');
const { generateOTP, sendOTPEmail } = require('../services/otpService');
const { uploadFile } = require('../services/fileUploadService');

const sendWelcomeEmail = async (email, name, role) => {
  try {
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@csehub.com',
      to: email,
      subject: 'Welcome to CSE HUB',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Welcome ${name}!</h2>
          <p>Your account has been created on CSE HUB as a ${role}.</p>
          <p>Please log in using your registered email/registration number to set up your password via OTP verification.</p>
        </div>
      `,
    };

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await transporter.sendMail(mailOptions);
    } else {
      console.log(`[Mock Email] Sending Welcome email to ${email}`);
    }
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
};

const createUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { role } = req.body;
    let newUser = null;

    if (role === ROLES.STUDENT) {
      const { reg_no, name, cgpa, year, section, dob, mobile, email } = req.body;
      
      const regNoUpper = reg_no ? reg_no.toUpperCase() : undefined;
      const emailLower = email ? email.toLowerCase() : undefined;
      
      const existingUser = await User.findOne({ $or: [{ reg_no: regNoUpper }, { email: emailLower }] });
      if (existingUser) {
        return res.status(400).json({ message: 'Registration number or Email already exists' });
      }

      newUser = new User({
        role, name, reg_no: regNoUpper, cgpa, year, section, dob, mobile, email: emailLower,
        is_first_login: true
      });
    } else {
      const { employee_id, name, designation, email, dob, mobile, role: staffRole } = req.body;
      
      const employeeIdUpper = employee_id ? employee_id.toUpperCase() : undefined;
      const emailLower = email ? email.toLowerCase() : undefined;
      
      const existingUser = await User.findOne({ $or: [{ employee_id: employeeIdUpper }, { email: emailLower }] });
      if (existingUser) {
        return res.status(400).json({ message: 'Employee ID or Email already exists' });
      }

      newUser = new User({
        role: staffRole, name, employee_id: employeeIdUpper, designation, email: emailLower, dob, mobile,
        is_first_login: true
      });
    }

    await newUser.save();
    
    // Auto-create settings doc for the new user
    await UserSettings.create({ user_id: newUser._id });

    // Send welcome email
    if (newUser.email) {
      await sendWelcomeEmail(newUser.email, newUser.name, newUser.role);
    }

    res.status(201).json({
      message: 'User created successfully',
      identifier: newUser.role === 'student' ? newUser.reg_no : newUser.email
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/users/:userId
const getUserProfile = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    // Authorization: User can view themselves, Admin/DEO can view anyone
    if (req.user.userId !== userId && ![ROLES.ADMIN, ROLES.DEO].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findById(userId)
      .select('-password_hash -otp_code -otp_expires_at') // Exclude sensitive fields
      .populate('year', 'name')
      .populate('section', 'name');

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

// PATCH /api/users/:userId
const updateUserProfile = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const updates = req.body; // Diff payload
    
    // Authorization
    const isAdminOrDeo = [ROLES.ADMIN, ROLES.DEO].includes(req.user.role);
    if (req.user.userId !== userId && !isAdminOrDeo) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    let sanitizedUpdates = {};
    if (!isAdminOrDeo) {
      // Whitelist for self-service updates
      const allowedFields = ['name', 'mobile', 'dob', 'email'];
      allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
          sanitizedUpdates[field] = updates[field];
        }
      });
    } else {
      // Admin/DEO can update more fields
      sanitizedUpdates = { ...updates };
      
      // Validate CGPA if provided
      if (sanitizedUpdates.cgpa !== undefined) {
        const cgpaVal = Number(sanitizedUpdates.cgpa);
        if (isNaN(cgpaVal) || cgpaVal < 0 || cgpaVal > 10) {
          return res.status(400).json({ message: 'CGPA must be a number between 0.0 and 10.0' });
        }
      }
    }

    // Handle Email change logic
    if (sanitizedUpdates.email && sanitizedUpdates.email !== user.email) {
      // Uniqueness check
      const emailExists = await User.findOne({ email: sanitizedUpdates.email, _id: { $ne: userId } });
      if (emailExists) return res.status(400).json({ message: 'Email already in use' });

      // Generate OTP and pending state
      const otp = generateOTP();
      user.pending_email = sanitizedUpdates.email;
      user.pending_email_otp = otp;
      user.pending_email_otp_expires_at = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
      
      // Don't apply the email yet, but send OTP
      await sendOTPEmail(sanitizedUpdates.email, otp);
      
      // Remove email from direct updates so it doesn't get saved prematurely
      delete sanitizedUpdates.email;
    }

    // Apply remaining updates
    Object.keys(sanitizedUpdates).forEach(key => {
      user[key] = sanitizedUpdates[key];
    });

    await user.save();
    
    const responseData = { message: 'Profile updated successfully', user };
    if (user.pending_email) {
      responseData.pending_verification = true;
      responseData.message = 'OTP sent to new email for verification';
    }

    res.status(200).json(responseData);
  } catch (error) {
    next(error);
  }
};

// POST /api/users/:userId/verify-email
const verifyEmailChange = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { otp } = req.body;

    if (req.user.userId !== userId && !['admin', 'deo'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.pending_email || user.pending_email_otp !== otp || new Date() > user.pending_email_otp_expires_at) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Apply the email
    user.email = user.pending_email;
    user.pending_email = null;
    user.pending_email_otp = null;
    user.pending_email_otp_expires_at = null;
    
    await user.save();
    res.status(200).json({ message: 'Email updated successfully', email: user.email });
  } catch (error) {
    next(error);
  }
};

// POST /api/users/:userId/avatar
const uploadAvatar = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (req.user.userId !== userId && !['admin', 'deo'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Ensure it's an image
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ message: 'Only images are allowed' });
    }

    const profile_image_url = await uploadFile(req.file);
    user.profile_image_url = profile_image_url;
    await user.save();

    res.status(200).json({ message: 'Avatar updated successfully', profile_image_url });
  } catch (error) {
    next(error);
  }
};

// POST /api/users/fcm-token
const saveFcmToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'Token is required' });

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.device_tokens) user.device_tokens = [];
    if (!user.device_tokens.includes(token)) {
      user.device_tokens.push(token);
      await user.save();
    }

    res.status(200).json({ message: 'FCM token saved successfully' });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/users/:userId/revoke-sessions
const revokeUserSessions = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const RefreshToken = require('../models/RefreshToken');
    
    // Revoke all tokens for the specific user
    await RefreshToken.updateMany({ user_id: userId }, { revoked: true });
    
    res.status(200).json({ message: 'All sessions for this user have been revoked.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { 
  createUser, 
  getUserProfile, 
  updateUserProfile, 
  verifyEmailChange, 
  uploadAvatar,
  saveFcmToken,
  revokeUserSessions
};
