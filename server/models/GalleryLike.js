const mongoose = require('mongoose');

const galleryLikeSchema = new mongoose.Schema({
  gallery_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Gallery', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

// Unique compound index
galleryLikeSchema.index({ gallery_id: 1, user_id: 1 }, { unique: true });

module.exports = mongoose.model('GalleryLike', galleryLikeSchema);
