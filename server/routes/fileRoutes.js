const express = require('express');
const multer = require('multer');
const { verifyToken, restrictTo } = require('../middleware/authMiddleware');
const {
  createFileResource,
  getFiles,
  updateFileResource,
  deleteFileResource
} = require('../controllers/fileController');

const router = express.Router();

// Multer config for in-memory buffer, max 50MB
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

router.use(verifyToken);

// GET feed
router.get('/', getFiles);

// POST create
router.post(
  '/',
  restrictTo('admin', 'deo', 'faculty'),
  upload.single('file'), // Form field should be named 'file'
  createFileResource
);

// PUT update
router.put(
  '/:id',
  restrictTo('admin', 'deo', 'faculty'),
  upload.single('file'),
  updateFileResource
);

// DELETE
router.delete(
  '/:id',
  restrictTo('admin', 'deo', 'faculty'),
  deleteFileResource
);

module.exports = router;
