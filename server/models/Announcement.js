const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  attachment_url: { type: String },
  link: { type: String },
  target_all: { type: Boolean, default: false },
  target_year: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Year' }],
  target_section: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Section' }],
  author_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);
