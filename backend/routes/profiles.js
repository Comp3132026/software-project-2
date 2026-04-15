// backend/routes/profiles.js
const express = require('express');
const mongoose = require('mongoose');
const { auth } = require('../middleware/auth');

const User = require('../models/User');
const Group = require('../models/Group');
const GroupMembership = require('../models/GroupMembership');
const Task = require('../models/Task');

const router = express.Router();

/**
 * GET /api/profiles/:groupId/:userId
 * MemS1: View member profile (role + contributions)
 */
router.get('/:groupId/:userId', auth, async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const viewerId = req.userId?.toString();

    if (
      !mongoose.Types.ObjectId.isValid(groupId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({ message: 'Invalid group or user id.' });
    }

    // 1) Load group
    const group = await Group.findById(groupId).lean();
    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    const ownerId = group.owner?.toString();

    // 2) Check that viewer is at least a member (or owner)
    const viewerIsOwner = viewerId === ownerId;
    const viewerMembership = await GroupMembership.findOne({
      groupId,
      userId: viewerId,
    }).lean();

    if (!viewerIsOwner && !viewerMembership) {
      return res
        .status(403)
        .json({ message: 'You are not authorized to view this profile.' });
    }

    // 3) Load target user
    const user = await User.findById(userId).select('name email').lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // 4) Load target membership (role, join date, status)
    const membership = await GroupMembership.findOne({
      groupId,
      userId,
    })
      .select('role joinDate status')
      .lean();

    // Owner may not have a membership row → treat separately
    let role = membership?.role || 'member';
    let joinDate = membership?.joinDate || null;
    let status = membership?.status || 'active';

    if (userId === ownerId) {
      role = 'owner';
      joinDate = group.createdAt || joinDate;
      status = 'active';
    }

    // 5) Contributions from Task model
    const [assignedCount, completedCount, createdCount, recentTasks] = await Promise.all([
      Task.countDocuments({ groupId, assignedTo: userId }),
      Task.countDocuments({
        groupId,
        assignedTo: userId,
        status: 'Completed',
      }),
      Task.countDocuments({ groupId, createdBy: userId }),
      Task.find({
        groupId,
        $or: [{ assignedTo: userId }, { createdBy: userId }],
      })
        .sort('-createdAt')
        .limit(5)
        .select('title status type dueDate createdAt assignedTo createdBy')
        .lean(),
    ]);

    const pendingCount = assignedCount - completedCount;
    const completionRate =
      assignedCount > 0 ? Math.round((completedCount / assignedCount) * 100) : 0;

    return res.json({
      profile: user,
      membership: {
        role,
        joinDate,
        status,
      },
      contributions: {
        assignedCount,
        completedCount,
        pendingCount,
        createdCount,
        completionRate,
      },
      recentTasks,
    });
  } catch (error) {
    console.error('Error fetching member profile:', error);
    return res.status(500).json({
      message: 'Server error fetching member profile',
      error: error.message,
    });
  }
});

module.exports = router;
