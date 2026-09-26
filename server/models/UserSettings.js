const mongoose = require('mongoose');

const userSettingsSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  notification_enabled: { type: Boolean, default: true },
  birthday_wish_enabled: { type: Boolean, default: true },
  reminder_enabled: { type: Boolean, default: true },
  calendar_connected: { type: Boolean, default: false },
  google_refresh_token: { type: String, default: null },
  view_preference: {
    type: String,
    enum: ['list', 'grid'],
    default: 'grid'
  },
  theme_preference: {
    type: String,
    enum: ['light', 'dark', 'system'],
    default: 'system'
  },
  accent_color: { type: String, default: null }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('UserSettings', userSettingsSchema);
