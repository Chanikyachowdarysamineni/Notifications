const express = require('express');
const { verifyToken, restrictTo } = require('../middleware/authMiddleware');
const { getNotificationLogs } = require('../controllers/notificationLogController');

const router = express.Router();

// Admin/DEO only
router.use(verifyToken);
router.use(restrictTo('admin', 'deo'));

router.get('/', getNotificationLogs);

module.exports = router;
