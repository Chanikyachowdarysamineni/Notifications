const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const {
  getAuthUrl,
  oauthCallback,
  disconnectCalendar,
  syncEvent
} = require('../controllers/calendarController');

const router = express.Router();

// Auth URL — requires login to get user's ID for the OAuth state param
router.get('/auth-url', verifyToken, getAuthUrl);

// OAuth Callback from Google — must be PUBLIC (Google redirects here, no cookie)
router.get('/oauth-callback', oauthCallback);

// All other calendar routes require auth
router.delete('/disconnect', verifyToken, disconnectCalendar);
router.post('/sync-event/:eventId', verifyToken, syncEvent);

module.exports = router;
