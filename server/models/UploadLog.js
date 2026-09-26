const mongoose = require('mongoose');

const uploadLogSchema = new mongoose.Schema({
  uploaded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  uploader_role: { type: String, required: true },
  type: { type: String, enum: ['timetable', 'users', 'general'], default: 'timetable' },
  file_name: { type: String, default: 'bulk_upload.xlsx' },
  total_rows: { type: Number, required: true },
  sections_affected: [{
    year: { type: String },
    section: { type: String },
    day: { type: String },
    period_count: { type: Number }
  }],
  status: { type: String, enum: ['success', 'failed'], default: 'success' },
  error_list: [{ row: Number, message: String }],
  summary: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

module.exports = mongoose.model('UploadLog', uploadLogSchema);
