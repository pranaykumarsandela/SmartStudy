const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false }, // Optional for Google OAuth users
  googleId: { type: String, default: null },
  
  // Profile Information
  avatar: { type: String, default: null },
  daily_goal_minutes: { type: Number, default: 120 },
  weekly_session_target: { type: Number, default: 10 },
  preferred_study_time: { type: String, default: 'evening' },
  accent_color: { type: String, default: '#6C63FF' },
  streak_count: { type: Number, default: 0 },
  longest_streak: { type: Number, default: 0 },
  timezone: { type: String, default: 'America/Los_Angeles' },
  settings: {
    theme: { type: String, default: 'dark' },
    notifications: { type: Boolean, default: true }
  },
  preferences: {
    notificationsEnabled: { type: Boolean, default: true },
    sessionReminders: { type: Boolean, default: true },
    streakAlerts: { type: Boolean, default: true },
    weeklyEmail: { type: Boolean, default: true },
    achievements: { type: Boolean, default: true },
    reminderTime: { type: String, default: '15' },
    quietStart: { type: String, default: '22:00' },
    quietEnd: { type: String, default: '07:00' },
    autoSyncCalendar: { type: Boolean, default: false }
  },
  custom_subjects: [{
    name: { type: String },
    color: { type: String }
  }],
  syllabus: [{
    semester: { type: String },
    subjects: [{
      subject: { type: String },
      chapters: [{
        name: { type: String },
        topics: [{ type: String }]
      }]
    }]
  }],
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  pushSubscription: { type: mongoose.Schema.Types.Mixed, default: null }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
