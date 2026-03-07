// utils/groupActivity.js
const Group = require('../models/Group');

/**
 * MS4.c – Update last activity and clear inactive flag when user becomes active again.
 */
async function recordGroupActivity(groupId, userId) {
  const group = await Group.findById(groupId);
  if (!group) {
    return;
  }

  const member = group.members.find((m) => m.user.toString() === userId.toString());
  if (!member) {
    return;
  }

  member.lastActiveAt = new Date();

  if (member.inactiveFlag?.isFlagged) {
    member.status = 'active';
    member.inactiveFlag.isFlagged = false;
    member.inactiveFlag.reason = undefined;
    member.inactiveFlag.flaggedBy = undefined;
    member.inactiveFlag.flaggedAt = undefined;
  }

  await group.save();
}

module.exports = { recordGroupActivity };
