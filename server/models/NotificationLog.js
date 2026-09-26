const mongoose = require('mongoose');

const notificationLogSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient_type: { type: String, default: 'user' },
  type: { 
    type: String, 
    enum: ['birthday', 'timetable_alert', 'event_reminder', 'announcement', 'manual', 'timetable', 'event', 'system'], 
    required: true 
  },
  channel: {
    type: String,
    enum: ['email', 'push', 'in-app'],
    default: 'in-app'
  },
  status: {
    type: String,
    enum: ['sent', 'failed', 'suppressed', 'pending'],
    default: 'sent'
  },
  related_id: { type: mongoose.Schema.Types.ObjectId }, // Event or Announcement
  error_message: { type: String },
  retry_count: { type: Number, default: 0 },
  sent_at: { type: Date, default: Date.now },
  
  // Legacy UI fields for in-app bell
  title: { type: String },
  message: { type: String },
  link: { type: String },
  is_read: { type: Boolean, default: false },
}, { timestamps: true });

notificationLogSchema.index({ recipient: 1, created_at: -1 });

module.exports = mongoose.model('NotificationLog', notificationLogSchema);
