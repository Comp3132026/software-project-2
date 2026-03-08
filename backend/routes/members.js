const express = require('express');
const Group = require('../models/Group');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Fetch members for UI
router.get('/group/:groupId', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId)
      .populate('owner', 'name email')
      .populate('members.user', 'name email');

    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    const isMember =
      group.owner._id.toString() === req.userId.toString() ||
      group.members.some((m) => m.user._id.toString() === req.userId.toString());

    if (!isMember) {
      return res.status(403).json({ message: 'You are not a member of this group.' });
    }

    const members = group.members.map((m) => ({
      userId: m.user._id,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
      joinedAt: m.joinedAt,
    }));

    return res.json(members);
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// assignRole API endpoint
router.put('/group/:groupId/:userId/role', auth, async (req, res) => {
  try {
    const { role } = req.body;
    const { groupId, userId } = req.params;
    const validRoles = ['owner', 'moderator', 'member', 'viewer'];

    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role.' });
    }

    const group = await Group.findById(groupId)
      .populate('owner', 'name email')
      .populate('members.user', 'name email');

    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    if (group.owner._id.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Only the group owner can change roles.' });
    }

    if (group.owner._id.toString() === userId && role !== 'owner') {
      return res.status(400).json({ message: 'Cannot demote owner in this endpoint.' });
    }

    const memberIndex = group.members.findIndex((m) => m.user._id.toString() === userId);
    if (memberIndex === -1) {
      return res.status(404).json({ message: 'Member not found in this group.' });
    }

    group.members[memberIndex].role = role;

    if (role === 'owner') {
      const previousOwnerId = group.owner._id.toString();
      const previousOwnerMemberIndex = group.members.findIndex(
        (m) => m.user._id.toString() === previousOwnerId
      );
      if (previousOwnerMemberIndex !== -1) {
        group.members[previousOwnerMemberIndex].role = 'member';
      }
      group.owner = userId;
    }

    await group.save();

    const members = group.members.map((m) => ({
      userId: m.user._id,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
      joinedAt: m.joinedAt,
    }));

    return res.json({ message: 'Role updated successfully', members });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
