const mongoose = require('mongoose');

const periodSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  faculty_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  start_time: { type: String, required: true }, // e.g., '09:00'
  end_time: { type: String, required: true }    // e.g., '10:00'
});

const timeTableSchema = new mongoose.Schema({
  year: { type: mongoose.Schema.Types.ObjectId, ref: 'Year', required: true },
  section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true },
  day: { 
    type: String, 
    enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], 
    required: true 
  },
  periods: [periodSchema]
}, { timestamps: true });

// Compound index for fast lookups
timeTableSchema.index({ year: 1, section: 1, day: 1 }, { unique: true });

module.exports = mongoose.model('TimeTable', timeTableSchema);
