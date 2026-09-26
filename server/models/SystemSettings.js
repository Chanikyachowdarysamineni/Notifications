const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
  setting_id: {
    type: String,
    required: true,
    unique: true,
    default: 'singleton'
  },
  register_page_enabled: {
    type: Boolean,
    default: true
  },
  updated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
