const { google } = require('googleapis');
const User = require('../models/User');
const UserSettings = require('../models/UserSettings');
const Event = require('../models/Event');

/**
 * The redirect URI MUST be registered exactly in Google Cloud Console:
 * Authorized redirect URI: http://localhost:5000/api/calendar/oauth-callback
 * (or your production backend URL in production)
 */
const getOAuth2Client = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/calendar/oauth-callback`
  );
};

// GET /api/calendar/auth-url
const getAuthUrl = (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(503).json({ message: 'Google Calendar integration is not configured' });
  }

  const oauth2Client = getOAuth2Client();
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.events'],
    prompt: 'consent',
    // Pass user ID in state so we know who to save the token for after redirect
    state: req.user.userId
  });
  res.status(200).json({ url });
};

/**
 * Google redirects HERE (backend) with ?code=...&state=userId
 * We exchange the code for tokens, save to DB, then redirect to frontend.
 * This is the CORRECT OAuth flow — secrets never touch the frontend.
 */
const oauthCallback = async (req, res) => {
  try {
    const { code, state: userId } = req.query;

    if (!code || !userId) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/calendar?error=auth_failed`);
    }

    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    // Save refresh token to the UserSettings identified by state param
    await UserSettings.findOneAndUpdate(
      { user_id: userId },
      {
        google_refresh_token: tokens.refresh_token,
        calendar_connected: true
      },
      { upsert: true }
    );

    // Redirect back to frontend success page
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/calendar?success=true`);
  } catch (error) {
    console.error('OAuth Error:', error.message);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/calendar?error=auth_failed`);
  }
};

// DELETE /api/calendar/disconnect
const disconnectCalendar = async (req, res, next) => {
  try {
    const settings = await UserSettings.findOne({ user_id: req.user.userId });

    if (settings && settings.google_refresh_token) {
      const oauth2Client = getOAuth2Client();
      try {
        await oauth2Client.revokeToken(settings.google_refresh_token);
      } catch (e) {
        // Ignore if already revoked by the user in Google settings
      }
    }

    if (settings) {
      settings.google_refresh_token = null;
      settings.calendar_connected = false;
      await settings.save();
    }

    res.status(200).json({ message: 'Calendar disconnected' });
  } catch (error) {
    next(error);
  }
};

// POST /api/calendar/sync-event/:eventId
const syncEvent = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const settings = await UserSettings.findOne({ user_id: req.user.userId });

    if (!settings || !settings.calendar_connected || !settings.google_refresh_token) {
      return res.status(400).json({ message: 'Google Calendar not connected. Please connect first.' });
    }

    const dbEvent = await Event.findById(eventId);
    if (!dbEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ refresh_token: settings.google_refresh_token });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const startDate = new Date(dbEvent.event_date);
    const endDate = new Date(startDate.getTime() + (2 * 60 * 60 * 1000)); // +2 hours

    await calendar.events.insert({
      calendarId: 'primary',
      resource: {
        summary: dbEvent.title,
        description: dbEvent.description + (dbEvent.link ? `\nLink: ${dbEvent.link}` : ''),
        start: { dateTime: startDate.toISOString(), timeZone: 'Asia/Kolkata' },
        end: { dateTime: endDate.toISOString(), timeZone: 'Asia/Kolkata' },
      }
    });

    res.status(200).json({ message: 'Event synced to Google Calendar' });
  } catch (error) {
    console.error('Calendar sync error:', error.message);
    next(error);
  }
};

module.exports = { getAuthUrl, oauthCallback, disconnectCalendar, syncEvent };
