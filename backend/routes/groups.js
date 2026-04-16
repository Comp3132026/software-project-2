const express = require('express');
const { body, validationResult } = require('express-validator');
const Group = require('../models/Group');
const Task = require('../models/Task');
const { auth } = require('../middleware/auth');
const Announcement = require('../models/Announcement');
const Progress = require('../models/Progress');

const { logGroupAction } = require('../services/logService');
const router = express.Router();
const Message = require('../models/Message');


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
    await logGroupAction({
      group: group._id,
      action: 'Group created',
      performedBy: req.userId,
      details: group.name,
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
    await Group.findByIdAndDelete(group._id);

    return res.json({ message: 'Group and related tasks deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Publish announcement to a group
router.post('/:groupId/announcements', auth, async (req, res) => {
  try {
    const { title, content, priority, category, expiresAt, targetRoles, isPinned, attachments } =
      req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Announcement title is required.' });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Announcement content is required.' });
    }

    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    const isOwner = group.owner.toString() === req.userId.toString();
    const membership = group.members.find((m) => m.user.toString() === req.userId.toString());
    const isModerator = membership?.role === 'moderator';

    if (!isOwner && !isModerator) {
      return res
        .status(403)
        .json({ message: 'Only owners and moderators can publish announcements.' });
    }

    const announcement = await Announcement.create({
      group: group._id,
      author: req.userId,
      title: title.trim(),
      content: content.trim(),
      priority: priority || 'normal',
      category: category || 'general',
      expiresAt: expiresAt || undefined,
      targetRoles: Array.isArray(targetRoles) ? targetRoles : [],
      isPinned: Boolean(isPinned),
      attachments: Array.isArray(attachments) ? attachments : [],
    });
    await logGroupAction({
      group: group._id,
      action: 'Announcement published',
      performedBy: req.userId,
      details: title.trim(),
    });

    const populatedAnnouncement = await Announcement.findById(announcement._id)
      .populate('author', 'name email')
      .populate('group', 'name');

    return res.status(201).json({
      message: 'Announcement published successfully',
      announcement: populatedAnnouncement,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Submit a progress update to a group
router.post('/:groupId/progress', auth, async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      task,
      metrics,
      attachments,
      isPublic,
      isPinned,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Progress title is required.' });
    }

    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    const isMember =
      group.owner.toString() === req.userId.toString() ||
      group.members.some((m) => m.user.toString() === req.userId.toString());

    if (!isMember) {
      return res.status(403).json({ message: 'You are not a member of this group.' });
    }

    const progress = await Progress.create({
      group: group._id,
      user: req.userId,
      title: title.trim(),
      description: description?.trim() || '',
      type: type || 'daily_update',
      task: task || undefined,
      metrics: metrics || {},
      attachments: Array.isArray(attachments) ? attachments : [],
      isPublic: isPublic !== undefined ? Boolean(isPublic) : true,
      isPinned: Boolean(isPinned),
    });

    const populatedProgress = await Progress.findById(progress._id)
      .populate('user', 'name email')
      .populate('group', 'name')
      .populate('task', 'title status');

    return res.status(201).json({
      message: 'Progress submitted successfully',
      progress: populatedProgress,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// Get inactive members in a group
router.get('/:groupId/inactive', auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { days = 7 } = req.query;

    const group = await Group.findById(groupId).populate('members.user', 'name email');

    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    const isMember =
      group.owner.toString() === req.userId.toString() ||
      group.members.some((m) => m.user._id.toString() === req.userId.toString());

    if (!isMember) {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

    const inactiveMembers = [];

    for (const member of group.members) {
      const userId = member.user._id;

      const lastMessage = await Message.findOne({
        group: groupId,
        sender: userId,
      }).sort({ createdAt: -1 });

      const lastProgress = await Progress.findOne({
        group: groupId,
        user: userId,
      }).sort({ createdAt: -1 });

      const lastActivityDate = [lastMessage?.createdAt, lastProgress?.createdAt]
        .filter(Boolean)
        .sort((a, b) => b - a)[0];

      if (!lastActivityDate || lastActivityDate < cutoffDate) {
        inactiveMembers.push({
          user: member.user,
          role: member.role,
          lastActive: lastActivityDate || null,
        });
      }
    }

    return res.json({
      group: group.name,
      inactiveCount: inactiveMembers.length,
      inactiveMembers,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});


module.exports = router;