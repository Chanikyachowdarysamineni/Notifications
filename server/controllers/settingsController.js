const UserSettings = require('../models/UserSettings');

const getSettingsMe = async (req, res) => {
  try {
    const userId = req.user.userId;

    const settings = await UserSettings.findOneAndUpdate(
      { user_id: userId },
      { $setOnInsert: { user_id: userId } },
      { returnDocument: 'after', upsert: true }
    ).select('-google_refresh_token');

    res.status(200).json(settings);
  } catch (error) {
    console.error('Settings fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateSettingsMe = async (req, res) => {
  try {
    const userId = req.user.userId;

    const allowedFields = [
      'notification_enabled',
      'birthday_wish_enabled',
      'reminder_enabled',
      'view_preference',
      'theme_preference',
      'accent_color'
    ];

    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const settings = await UserSettings.findOneAndUpdate(
      { user_id: userId },
      { $set: updates },
      { returnDocument: 'after', upsert: true }
    ).select('-google_refresh_token');

    res.status(200).json({ message: 'Settings updated successfully', settings });
  } catch (error) {
    console.error('Settings update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getSettingsForUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const settings = await UserSettings.findOne({ user_id: userId }).select('-google_refresh_token');
    
    if (!settings) {
      return res.status(404).json({ message: 'Settings not found for this user' });
    }

    res.status(200).json(settings);
  } catch (error) {
    console.error('Settings fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getSettingsMe, updateSettingsMe, getSettingsForUser };
