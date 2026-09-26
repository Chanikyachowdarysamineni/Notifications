const express = require('express');
const router = express.Router();
const { getStudentById, updateStudent } = require('../controllers/studentController');
const { verifyToken, restrictTo } = require('../middleware/authMiddleware');
const { ROLES } = require('../config/constants');

// GET student details with context
router.get('/:studentId', verifyToken, restrictTo(ROLES.ADMIN, ROLES.DEO, ROLES.FACULTY), getStudentById);

// PATCH student details (Admin and DEO only)
router.patch('/:studentId', verifyToken, restrictTo(ROLES.ADMIN, ROLES.DEO), updateStudent);

module.exports = router;
