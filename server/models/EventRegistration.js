const mongoose = require('mongoose');

const eventRegistrationSchema = new mongoose.Schema({
  event_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  registered_at: { type: Date, default: Date.now }
});

// Unique compound index to prevent duplicate registrations
eventRegistrationSchema.index({ event_id: 1, student_id: 1 }, { unique: true });

module.exports = mongoose.model('EventRegistration', eventRegistrationSchema);
