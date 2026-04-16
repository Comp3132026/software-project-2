const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RoleEnum = ['Owner', 'Admin', 'Member', 'Viewer'];

const groupMembershipSchema = new Schema(
  {
    groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: RoleEnum, default: 'Member' },
    status: { type: String, default: 'Active' },
    joinDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

groupMembershipSchema.index({ groupId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('GroupMembership', groupMembershipSchema);
