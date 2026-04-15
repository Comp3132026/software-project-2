// backend/models/Warning.js
const mongoose = require('mongoose');

// MS2: Warning model for rule violations in group discussions
const warningSchema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  // User who received the warning (offender)
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // User who issued the warning (moderator / owner)
  issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Type of violation
  type: {
    type: String,
    enum: ['spam', 'harassment', 'inappropriate_content', 'off_topic', 'inactivity', 'other'],
    required: true,
  },

  // Short explanation shown to the user
  reason: { type: String, required: true, maxlength: 500 },

  // Severity of the warning
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },

  // Optional link to a specific chat message that caused the warning
  messageRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },

  // Has the user acknowledged reading the warning?
  acknowledged: { type: Boolean, default: false },
  acknowledgedAt: { type: Date },

  // Optional expiry date for warnings
  expiresAt: { type: Date },

  createdAt: { type: Date, default: Date.now },
});

// Useful queries: warnings per user in a group
warningSchema.index({ group: 1, user: 1, createdAt: -1 });

module.exports = mongoose.model('Warning', warningSchema);
