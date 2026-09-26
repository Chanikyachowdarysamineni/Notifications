const express = require('express');
const { verifyToken, restrictTo } = require('../middleware/authMiddleware');
const { getSystemSettings, updateRegisterPageSetting } = require('../controllers/systemSettingsController');

const router = express.Router();

router.get('/', getSystemSettings);

router.put(
  '/register-page',
  verifyToken,
  restrictTo('admin'),
  updateRegisterPageSetting
);

module.exports = router;
