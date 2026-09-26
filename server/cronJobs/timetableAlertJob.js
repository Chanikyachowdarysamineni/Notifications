const User = require('../models/User');
const UserSettings = require('../models/UserSettings');
const TimeTable = require('../models/TimeTable');
const NotificationLog = require('../models/NotificationLog');
const { sendEmail } = require('../services/emailService');
const { sendPush } = require('../services/pushService');

const runTimetableAlertJob = async () => {
  const startTime = Date.now();
  let processed = 0, successCount = 0, failCount = 0, suppressedCount = 0;
  
  console.log(`[JOB: TimetableAlert] Started at ${new Date().toISOString()}`);

  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0,0,0,0));
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentDayName = dayNames[today.getDay()];

    if (currentDayName === 'Sun') {
      console.log(`[JOB: TimetableAlert] Skipped on Sunday`);
      return;
    }

    // Find all distinct Year/Section combinations that have a timetable for today
    const timetables = await TimeTable.find({ day: currentDayName })
      .populate('year', 'name')
      .populate('section', 'name')
      .lean();

    for (const tt of timetables) {
      if (!tt.periods || tt.periods.length === 0) continue;
      
      const yearId = tt.year?._id;
      const sectionId = tt.section?._id;
      
      if (!yearId || !sectionId) continue;

      // Find all students/faculty for this year/section
      const targetUsers = await User.find({ year: yearId, section: sectionId });
      processed += targetUsers.length;

      const messageStr = `${tt.periods.length} periods today. Starts with ${tt.periods[0].subject} at ${tt.periods[0].start_time}.`;

      for (const user of targetUsers) {
        // Idempotency check
        const existingLog = await NotificationLog.findOne({
          recipient: user._id, type: 'timetable_alert', status: 'sent', sent_at: { $gte: startOfDay }
        });
        if (existingLog) continue;

        const userSettings = await UserSettings.findOne({ user_id: user._id });
        const isEnabled = userSettings ? userSettings.notification_enabled !== false : true;

        if (!isEnabled) {
          suppressedCount++;
          await NotificationLog.create({
            recipient: user._id, type: 'timetable_alert', channel: 'push', status: 'suppressed',
            title: 'Today\'s Schedule', message: messageStr
          });
          continue;
        }

        const pushResult = await sendPush(user.device_tokens || [], 'Today\'s Schedule', messageStr);
        // Optional email could go here...

        const status = pushResult.success ? 'sent' : 'failed';
        if (status === 'sent') successCount++; else failCount++;

        await NotificationLog.create({
          recipient: user._id, type: 'timetable_alert', channel: 'push', status,
          error_message: status === 'failed' ? pushResult.error : null,
          title: 'Today\'s Schedule', message: messageStr
        });
      }
    }
  } catch (error) {
    console.error(`[JOB: TimetableAlert] FATAL ERROR:`, error);
  } finally {
    const duration = Date.now() - startTime;
    console.log(`[JOB: TimetableAlert] Completed in ${duration}ms. Processed: ${processed}, Sent: ${successCount}, Failed: ${failCount}, Suppressed: ${suppressedCount}`);
  }
};

module.exports = { runTimetableAlertJob };
