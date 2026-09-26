const User = require('../models/User');
const UserSettings = require('../models/UserSettings');
const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const NotificationLog = require('../models/NotificationLog');
const { sendEmail } = require('../services/emailService');
const { sendPush } = require('../services/pushService');

const runEventReminderJob = async () => {
  const startTime = Date.now();
  let processed = 0, successCount = 0, failCount = 0, suppressedCount = 0;
  
  console.log(`[JOB: EventReminder] Started at ${new Date().toISOString()}`);

  try {
    const WINDOW_HOURS = parseInt(process.env.REMINDER_WINDOW_HOURS || '24', 10);
    const now = new Date();
    const windowEnd = new Date(now.getTime() + (WINDOW_HOURS * 60 * 60 * 1000));

    // Find upcoming events
    const upcomingEvents = await Event.find({
      event_date: { $gte: now, $lte: windowEnd }
    });

    for (const event of upcomingEvents) {
      // Build audience list
      const audienceIds = new Set();
      
      // 1. By target year/section
      if (event.target_year && event.target_year.length > 0) {
        const query = { year: { $in: event.target_year } };
        if (event.target_section && event.target_section.length > 0) {
          query.section = { $in: event.target_section };
        }
        const targetUsers = await User.find(query).select('_id');
        targetUsers.forEach(u => audienceIds.add(u._id.toString()));
      }

      // 2. By Explicit Registration
      const registrations = await EventRegistration.find({ event_id: event._id });
      registrations.forEach(r => audienceIds.add(r.student_id.toString()));

      processed += audienceIds.size;

      // Process each user
      for (const userId of audienceIds) {
        // Idempotency: has this specific user already been reminded about this specific event?
        const existingLog = await NotificationLog.findOne({
          recipient: userId,
          type: 'event_reminder',
          related_id: event._id
        });

        if (existingLog) continue;

        const user = await User.findById(userId);
        if (!user) continue;

        const userSettings = await UserSettings.findOne({ user_id: userId });
        const isEnabled = userSettings ? userSettings.reminder_enabled !== false : true;

        if (!isEnabled) {
          suppressedCount++;
          await NotificationLog.create({
            recipient: user._id, type: 'event_reminder', related_id: event._id, channel: 'email', status: 'suppressed',
            title: `Reminder: ${event.title}`, message: 'Event reminder suppressed by user settings'
          });
          continue;
        }

        const timeStr = new Date(event.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Send
        const emailRes = await sendEmail(user.email, `Reminder: ${event.title}`, 'event_reminder', { title: event.title, time: timeStr });
        const pushRes = await sendPush(user.device_tokens || [], `Reminder: ${event.title}`, `Starts soon at ${timeStr}`);

        const status = (emailRes.success || pushRes.success) ? 'sent' : 'failed';
        if (status === 'sent') successCount++; else failCount++;

        await NotificationLog.create({
          recipient: user._id, type: 'event_reminder', related_id: event._id, channel: 'email', status,
          error_message: status === 'failed' ? (emailRes.error || pushRes.error) : null,
          title: `Reminder: ${event.title}`, message: `Starts soon at ${timeStr}`
        });
      }
    }
  } catch (error) {
    console.error(`[JOB: EventReminder] FATAL ERROR:`, error);
  } finally {
    const duration = Date.now() - startTime;
    console.log(`[JOB: EventReminder] Completed in ${duration}ms. Processed: ${processed}, Sent: ${successCount}, Failed: ${failCount}, Suppressed: ${suppressedCount}`);
  }
};

module.exports = { runEventReminderJob };
