const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Session = require('../models/Session');
const auth = require('../middleware/auth');
const webPush = require('web-push');

const router = express.Router();

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(
    'mailto:test@example.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// Update Profile
router.put('/profile', auth, async (req, res) => {
  try {
    const updates = req.body;
    // Don't allow password updates through this route
    delete updates.password;
    delete updates.email; 

    console.log("Profile update received with keys:", Object.keys(updates));
    if (updates.avatar) {
      console.log("Avatar is present, length:", updates.avatar.length);
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get Sessions
router.get('/sessions', auth, async (req, res) => {
  try {
    const sessions = await Session.find({ user_id: req.user._id }).sort({ date: 1 });
    res.json(sessions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add Session
router.post('/sessions', auth, async (req, res) => {
  try {
    const session = new Session({
      ...req.body,
      user_id: req.user._id
    });
    await session.save();
    res.status(201).json(session);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update Session
router.put('/sessions/:id', auth, async (req, res) => {
  try {
    const session = await Session.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user._id },
      { $set: req.body },
      { new: true }
    );
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete Session
router.delete('/sessions/:id', auth, async (req, res) => {
  try {
    const session = await Session.findOneAndDelete({ _id: req.params.id, user_id: req.user._id });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json({ message: 'Session deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete All Sessions
router.delete('/sessions', auth, async (req, res) => {
  try {
    await Session.deleteMany({ user_id: req.user._id });
    res.json({ message: 'All sessions deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Export Calendar ICS
router.get('/:id/calendar.ics', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).send('User not found');
    
    const sessions = await Session.find({ user_id: user._id });
    const userTimezone = user.timezone || 'UTC';
    
    // Formatting date to ICS format (YYYYMMDDTHHmmssZ)
    // ICS files generally prefer UTC with the Z suffix. We'll map the user's local date/time string to UTC.
    const formatIcsDate = (dateStr, timeStr, durationMinutes = 60, isEnd = false) => {
      try {
        const localDate = new Date(`${dateStr}T${timeStr}:00`);
        // Add duration for end time
        if (isEnd) {
          localDate.setMinutes(localDate.getMinutes() + durationMinutes);
        }
        
        // Convert to UTC string for ICS
        const utcStr = localDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        return utcStr;
      } catch (e) {
        return new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      }
    };

    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//StudySmart//Calendar//EN',
      'CALSCALE:GREGORIAN',
      `X-WR-TIMEZONE:${userTimezone}`
    ];

    sessions.forEach(session => {
      const startUtc = formatIcsDate(session.date, session.time);
      const endUtc = formatIcsDate(session.date, session.time, session.duration_minutes, true);
      const nowUtc = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

      icsContent.push(
        'BEGIN:VEVENT',
        `UID:${session._id}@studysmart.app`,
        `DTSTAMP:${nowUtc}`,
        `DTSTART:${startUtc}`,
        `DTEND:${endUtc}`,
        `SUMMARY:${session.title || 'Study Session'}`,
        `DESCRIPTION:Subject: ${session.subject}\\nTopic: ${session.topic}\\nDifficulty: ${session.difficulty}\\nNotes: ${session.notes || ''}`,
        'END:VEVENT'
      );
    });

    icsContent.push('END:VCALENDAR');

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="studysmart_calendar.ics"`);
    res.send(icsContent.join('\\r\\n'));
  } catch (error) {
    console.error('Calendar generation error:', error);
    res.status(500).send('Server error');
  }
});

// Delete account
router.delete('/account', auth, async (req, res) => {
  try {
    await Session.deleteMany({ user_id: req.user._id });
    await User.findByIdAndDelete(req.user._id);
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error while deleting account' });
  }
});

// Push Notification Routes
router.post('/push/subscribe', auth, async (req, res) => {
  try {
    const { subscription } = req.body;
    
    // Bypass Mongoose schema entirely to guarantee save
    const result = await User.collection.updateOne(
      { _id: new mongoose.Types.ObjectId(req.user._id) },
      { $set: { pushSubscription: subscription } }
    );
    
    if (result.matchedCount === 0) return res.status(404).json({ error: 'User not found' });

    res.status(200).json({ message: 'Push subscription saved successfully' });
  } catch (error) {
    console.error('Push subscribe error:', error);
    res.status(500).json({ error: 'Failed to save push subscription' });
  }
});



module.exports = router;
