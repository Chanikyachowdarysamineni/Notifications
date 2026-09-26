/**
 * ============================================================================
 * GALLERY CONTROLLER - CSE HUB
 * ============================================================================
 * CHANGELOG / MIGRATION NOTE:
 * - Gallery upload, edit, and delete access is now restricted to Admin and DEO ONLY.
 * - Faculty upload/edit/delete access was intentionally removed in this version.
 *   Faculty now has read-only access (same as Students, minus the Like action).
 * - Per-photo ownership checks (uploaded_by === req.user.userId) have been removed
 *   from edit and delete handlers — Admin and DEO can manage all photos unconditionally.
 * - Historical photos uploaded by Faculty in previous versions remain preserved in
 *   the database and will continue to display normally with their original author info.
 * - Like action remains strictly restricted to the Student role.
 * ============================================================================
 */

const Gallery = require('../models/Gallery');
const GalleryLike = require('../models/GalleryLike');
const { uploadFile, deleteFile } = require('../services/fileUploadService');

// Allowed image MIME types
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

// POST /api/gallery (Admin & DEO only)
const uploadPhoto = async (req, res, next) => {
  try {
    const { description } = req.body;
    
    // Support multi-upload via req.files or single file via req.file
    const files = req.files && req.files.length > 0 
      ? req.files 
      : (req.file ? [req.file] : []);

    if (files.length === 0) {
      return res.status(400).json({ message: 'At least one image file is required.' });
    }

    // Server-side MIME type validation
    for (const file of files) {
      if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return res.status(400).json({ 
          message: `Invalid file type '${file.mimetype}'. Only PNG, JPG, JPEG, and WEBP images are allowed.` 
        });
      }
    }

    // Trim and sanitize description (max 200 chars)
    const sanitizedDescription = description ? String(description).trim().slice(0, 200) : '';

    const uploadedPhotos = [];

    for (const file of files) {
      const image_url = await uploadFile(file); // Upload to Cloudinary
      const photo = new Gallery({
        image_url,
        description: sanitizedDescription,
        uploaded_by: req.user.userId,
        like_count: 0
      });
      await photo.save();
      
      const populatedPhoto = await Gallery.findById(photo._id).populate('uploaded_by', 'name role');
      uploadedPhotos.push(populatedPhoto);
    }

    res.status(201).json({
      message: `Successfully uploaded ${uploadedPhotos.length} photo${uploadedPhotos.length > 1 ? 's' : ''}.`,
      photos: uploadedPhotos
    });
  } catch (error) {
    console.error('Upload photo error:', error);
    next ? next(error) : res.status(500).json({ message: 'Server error during photo upload.' });
  }
};

// PATCH /api/gallery/:id (Admin & DEO only - edit description)
const updatePhoto = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { description } = req.body;

    const photo = await Gallery.findById(id);
    if (!photo) {
      return res.status(404).json({ message: 'Photo not found.' });
    }

    // Admin & DEO can edit any photo's description unconditionally
    photo.description = description ? String(description).trim().slice(0, 200) : '';
    await photo.save();

    const updatedPhoto = await Gallery.findById(id).populate('uploaded_by', 'name role');

    res.status(200).json({
      message: 'Photo description updated successfully.',
      photo: updatedPhoto
    });
  } catch (error) {
    console.error('Update photo description error:', error);
    next ? next(error) : res.status(500).json({ message: 'Server error updating photo description.' });
  }
};

// GET /api/gallery (All authenticated users)
const getGallery = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const photos = await Gallery.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('uploaded_by', 'name role')
      .lean();

    // Attach user's like status if authenticated
    if (req.user) {
      const userLikes = await GalleryLike.find({ user_id: req.user.userId }).select('gallery_id');
      const likedPhotoIds = new Set(userLikes.map(like => like.gallery_id.toString()));
      
      photos.forEach(photo => {
        photo.is_liked = likedPhotoIds.has(photo._id.toString());
      });
    }

    res.status(200).json(photos);
  } catch (error) {
    console.error('Get gallery error:', error);
    next ? next(error) : res.status(500).json({ message: 'Server error retrieving gallery.' });
  }
};

// POST /api/gallery/:id/like (Student only)
const toggleLike = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const photo = await Gallery.findById(id);
    if (!photo) {
      return res.status(404).json({ message: 'Photo not found.' });
    }

    const existingLike = await GalleryLike.findOne({ gallery_id: id, user_id: userId });

    if (existingLike) {
      // Unlike
      await GalleryLike.deleteOne({ _id: existingLike._id });
      photo.like_count = Math.max(0, photo.like_count - 1);
      await photo.save();
      return res.status(200).json({ 
        message: 'Unliked photo.', 
        like_count: photo.like_count, 
        is_liked: false 
      });
    } else {
      // Like (enforced unique via compound index in GalleryLike model)
      try {
        await GalleryLike.create({ gallery_id: id, user_id: userId });
        photo.like_count += 1;
        await photo.save();
        return res.status(200).json({ 
          message: 'Liked photo.', 
          like_count: photo.like_count, 
          is_liked: true 
        });
      } catch (err) {
        if (err.code === 11000) {
          return res.status(200).json({ 
            message: 'Already liked photo.', 
            like_count: photo.like_count, 
            is_liked: true 
          });
        }
        throw err;
      }
    }
  } catch (error) {
    console.error('Toggle like error:', error);
    next ? next(error) : res.status(500).json({ message: 'Server error toggling like.' });
  }
};

// DELETE /api/gallery/:id (Admin & DEO only)
const deletePhoto = async (req, res, next) => {
  try {
    const { id } = req.params;
    const photo = await Gallery.findById(id);
    
    if (!photo) {
      return res.status(404).json({ message: 'Photo not found.' });
    }

    if (photo.image_url) {
      await deleteFile(photo.image_url);
    }

    // Admin & DEO can delete any photo unconditionally (no ownership restriction)
    await Gallery.deleteOne({ _id: id });
    await GalleryLike.deleteMany({ gallery_id: id });

    res.status(200).json({ message: 'Photo deleted successfully.' });
  } catch (error) {
    console.error('Delete photo error:', error);
    next ? next(error) : res.status(500).json({ message: 'Server error deleting photo.' });
  }
};

module.exports = {
  uploadPhoto,
  updatePhoto,
  getGallery,
  toggleLike,
  deletePhoto
};
