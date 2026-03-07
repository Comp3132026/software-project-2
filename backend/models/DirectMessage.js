const mongoose = require('mongoose');

// GS7: Direct Message model for contacting members
const directMessageSchema = new mongoose.Schema({
  // Optional group context (so messages can be tied to a group)
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },

  // Participants
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Content
  subject: { type: String, trim: true, maxlength: 200 },
  content: { type: String, required: true, trim: true, maxlength: 5000 },

  // Read tracking
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },

  // Timestamps
  createdAt: { type: Date, default: Date.now },
});

// Helpful indexes
directMessageSchema.index({ from: 1, to: 1, createdAt: -1 });
directMessageSchema.index({ to: 1, isRead: 1 });

module.exports = mongoose.model('DirectMessage', directMessageSchema);
