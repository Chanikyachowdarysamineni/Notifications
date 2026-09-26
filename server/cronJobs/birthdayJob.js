const cron = require('node-cron');
const User = require('../models/User');
const UserSettings = require('../models/UserSettings');
const NotificationLog = require('../models/NotificationLog');
const { sendEmail } = require('../services/emailService');
const { sendPush } = require('../services/pushService');

const runBirthdayJob = async () => {
  const startTime = Date.now();
  let processed = 0, successCount = 0, failCount = 0, suppressedCount = 0;
  
  console.log(`[JOB: Birthday] Started at ${new Date().toISOString()}`);

  try {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();

    // Find users whose birthday is today using aggregation to match month/day
    const users = await User.aggregate([
      {
        $project: {
          name: 1, email: 1, role: 1, dob: 1, device_tokens: 1,
          month: { $month: '$dob' },
          day: { $dayOfMonth: '$dob' }
        }
      },
      {
        $match: {
          month: currentMonth,
          day: currentDay
        }
      }
    ]);

    processed = users.length;

    // Start of day for idempotency check
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));

    for (const user of users) {
      // Idempotency: Check if already sent today
      const existingLog = await NotificationLog.findOne({
        recipient: user._id,
        type: 'birthday',
        status: 'sent',
        sent_at: { $gte: startOfDay }
      });

      if (existingLog) {
        continue; // Already sent
      }

      const userSettings = await UserSettings.findOne({ user_id: user._id });
      const isEnabled = userSettings ? userSettings.birthday_wish_enabled !== false : true;

      if (!isEnabled) {
        suppressedCount++;
        await NotificationLog.create({
          recipient: user._id, type: 'birthday', channel: 'in-app', status: 'suppressed', 
          title: 'Happy Birthday!', message: 'Birthday wish suppressed by user settings'
        });
        continue;
      }

      // Send Email
      const emailResult = await sendEmail(user.email, 'Happy Birthday from CSE HUB!', 'birthday', { name: user.name });
      
      // Send Push
      const pushResult = await sendPush(user.device_tokens || [], 'Happy Birthday!', `Wishing you a fantastic day, ${user.name}!`);

      const status = (emailResult.success || pushResult.success) ? 'sent' : 'failed';
      const error_message = status === 'failed' ? (emailResult.error || pushResult.error) : null;

      if (status === 'sent') successCount++; else failCount++;

      // Log it
      await NotificationLog.create({
        recipient: user._id,
        type: 'birthday',
        channel: 'email', // Primary
        status,
        error_message,
        title: 'Happy Birthday!',
        message: `Wishing you a fantastic day, ${user.name}!`
      });
    }

  } catch (error) {
    console.error(`[JOB: Birthday] FATAL ERROR:`, error);
  } finally {
    const duration = Date.now() - startTime;
    console.log(`[JOB: Birthday] Completed in ${duration}ms. Processed: ${processed}, Sent: ${successCount}, Failed: ${failCount}, Suppressed: ${suppressedCount}`);
  }
};

module.exports = { runBirthdayJob };
