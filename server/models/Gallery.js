const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
  image_url: { type: String, required: true },
  description: { type: String },
  uploaded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  like_count: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Gallery', gallerySchema);
