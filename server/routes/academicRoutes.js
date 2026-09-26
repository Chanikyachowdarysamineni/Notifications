const express = require('express');
const { verifyToken, restrictTo } = require('../middleware/authMiddleware');
const {
  getYears, createYear, updateYear, deleteYear,
  getSections, createSection, updateSection, deleteSection
} = require('../controllers/academicController');

const router = express.Router();

// Public routes (migrated from userRoutes to prevent route collisions)
router.get('/years', getYears);
router.get('/sections', getSections);

// Admin/DEO only middleware for write operations
const adminOnly = [verifyToken, restrictTo('admin', 'deo')];

router.post('/years', adminOnly, createYear);
router.patch('/years/:id', adminOnly, updateYear);
router.delete('/years/:id', adminOnly, deleteYear);

router.post('/sections', adminOnly, createSection);
router.patch('/sections/:id', adminOnly, updateSection);
router.delete('/sections/:id', adminOnly, deleteSection);

module.exports = router;
