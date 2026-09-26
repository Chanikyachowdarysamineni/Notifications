const FileResource = require('../models/FileResource');
const User = require('../models/User');
const { uploadFile, deleteFile } = require('../services/fileUploadService');
const { validateAndCleanTargetAudience, getTargetFeedQuery } = require('../utils/targetAudienceValidator');

// POST /api/files
const createFileResource = async (req, res, next) => {
  try {
    const { title, description, target_all } = req.body;
    
    // Validate and clean target audience data
    const audience = await validateAndCleanTargetAudience(
      target_all, 
      req.body.target_year, 
      req.body.target_section
    );

    if (!req.file) {
      return res.status(400).json({ message: 'File is required' });
    }

    const file_url = await uploadFile(req.file);

    const newFile = new FileResource({
      title,
      description,
      file_url,
      file_type: req.file.mimetype,
      file_size: req.file.size,
      target_all: audience.target_all,
      target_year: audience.target_year,
      target_section: audience.target_section,
      uploaded_by: req.user.userId
    });

    await newFile.save();
    res.status(201).json(newFile);
  } catch (error) {
    next(error);
  }
};

// GET /api/files
const getFiles = async (req, res, next) => {
  try {
    const { role, userId } = req.user;
    const { search, sort } = req.query; // sort can be 'newest', 'oldest', 'title'

    let query = {};

    // Filter logic based on role
    if (role === 'student' || role === 'faculty') {
      const user = await User.findById(userId);
      query = getTargetFeedQuery(user);
    } else {
      // Admin/DEO see all, but can apply filters
      if (req.query.year) query.target_year = req.query.year;
      if (req.query.section) query.target_section = req.query.section;
    }

    // Search by title
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    // Sorting
    let sortOptions = { createdAt: -1 }; // newest default
    if (sort === 'oldest') sortOptions = { createdAt: 1 };
    else if (sort === 'title') sortOptions = { title: 1 };

    const files = await FileResource.find(query)
      .sort(sortOptions)
      .populate('uploaded_by', 'name role')
      .populate('target_year', 'name')
      .populate('target_section', 'name');

    res.status(200).json(files);
  } catch (error) {
    next(error);
  }
};

// PUT /api/files/:id
const updateFileResource = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    const fileRes = await FileResource.findById(id);
    if (!fileRes) return res.status(404).json({ message: 'Not found' });

    // Permissions check
    if (req.user.role === 'faculty' && fileRes.uploaded_by.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (title) fileRes.title = title;
    if (description) fileRes.description = description;

    if (req.body.target_all !== undefined || req.body.target_year !== undefined) {
      const audience = await validateAndCleanTargetAudience(
        req.body.target_all, 
        req.body.target_year, 
        req.body.target_section
      );
      fileRes.target_all = audience.target_all;
      fileRes.target_year = audience.target_year;
      fileRes.target_section = audience.target_section;
    }

    if (req.file) {
      fileRes.file_url = await uploadFile(req.file);
      fileRes.file_type = req.file.mimetype;
      fileRes.file_size = req.file.size;
    }

    await fileRes.save();
    res.status(200).json(fileRes);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/files/:id
const deleteFileResource = async (req, res, next) => {
  try {
    const { id } = req.params;
    const fileRes = await FileResource.findById(id);
    
    if (!fileRes) return res.status(404).json({ message: 'Not found' });

    // Permissions check
    if (req.user.role === 'faculty' && fileRes.uploaded_by.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (fileRes.file_url) {
      await deleteFile(fileRes.file_url);
    }

    await FileResource.deleteOne({ _id: id });
    res.status(200).json({ message: 'File deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createFileResource,
  getFiles,
  updateFileResource,
  deleteFileResource
};
