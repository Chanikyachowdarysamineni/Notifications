const express = require('express');
const { getSettingsMe, updateSettingsMe, getSettingsForUser } = require('../controllers/settingsController');
const { verifyToken, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(verifyToken);

router.get('/me', getSettingsMe);
router.patch('/me', updateSettingsMe);

router.get('/:userId', restrictTo('admin', 'deo'), getSettingsForUser);

module.exports = router;
