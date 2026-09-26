const cron = require('node-cron');
const { runBirthdayJob } = require('../cronJobs/birthdayJob');
const { runTimetableAlertJob } = require('../cronJobs/timetableAlertJob');
const { runEventReminderJob } = require('../cronJobs/eventReminderJob');

const initCronJobs = () => {
  const timezone = process.env.APP_TIMEZONE || 'Asia/Kolkata'; // Documented assumed timezone
  
  console.log(`[CRON] Initializing jobs in timezone: ${timezone}`);

  // Job 1: Birthday Wishes (Daily at 00:05)
  cron.schedule('5 0 * * *', () => {
    runBirthdayJob();
  }, { timezone });
  console.log(`[CRON] Registered Birthday Job: 00:05 daily`);

  // Job 2: Daily Timetable Alert (Daily at 08:00)
  cron.schedule('0 8 * * *', () => {
    runTimetableAlertJob();
  }, { timezone });
  console.log(`[CRON] Registered Timetable Alert Job: 08:00 daily`);

  // Job 3: Event Reminders (Every 30 minutes)
  cron.schedule('*/30 * * * *', () => {
    runEventReminderJob();
  }, { timezone });
  console.log(`[CRON] Registered Event Reminder Job: Every 30 minutes`);
  
  // Handle Graceful Shutdown
  process.on('SIGTERM', () => {
    console.log('[CRON] Graceful shutdown initiated, closing jobs...');
    // In a fully robust system, you would call .stop() on the cron tasks if you saved their references.
  });
};

module.exports = initCronJobs;
