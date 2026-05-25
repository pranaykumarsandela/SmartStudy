const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  semester: { type: String },
  subject: { type: String, required: true },
  chapter: { type: String },
  topic: { type: String },
  date: { type: String, required: true }, // Store as 'YYYY-MM-DD'
  time: { type: String, required: true }, // Store as 'HH:mm'
  duration_minutes: { type: Number, required: true },
  difficulty: { type: String },
  is_done: { type: Boolean, default: false },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Session', SessionSchema);
