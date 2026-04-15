// GS16: Reminder Settings (extends Group model, but we track individual reminders here)
import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Null means all members
  type: { type: String, enum: ['task_due', 'habit_check', 'inactivity', 'custom'], required: true },
  frequency: { type: String, enum: ['once', 'daily', 'weekly', 'monthly'], default: 'once' },
  message: { type: String, maxlength: 500 },
  scheduledFor: { type: Date, required: true },
  lastSentAt: { type: Date },
  nextSendAt: { type: Date },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

reminderSchema.index({ group: 1, isActive: 1, nextSendAt: 1 });

const Reminder = mongoose.model('Reminder', reminderSchema);

module.exports = { Reminder };