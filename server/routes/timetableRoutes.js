const express = require('express');
const multer = require('multer');
const { verifyToken, restrictTo } = require('../middleware/authMiddleware');
const { getTimeTable, saveTimeTable } = require('../controllers/timetableController');
const { 
  getTimetableTemplate, 
  bulkUploadTimeTable, 
  getSectionsSummary 
} = require('../controllers/timetableBulkUploadController');

const router = express.Router();

// Multer in-memory storage for Excel/CSV parsing
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

router.use(verifyToken);

// GET /api/timetable/template (Admin/DEO only)
router.get('/template', restrictTo('admin', 'deo'), getTimetableTemplate);

// POST /api/timetable/bulk-upload (Admin/DEO only)
router.post(
  '/bulk-upload',
  restrictTo('admin', 'deo'),
  upload.single('file'),
  bulkUploadTimeTable
);

// GET /api/timetable/sections-summary (Department coverage overview)
router.get('/sections-summary', getSectionsSummary);

// GET /api/timetable
router.get('/', getTimeTable);

// PUT /api/timetable/:year/:section/:day
router.put(
  '/:year/:section/:day',
  restrictTo('admin', 'deo'),
  saveTimeTable
);

module.exports = router;
