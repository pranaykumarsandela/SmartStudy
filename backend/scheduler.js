const cron = require('node-cron');
const moment = require('moment-timezone');
const webPush = require('web-push');
const User = require('./models/User');
const Session = require('./models/Session');

// Helper to send push
const sendPushToUser = async (user, title, body) => {
  if (!user.pushSubscription) return;
  try {
    const payload = JSON.stringify({
      title,
      body,
      icon: '/icon-192x192.png'
    });
    await webPush.sendNotification(user.pushSubscription, payload);
    console.log(`[Scheduler] Push sent to ${user.email}: ${title}`);
  } catch (err) {
    console.error(`[Scheduler] Failed to send push to ${user.email}:`, err.message);
  }
};

const initScheduler = () => {
  console.log('[Scheduler] Initializing background cron jobs...');

  // 1. Session Reminders (Runs every minute)
  cron.schedule('* * * * *', async () => {
    try {
      const users = await User.find({ pushSubscription: { $ne: null } });

      for (const user of users) {
        // Skip if user turned off notifications or session reminders
        if (!user.preferences?.notificationsEnabled || !user.preferences?.sessionReminders) continue;

        const userTimezone = user.timezone || 'America/Los_Angeles';
        const reminderMinutes = parseInt(user.preferences?.reminderTime || '15', 10);
        
        // Target time = Current time + reminder minutes
        const targetTime = moment().tz(userTimezone).add(reminderMinutes, 'minutes');
        const targetDateStr = targetTime.format('YYYY-MM-DD');
        const targetTimeStr = targetTime.format('HH:mm');

        // Find sessions starting exactly at the target time
        const upcomingSessions = await Session.find({
          user_id: user._id,
          date: targetDateStr,
          time: targetTimeStr,
          is_done: false
        });

        for (const session of upcomingSessions) {
          await sendPushToUser(
            user,
            'Time to Study! 📚',
            `Your session for ${session.subject} starts in ${reminderMinutes} minutes.`
          );
        }
      }
    } catch (error) {
      console.error('[Scheduler] Session reminder error:', error);
    }
  });

  // 2. Daily Streak Alert (Runs every day at 8:00 PM UTC)
  // To avoid complex per-timezone cron scheduling, we run this once an hour
  // and check if it's 8:00 PM in the user's local timezone.
  cron.schedule('0 * * * *', async () => {
    try {
      const users = await User.find({ pushSubscription: { $ne: null } });

      for (const user of users) {
        if (!user.preferences?.notificationsEnabled || !user.preferences?.streakAlerts) continue;

        const userTimezone = user.timezone || 'America/Los_Angeles';
        const userCurrentTime = moment().tz(userTimezone);

        // Send alert if it's exactly 8 PM (20:xx) in their local time
        if (userCurrentTime.hour() === 20) {
          const todayDateStr = userCurrentTime.format('YYYY-MM-DD');
          
          // Check if they completed any sessions today
          const completedToday = await Session.countDocuments({
            user_id: user._id,
            date: todayDateStr,
            is_done: true
          });

          if (completedToday === 0) {
            await sendPushToUser(
              user,
              'Keep Your Streak Alive! 🔥',
              'You haven\'t completed a study session today. Hop on and study for a few minutes!'
            );
          }
        }
      }
    } catch (error) {
      console.error('[Scheduler] Streak alert error:', error);
    }
  });
};

module.exports = initScheduler;
