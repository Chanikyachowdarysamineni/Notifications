const express = require('express');
const multer = require('multer');
const { verifyToken, restrictTo } = require('../middleware/authMiddleware');
const {
  createAnnouncement,
  getAnnouncements,
  updateAnnouncement,
  deleteAnnouncement
} = require('../controllers/announcementController');

const router = express.Router();

// Multer config for in-memory buffer (to be handled by Cloudinary/Supabase)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

router.use(verifyToken);

// GET feed
router.get('/', getAnnouncements);

// POST create
router.post(
  '/',
  restrictTo('admin', 'deo', 'faculty'),
  upload.single('attachment'),
  createAnnouncement
);

// PUT update
router.put(
  '/:id',
  restrictTo('admin', 'deo', 'faculty'),
  upload.single('attachment'),
  updateAnnouncement
);

// DELETE
router.delete(
  '/:id',
  restrictTo('admin', 'deo', 'faculty'),
  deleteAnnouncement
);

module.exports = router;
