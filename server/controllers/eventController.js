const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const User = require('../models/User');
const UserSettings = require('../models/UserSettings');
const NotificationLog = require('../models/NotificationLog');
const { uploadFile, deleteFile } = require('../services/fileUploadService');
const { sendPush } = require('../services/pushService');
const { validateAndCleanTargetAudience, getTargetFeedQuery } = require('../utils/targetAudienceValidator');

// POST /api/events
const createEvent = async (req, res, next) => {
  try {
    const { title, description, link, event_date, target_all } = req.body;
    
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

    const newEvent = new Event({
      title,
      description,
      link,
      event_date,
      attachment_url,
      target_all: audience.target_all,
      target_year: audience.target_year,
      target_section: audience.target_section,
      author_id: req.user.userId
    });

    await newEvent.save();

    // Fan-out notifications (and theoretically schedule an automation cron here)
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
        type: 'event',
        title: 'New Event Scheduled',
        message: title,
        link: `/events/${newEvent._id}`
      }));

    if (notifications.length > 0) {
      await NotificationLog.insertMany(notifications);
      
      // Fire actual push notifications
      const tokens = targetUsers
        .filter(u => notifyUserIds.includes(u._id.toString()))
        .flatMap(u => u.device_tokens || []);
        
      if (tokens.length > 0) {
        const bodyPreview = description ? description.substring(0, 100) + '...' : 'Tap to view event details';
        await sendPush(
          tokens,
          `New Event Scheduled: ${title}`,
          bodyPreview,
          { link: `/events/${newEvent._id}` }
        );
      }
    }

    // Pseudo-code for scheduling: scheduleReminderJob(newEvent._id, event_date)

    res.status(201).json(newEvent);
  } catch (error) {
    next(error);
  }
};

// GET /api/events
const getEvents = async (req, res, next) => {
  try {
    const { role, userId } = req.user;
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

    // Sort by soonest upcoming events first (greater than today)
    // Could also separate upcoming vs past, we just sort by event_date desc for now
    let events = await Event.find(query)
      .sort({ event_date: 1 }) // Soonest first
      .populate('author_id', 'name role')
      .populate('target_year', 'name')
      .populate('target_section', 'name')
      .lean();

    // If student, attach registration status
    if (role === 'student') {
      const registrations = await EventRegistration.find({ student_id: userId }).select('event_id');
      const registeredEventIds = registrations.map(r => r.event_id.toString());
      
      events = events.map(event => ({
        ...event,
        is_registered: registeredEventIds.includes(event._id.toString())
      }));
    } else {
      // Admin/DEO/Faculty want to see registration counts
      // To optimize, this could be an aggregation, but doing it sequentially for now
      for (let event of events) {
        event.registration_count = await EventRegistration.countDocuments({ event_id: event._id });
      }
    }

    res.status(200).json(events);
  } catch (error) {
    next(error);
  }
};

// POST /api/events/:eventId/register
const registerForEvent = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    
    // Only students can register (middleware can also enforce this)
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can register for events' });
    }

    // Create unique registration
    const registration = new EventRegistration({
      event_id: eventId,
      student_id: req.user.userId
    });

    await registration.save();
    res.status(200).json({ message: 'Registered successfully', registration });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You have already registered for this event' });
    }
    next(error);
  }
};

// GET /api/events/:eventId/registrations
const getEventRegistrations = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Permissions
    if (req.user.role === 'faculty' && event.author_id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const registrations = await EventRegistration.find({ event_id: eventId })
      .populate({
        path: 'student_id',
        select: 'name reg_no year section',
        populate: [{ path: 'year', select: 'name' }, { path: 'section', select: 'name' }]
      });

    res.status(200).json(registrations);
  } catch (error) {
    next(error);
  }
};

// PUT /api/events/:id
const updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, link, event_date } = req.body;

    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: 'Not found' });

    // Permissions check
    if (req.user.role === 'faculty' && event.author_id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (title) event.title = title;
    if (description) event.description = description;
    if (link) event.link = link;
    if (event_date) event.event_date = event_date;

    if (req.body.target_all !== undefined || req.body.target_year !== undefined) {
      const audience = await validateAndCleanTargetAudience(
        req.body.target_all, 
        req.body.target_year, 
        req.body.target_section
      );
      event.target_all = audience.target_all;
      event.target_year = audience.target_year;
      event.target_section = audience.target_section;
    }

    if (req.file) {
      event.attachment_url = await uploadFile(req.file);
    }

    await event.save();
    res.status(200).json(event);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/events/:id
const deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);
    
    if (!event) return res.status(404).json({ message: 'Not found' });

    // Permissions check
    if (req.user.role === 'faculty' && event.author_id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (event.attachment_url) {
      await deleteFile(event.attachment_url);
    }

    await Event.deleteOne({ _id: id });
    // Also cleanup registrations
    await EventRegistration.deleteMany({ event_id: id });
    
    res.status(200).json({ message: 'Event deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createEvent,
  getEvents,
  registerForEvent,
  getEventRegistrations,
  updateEvent,
  deleteEvent
};
