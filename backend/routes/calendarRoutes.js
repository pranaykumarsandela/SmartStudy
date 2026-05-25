const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Session = require('../models/Session');

// Helper to format date for ICS (YYYYMMDDTHHMMSSZ)
const formatICSDate = (dateString, timeString) => {
  if (!dateString || !timeString) return null;
  const dt = new Date(`${dateString}T${timeString}:00`);
  if (isNaN(dt.getTime())) return null;
  return dt.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

const formatICSEndDate = (dateString, timeString, durationMins) => {
  if (!dateString || !timeString) return null;
  const dt = new Date(`${dateString}T${timeString}:00`);
  if (isNaN(dt.getTime())) return null;
  dt.setMinutes(dt.getMinutes() + (durationMins || 60));
  return dt.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

// GET /api/users/:userId/calendar.ics
router.get('/:userId/calendar.ics', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).send('User not found');

    const sessions = await Session.find({ user_id: user._id });

    // Filter out completed sessions if user preference says so
    const includeCompleted = user.preferences?.autoSyncCalendar !== false;
    const activeSessions = sessions.filter(s => {
      if (!includeCompleted && s.is_done) return false;
      return s.date && s.time;
    });

    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//StudySmart//Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:StudySmart - ${user.name}`
    ];

    activeSessions.forEach(s => {
      const start = formatICSDate(s.date, s.time);
      const end = formatICSEndDate(s.date, s.time, s.duration_minutes);
      const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      
      if (start && end) {
        icsContent.push('BEGIN:VEVENT');
        icsContent.push(`UID:${s._id}@studysmart.app`);
        icsContent.push(`DTSTAMP:${now}`);
        icsContent.push(`DTSTART:${start}`);
        icsContent.push(`DTEND:${end}`);
        icsContent.push(`SUMMARY:Study: ${s.subject}`);
        
        let desc = '';
        if (s.chapter) desc += `Chapter: ${s.chapter}\\n`;
        if (s.topic) desc += `Topic: ${s.topic}\\n`;
        if (s.difficulty) desc += `Difficulty: ${s.difficulty}\\n`;
        if (s.notes) desc += `Notes: ${s.notes}\\n`;
        if (desc) icsContent.push(`DESCRIPTION:${desc}`);
        
        icsContent.push('END:VEVENT');
      }
    });

    icsContent.push('END:VCALENDAR');
    const finalICS = icsContent.join('\r\n');

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="studysmart_${user.name.replace(/\\s+/g, '_')}.ics"`);
    res.send(finalICS);
  } catch (error) {
    console.error('Calendar generation error:', error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
