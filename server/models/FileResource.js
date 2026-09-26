const mongoose = require('mongoose');

const fileResourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  file_url: { type: String, required: true },
  file_type: { type: String, required: true },
  file_size: { type: Number, required: true }, // Size in bytes
  target_all: { type: Boolean, default: false },
  target_year: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Year' }],
  target_section: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Section' }],
  uploaded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('FileResource', fileResourceSchema);
