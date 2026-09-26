const express = require('express');
const { check } = require('express-validator');
const multer = require('multer');
const { 
  createUser, 
  getUserProfile,
  updateUserProfile,
  verifyEmailChange,
  uploadAvatar,
  saveFcmToken,
  revokeUserSessions
} = require('../controllers/userController');
const { verifyToken, restrictTo } = require('../middleware/authMiddleware');
const { ROLES, CONFIG } = require('../config/constants');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ 
  storage, 
  limits: { fileSize: CONFIG.FILE_SIZE_LIMIT_MB * 1024 * 1024 } 
});

// Validation for user creation
const createUserValidation = [
  check('role').isIn(Object.values(ROLES)).withMessage('Invalid role'),
  check('name').notEmpty().withMessage('Full Name is required'),
  check('email').isEmail().withMessage('Valid email is required'),
  check('dob').isISO8601().toDate().withMessage('Date of birth is required and must be a valid date'),
  check('mobile').isLength({ min: 10, max: 10 }).withMessage('Mobile number must be 10 digits'),
  
  // Conditionally validate student fields
  check('reg_no').if((value, { req }) => req.body.role === ROLES.STUDENT).notEmpty().withMessage('Registration number is required for students'),
  check('year').if((value, { req }) => req.body.role === ROLES.STUDENT).notEmpty().withMessage('Year is required for students'),
  check('section').if((value, { req }) => req.body.role === ROLES.STUDENT).notEmpty().withMessage('Section is required for students'),

  // Conditionally validate staff fields
  check('employee_id').if((value, { req }) => req.body.role !== ROLES.STUDENT).notEmpty().withMessage('Employee ID is required for staff'),
  check('designation').if((value, { req }) => req.body.role !== ROLES.STUDENT).notEmpty().withMessage('Designation is required for staff'),
];

// POST /api/users - Create User (Admin and DEO only)
router.post(
  '/',
  verifyToken,
  restrictTo(ROLES.ADMIN, ROLES.DEO),
  createUserValidation,
  createUser
);

// Removed /years and /sections mounts

// Profile endpoints
router.get('/:userId', verifyToken, getUserProfile);
router.patch('/:userId', verifyToken, updateUserProfile);
router.post('/:userId/verify-email', verifyToken, verifyEmailChange);
router.post('/fcm-token', verifyToken, saveFcmToken);
router.post('/:userId/avatar', verifyToken, upload.single('avatar'), uploadAvatar);

// Admin route to revoke sessions for a specific user
router.post('/:userId/revoke-sessions', verifyToken, restrictTo(ROLES.ADMIN), revokeUserSessions);

module.exports = router;
