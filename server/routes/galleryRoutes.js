const express = require('express');
const multer = require('multer');
const { verifyToken, restrictTo } = require('../middleware/authMiddleware');
const {
  uploadPhoto,
  updatePhoto,
  getGallery,
  toggleLike,
  deletePhoto
} = require('../controllers/galleryController');

const router = express.Router();

// Filter for images only (.png, .jpg, .jpeg, .webp)
const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  if (allowed.includes(file.mimetype) || file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (.png, .jpg, .jpeg, .webp) are allowed'), false);
  }
};

const storage = multer.memoryStorage();
const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB per image
});

router.use(verifyToken);

// GET feed (All authenticated roles)
router.get('/', getGallery);

// POST upload (Admin, DEO, Faculty - up to 10 images at once)
router.post(
  '/',
  restrictTo('admin', 'deo', 'faculty'),
  upload.array('images', 10),
  uploadPhoto
);

// PATCH edit photo description (Admin, DEO, Faculty)
router.patch(
  '/:id',
  restrictTo('admin', 'deo', 'faculty'),
  updatePhoto
);

// DELETE photo (Admin, DEO, Faculty)
router.delete(
  '/:id',
  restrictTo('admin', 'deo', 'faculty'),
  deletePhoto
);

// POST toggle like (Student ONLY)
router.post(
  '/:id/like',
  restrictTo('student'),
  toggleLike
);

module.exports = router;
