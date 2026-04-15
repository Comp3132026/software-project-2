const express = require('express');
const { body, validationResult } = require('express-validator');
const Group = require('../models/Group');
const Task = require('../models/Task');
const { auth } = require('../middleware/auth');

const router = express.Router();

const validateGroup = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('description').optional().trim().isLength({ max: 500 }),
  body('category')
    .isIn(['Health', 'Fitness', 'Productivity', 'Learning', 'Finance', 'Social', 'Other'])
    .withMessage('Invalid category'),
];

// Server-side auth check + form submission endpoint for creating groups
router.post('/', auth, validateGroup, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    }

    const { name, description, category } = req.body;
    const group = await Group.create({
      name,
      description: description || '',
      category,
      owner: req.userId,
      members: [{ user: req.userId, role: 'owner' }],
    });

    const populated = await Group.findById(group._id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email');

    return res.status(201).json({ message: 'Group created successfully', group: populated });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Fetch group data for UI
router.get('/', auth, async (req, res) => {
  try {
    const groups = await Group.find({
      $or: [{ owner: req.userId }, { 'members.user': req.userId }],
    })
      .populate('owner', 'name email')
      .populate('members.user', 'name email')
      .sort({ updatedAt: -1 });

    return res.json(groups);
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/:groupId', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId)
      .populate('owner', 'name email')
      .populate('members.user', 'name email')
      .populate({
        path: 'tasks',
        select: 'status title description dueDate assignedTo',
      });

    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    const isMember =
      group.owner._id.toString() === req.userId.toString() ||
      group.members.some((m) => m.user._id.toString() === req.userId.toString());

    if (!isMember) {
      return res.status(403).json({ message: 'You are not a member of this group.' });
    }

    return res.json({
      ...group.toJSON(),
      memberCount: group.memberCount,
      taskCount: group.taskCount,
      completedTaskCount: group.completedTaskCount,
      completionRate: group.completionRate,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update group details (owner only)
router.put('/:groupId', auth, validateGroup, async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: errors.array()[0].msg,
        errors: errors.array(),
      });
    }

    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    // Only owner can update the group
    if (group.owner.toString() !== req.userId.toString()) {
      return res
        .status(403)
        .json({ message: 'Only the group owner can edit group details.' });
    }

    const { name, description, category } = req.body;

    group.name = name;
    group.description = description !== undefined ? description : group.description;
    group.category = category;

    await group.save();

    const populated = await Group.findById(group._id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email');

    return res.json({
      message: 'Group updated successfully',
      group: populated,
    });

  } catch (error) {
    return res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
});

// deleteGroup API route with cascading deletion of tasks
router.delete('/:groupId', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    if (group.owner.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Only the group owner can delete the group.' });
    }

    await Task.deleteMany({ group: group._id });
    await Message.deleteMany({ group: group._id });
    await Warning.deleteMany({ group: group._id });
    await Notification.deleteMany({ group: group._id });
    await HistoryLog.deleteMany({ group: group._id });
    await Group.findByIdAndDelete(group._id);

    return res.json({ message: 'Group and related tasks deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * POST /api/groups/join
 * Join a group by name (required: groupName)
 */
router.post('/join', auth, async (req, res) => {
  try {
    const { groupName } = req.body;
    if (!groupName) {
      return res.status(400).json({ message: 'Group name is required.' });
    }

    const group = await Group.findOne({ name: groupName })
      .populate('owner', 'name email')
      .populate('members.user', 'name email');

    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    const alreadyMember = group.owner._id.toString() === req.userId.toString() ||
      group.members.some((m) => m.user._id.toString() === req.userId.toString());

    if (alreadyMember) {
      return res.status(400).json({ message: 'You are already a member of this group.' });
    }

    group.members.push({ user: req.userId, role: 'member' });
    await group.save();

    const updated = await Group.findById(group._id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email');

    return res.json({ message: 'Joined group successfully', group: updated });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * POST /api/groups/:groupId/leave
 * Leave a group (owner cannot leave)
 */
router.post('/:groupId/leave', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    if (group.owner.toString() === req.userId.toString()) {
      return res.status(400).json({ message: 'Owner cannot leave without transferring ownership.' });
    }

    const memberIndex = group.members.findIndex((m) => m.user.toString() === req.userId.toString());
    if (memberIndex === -1) {
      return res.status(400).json({ message: 'You are not a member of this group.' });
    }

    group.members.splice(memberIndex, 1);
    await group.save();

    return res.json({ message: 'You have left the group.' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * POST /api/groups/:groupId/transfer-ownership
 * Transfer group ownership (owner only, required: newOwnerId)
 */
router.post('/:groupId/transfer-ownership', auth, async (req, res) => {
  try {
    const { newOwnerId } = req.body;
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    if (group.owner.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Only the owner can transfer ownership.' });
    }

    if (!newOwnerId) {
      return res.status(400).json({ message: 'New owner ID is required.' });
    }

    const newOwnerIsMember = group.owner._id.toString() === newOwnerId.toString() ||
      group.members.some((m) => m.user._id.toString() === newOwnerId.toString());

    if (!newOwnerIsMember) {
      return res.status(400).json({ message: 'New owner must be a group member.' });
    }

    const oldOwnerIndex = group.members.findIndex((m) => m.user._id.toString() === group.owner._id.toString());
    if (oldOwnerIndex !== -1) {
      group.members[oldOwnerIndex].role = 'member';
    }

    const newOwnerIndex = group.members.findIndex((m) => m.user._id.toString() === newOwnerId.toString());
    if (newOwnerIndex !== -1) {
      group.members[newOwnerIndex].role = 'owner';
    } else {
      group.members.push({ user: newOwnerId, role: 'owner' });
    }

    group.owner = newOwnerId;
    await group.save();

    const updated = await Group.findById(group._id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email');

    return res.json({ message: 'Ownership transferred successfully', group: updated });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
