const Announcement = require('../models/Announcement');
const User = require('../models/User');
const UserSettings = require('../models/UserSettings');
const NotificationLog = require('../models/NotificationLog');
const { uploadFile, deleteFile } = require('../services/fileUploadService');
const { sendPush } = require('../services/pushService');
const { validateAndCleanTargetAudience, getTargetFeedQuery } = require('../utils/targetAudienceValidator');

// POST /api/announcements
const createAnnouncement = async (req, res, next) => {
  try {
    const { title, description, link, target_all } = req.body;
    
    // Validate and clean target audience data
    const audience = await validateAndCleanTargetAudience(
      target_all, 
      req.body.target_year, 
      req.body.target_section
    );

    let attachment_url = null;
    if (req.file) {
      attachment_url = await uploadFile(req.file);
    }

    const newAnnouncement = new Announcement({
      title,
      description,
      link,
      attachment_url,
      target_all: audience.target_all,
      target_year: audience.target_year,
      target_section: audience.target_section,
      author_id: req.user.userId
    });

    await newAnnouncement.save();

    // Fan-out notifications
    let query = {};
    if (!audience.target_all) {
      if (audience.target_year.length > 0) query.year = { $in: audience.target_year };
      if (audience.target_section.length > 0) query.section = { $in: audience.target_section };
    }
    
    const targetUsers = await User.find(query);
    
    const userIds = targetUsers.map(u => u._id);
    const settingsDocs = await UserSettings.find({ user_id: { $in: userIds }, notification_enabled: true });
    const notifyUserIds = settingsDocs.map(s => s.user_id.toString());
    
    const notifications = targetUsers
      .filter(u => notifyUserIds.includes(u._id.toString()))
      .map(user => ({
        recipient: user._id,
        type: 'announcement',
        title: 'New Announcement',
        message: title,
        link: `/announcements/${newAnnouncement._id}`
      }));

    if (notifications.length > 0) {
      await NotificationLog.insertMany(notifications);
      
      // Fire actual push notifications
      const tokens = targetUsers
        .filter(u => notifyUserIds.includes(u._id.toString()))
        .flatMap(u => u.device_tokens || []);
        
      if (tokens.length > 0) {
        // We use a short description for the push body, stripped of HTML if necessary, or just a default
        const bodyPreview = description ? description.substring(0, 100) + '...' : 'Tap to view announcement details';
        await sendPush(
          tokens,
          `New Announcement: ${title}`,
          bodyPreview,
          { link: `/announcements/${newAnnouncement._id}` }
        );
      }
    }

    res.status(201).json(newAnnouncement);
  } catch (error) {
    next(error);
  }
};

// GET /api/announcements
const getAnnouncements = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 15;
    const skip = (page - 1) * limit;

    let query = {};
    const { role, userId } = req.user;

    // Filter logic based on role
    if (role === 'student' || role === 'faculty') {
      const user = await User.findById(userId);
      query = getTargetFeedQuery(user);
    } else {
      // Admin/DEO see all, but can apply filters
      if (req.query.year) query.target_year = req.query.year;
      if (req.query.section) query.target_section = req.query.section;
    }

    const announcements = await Announcement.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author_id', 'name role')
      .populate('target_year', 'name')
      .populate('target_section', 'name');

    res.status(200).json(announcements);
  } catch (error) {
    next(error);
  }
};

// PUT /api/announcements/:id
const updateAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, link } = req.body;

    const announcement = await Announcement.findById(id);
    if (!announcement) return res.status(404).json({ message: 'Not found' });

    // Permissions check
    if (req.user.role === 'faculty' && announcement.author_id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (title) announcement.title = title;
    if (description) announcement.description = description;
    if (link) announcement.link = link;

    if (req.body.target_all !== undefined || req.body.target_year !== undefined) {
      const audience = await validateAndCleanTargetAudience(
        req.body.target_all, 
        req.body.target_year, 
        req.body.target_section
      );
      announcement.target_all = audience.target_all;
      announcement.target_year = audience.target_year;
      announcement.target_section = audience.target_section;
    }

    if (req.file) {
      announcement.attachment_url = await uploadFile(req.file);
    }

    await announcement.save();
    res.status(200).json(announcement);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/announcements/:id
const deleteAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const announcement = await Announcement.findById(id);
    
    if (!announcement) return res.status(404).json({ message: 'Not found' });

    // Permissions check
    if (req.user.role === 'faculty' && announcement.author_id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (announcement.attachment_url) {
      await deleteFile(announcement.attachment_url);
    }

    await Announcement.deleteOne({ _id: id });
    res.status(200).json({ message: 'Announcement deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAnnouncement,
  getAnnouncements,
  updateAnnouncement,
  deleteAnnouncement
};
