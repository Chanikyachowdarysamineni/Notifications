const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String }, // optional but good to have
  attachment_url: { type: String },
  link: { type: String },
  event_date: { type: Date, required: true },
  target_all: { type: Boolean, default: false },
  target_year: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Year' }],
  target_section: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Section' }],
  author_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
