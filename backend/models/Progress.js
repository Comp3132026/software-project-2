const mongoose = require('mongoose');

// MemS6: Progress update model for sharing progress within group
const progressSchema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, trim: true, maxlength: 2000 },
  type: {
    type: String,
    enum: ['milestone', 'daily_update', 'achievement', 'reflection', 'other'],
    default: 'daily_update',
  },
  // Optional task/habit reference
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  // Progress metrics
  metrics: {
    completionPercentage: { type: Number, min: 0, max: 100 },
    streak: { type: Number, default: 0 },
    customMetric: { type: String },
    customValue: { type: String },
  },
  // Attachments/links
  attachments: [
    {
      type: { type: String, enum: ['image', 'link', 'file'] },
      url: { type: String },
      name: { type: String },
    },
  ],
  // Reactions/engagement
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      text: { type: String, maxlength: 500 },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  // Visibility
  isPublic: { type: Boolean, default: true },
  isPinned: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

progressSchema.index({ group: 1, createdAt: -1 });
progressSchema.index({ user: 1, createdAt: -1 });
progressSchema.index({ group: 1, isPinned: -1, createdAt: -1 });

progressSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Progress', progressSchema);
