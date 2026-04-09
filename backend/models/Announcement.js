const mongoose = require('mongoose');

// GS18: Announcement model for group-wide announcements
const announcementSchema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  content: { type: String, required: true, trim: true, maxlength: 5000 },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
  },
  category: {
    type: String,
    enum: ['general', 'update', 'reminder', 'event', 'policy', 'achievement', 'other'],
    default: 'general',
  },
  publishAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },
  targetRoles: [
    {
      type: String,
      enum: ['owner', 'moderator', 'member', 'viewer'],
    },
  ],
  readBy: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      readAt: { type: Date, default: Date.now },
    },
  ],
  reactions: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      type: { type: String, enum: ['like', 'celebrate', 'support', 'insightful'] },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  isPinned: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  attachments: [
    {
      type: { type: String, enum: ['link', 'image', 'file'] },
      url: { type: String },
      name: { type: String },
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

announcementSchema.index({ group: 1, isPinned: -1, createdAt: -1 });
announcementSchema.index({ group: 1, isActive: 1, publishAt: -1 });

announcementSchema.pre('save', function () {
  this.updatedAt = Date.now();
  
});

announcementSchema.virtual('readCount').get(function () {
  return this.readBy.length;
});

announcementSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Announcement', announcementSchema);