const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: {
    type: String,
    required: function () {
      return !this.isDeleted;
    },
    maxlength: 2000,
  },
  type: {
    type: String,
    enum: ['normal', 'progress', 'warning'],
    default: 'normal',
  },
  isReported: { type: Boolean, default: false },
  reportedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
  pinned: { type: Boolean, default: false },
  warning: {
    reason: { type: String, default: null },
    warnedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    warnedAt: { type: Date, default: null },
  },
});

module.exports = mongoose.model('Message', messageSchema);
