const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  token_id: {
    type: String,
    required: true,
    unique: true
  },
  issued_at: {
    type: Date,
    default: Date.now
  },
  expires_at: {
    type: Date,
    required: true
  },
  revoked: {
    type: Boolean,
    default: false
  },
  device_info: {
    type: String,
    default: 'Unknown Device'
  }
});

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
