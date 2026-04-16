const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: {
    type: String,
    enum: ['owner', 'moderator', 'member', 'viewer'],
    default: 'member',
  },
  isSuspended: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['active', 'inactive', 'unresponsive'],
    default: 'active',
  },
  joinedAt: { type: Date, default: Date.now },
});

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Group name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: '',
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Health', 'Fitness', 'Productivity', 'Learning', 'Finance', 'Social', 'Other'],
    default: 'Other',
  },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [memberSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

groupSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

groupSchema.virtual('memberCount').get(function () {
  return (this.members || []).length;
});

groupSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'group',
});

groupSchema.virtual('taskCount').get(function () {
  if (!Array.isArray(this.tasks)) {
    return 0;
  }
  return this.tasks.length;
});

groupSchema.virtual('completedTaskCount').get(function () {
  if (!Array.isArray(this.tasks)) {
    return 0;
  }
  return this.tasks.filter((t) => t.status === 'completed').length;
});

groupSchema.virtual('completionRate').get(function () {
  const total = this.taskCount;
  const completed = this.completedTaskCount;
  return total === 0 ? 0 : Math.round((completed / total) * 100);
});

groupSchema.virtual('inactiveCount').get(function () {
  return (this.members ?? []).filter((m) => m.status === 'inactive').length;
});

groupSchema.virtual('unresponsiveCount').get(function () {
  return (this.members ?? []).filter((m) => m.status === 'unresponsive').length;
});

groupSchema.virtual('activeCount').get(function () {
  return (this.members ?? []).filter((m) => m.status === 'active').length;
});

groupSchema.set('toJSON', { virtuals: true });
groupSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Group', groupSchema);