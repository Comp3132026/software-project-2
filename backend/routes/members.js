const express = require('express');
const Group = require('../models/Group');
const User = require('../models/User');
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

// Add member to group
router.post('/group/:groupId/add', auth, async (req, res) => {
  try {
    const { userId, role } = req.body;
    const validRoles = ['owner', 'moderator', 'member', 'viewer'];

    if (!userId) {
      return res.status(400).json({ message: 'userId is required.' });
    }

    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role.' });
    }

    const group = await Group.findById(req.params.groupId)
      .populate('owner', 'name email')
      .populate('members.user', 'name email');

    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    if (group.owner._id.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Only the group owner can add members.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const alreadyMember =
      group.owner._id.toString() === userId ||
      group.members.some((m) => m.user._id.toString() === userId);

    if (alreadyMember) {
      return res.status(400).json({ message: 'User is already a member of this group.' });
    }

    group.members.push({
      user: userId,
      role: role || 'member',
    });

    await group.save();

    const updatedGroup = await Group.findById(group._id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email');

    const members = updatedGroup.members.map((m) => ({
      userId: m.user._id,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
      joinedAt: m.joinedAt,
    }));

    return res.json({
      message: 'Member added successfully',
      members,
    });
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


// Leave group
router.post('/group/:groupId/leave', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    // Owner cannot leave without transferring ownership first
    if (group.owner.toString() === req.userId.toString()) {
      return res.status(400).json({
        message: 'Group owner cannot leave the group without transferring ownership first.',
      });
    }

    const memberIndex = group.members.findIndex(
      (m) => m.user.toString() === req.userId.toString()
    );

    if (memberIndex === -1) {
      return res.status(400).json({ message: 'You are not a member of this group.' });
    }

    group.members.splice(memberIndex, 1);
    await group.save();

    return res.json({ message: 'You have left the group successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
