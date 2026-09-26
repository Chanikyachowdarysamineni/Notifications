const express = require('express');
const multer = require('multer');
const { verifyToken, restrictTo } = require('../middleware/authMiddleware');
const {
  createEvent,
  getEvents,
  registerForEvent,
  getEventRegistrations,
  updateEvent,
  deleteEvent
} = require('../controllers/eventController');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, 
});

router.use(verifyToken);

// GET feed
router.get('/', getEvents);

// POST create
router.post(
  '/',
  restrictTo('admin', 'deo', 'faculty'),
  upload.single('attachment'),
  createEvent
);

// POST register
router.post(
  '/:eventId/register',
  restrictTo('student'),
  registerForEvent
);

// GET registrations
router.get(
  '/:eventId/registrations',
  restrictTo('admin', 'deo', 'faculty'),
  getEventRegistrations
);

// PUT update
router.put(
  '/:id',
  restrictTo('admin', 'deo', 'faculty'),
  upload.single('attachment'),
  updateEvent
);

// DELETE
router.delete(
  '/:id',
  restrictTo('admin', 'deo', 'faculty'),
  deleteEvent
);

module.exports = router;
