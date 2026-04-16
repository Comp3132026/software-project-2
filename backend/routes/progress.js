const express = require('express');
const { body, validationResult } = require('express-validator');
const Progress = require('../models/Progress');
const Group = require('../models/Group');
const Task = require('../models/Task');
const { auth } = require('../middleware/auth');
const { HistoryLog } = require('../models/Notification');

const router = express.Router();

// Validation middleware
const validateProgress = [
  body('title').trim().isLength({ min: 2, max: 200 }).withMessage('Title must be 2-200 characters'),
  body('description').optional().trim().isLength({ max: 2000 }),
  body('type')
    .optional()
    .isIn(['milestone', 'daily_update', 'achievement', 'reflection', 'other'])
    .withMessage('Invalid progress type'),
];

// GS8.c: Create progress entry
router.post('/', auth, validateProgress, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    }

    const { groupId, title, description, type, taskId, metrics, attachments } = req.body;

    if (!groupId) {
      return res.status(400).json({ message: 'Group ID is required.' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    // Check if user is member of group
    const isMember =
      group.owner.toString() === req.userId.toString() ||
      group.members.some((m) => m.user.toString() === req.userId.toString());

    if (!isMember) {
      return res.status(403).json({ message: 'You are not a member of this group.' });
    }

    // Validate task if provided
    if (taskId) {
      const task = await Task.findById(taskId);
      if (!task || task.group.toString() !== groupId) {
        return res.status(400).json({ message: 'Task not found in this group.' });
      }
    }

    const progress = new Progress({
      group: groupId,
      user: req.userId,
      title,
      description: description || '',
      type: type || 'daily_update',
      task: taskId || null,
      metrics: metrics || {},
      attachments: attachments || [],
    });

    await progress.save();

    // Log to history
    await HistoryLog.create({
      group: groupId,
      action: 'Progress created',
      performedBy: req.userId,
      details: `Progress "${title}" was created`,
    });

    const populated = await Progress.findById(progress._id)
      .populate('user', 'name email')
      .populate('task', 'title')
      .populate('group', 'name');

    res.status(201).json({ message: 'Progress created successfully', progress: populated });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get progress entries for a group
router.get('/group/:groupId', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    // Check if user is member
    const isMember =
      group.owner.toString() === req.userId.toString() ||
      group.members.some((m) => m.user.toString() === req.userId.toString());

    if (!isMember) {
      return res.status(403).json({ message: 'You are not a member of this group.' });
    }

    const { type, userId } = req.query;
    const query = { group: req.params.groupId };

    if (type) {
      query.type = type;
    }
    if (userId) {
      query.user = userId;
    }

    const progressEntries = await Progress.find(query)
      .populate('user', 'name email')
      .populate('task', 'title')
      .sort({ createdAt: -1 });

    res.json(progressEntries);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get progress entries for current user
router.get('/my-progress', auth, async (req, res) => {
  try {
    const { groupId, type } = req.query;

    const query = { user: req.userId };
    if (groupId) {
      query.group = groupId;
    }
    if (type) {
      query.type = type;
    }

    const progressEntries = await Progress.find(query)
      .populate('group', 'name')
      .populate('task', 'title')
      .sort({ createdAt: -1 });

    res.json(progressEntries);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single progress entry
router.get('/:progressId', auth, async (req, res) => {
  try {
    const progress = await Progress.findById(req.params.progressId)
      .populate('user', 'name email')
      .populate('task', 'title')
      .populate('group', 'name');

    if (!progress) {
      return res.status(404).json({ message: 'Progress not found.' });
    }

    // Check if user can view
    const group = await Group.findById(progress.group._id);
    const isMember =
      group.owner.toString() === req.userId.toString() ||
      group.members.some((m) => m.user.toString() === req.userId.toString());

    if (!isMember) {
      return res.status(403).json({ message: 'You are not a member of this group.' });
    }

    res.json(progress);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update progress entry
router.put('/:progressId', auth, validateProgress, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    }

    const progress = await Progress.findById(req.params.progressId);

    if (!progress) {
      return res.status(404).json({ message: 'Progress not found.' });
    }

    // Only owner or creator can update
    if (progress.user.toString() !== req.userId.toString()) {
      const group = await Group.findById(progress.group);
      if (group.owner.toString() !== req.userId.toString()) {
        return res.status(403).json({ message: 'You cannot update this progress.' });
      }
    }

    const { title, description, type, taskId, metrics, attachments } = req.body;

    if (title) {
      progress.title = title;
    }
    if (description !== undefined) {
      progress.description = description;
    }
    if (type) {
      progress.type = type;
    }
    if (taskId !== undefined) {
      progress.task = taskId;
    }
    if (metrics) {
      progress.metrics = { ...progress.metrics, ...metrics };
    }
    if (attachments) {
      progress.attachments = attachments;
    }

    await progress.save();

    await HistoryLog.create({
      group: progress.group,
      action: 'Progress updated',
      performedBy: req.userId,
      details: `Progress "${progress.title}" was updated`,
    });

    const populated = await Progress.findById(progress._id)
      .populate('user', 'name email')
      .populate('task', 'title')
      .populate('group', 'name');

    res.json({ message: 'Progress updated successfully', progress: populated });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete progress entry
router.delete('/:progressId', auth, async (req, res) => {
  try {
    const progress = await Progress.findById(req.params.progressId);

    if (!progress) {
      return res.status(404).json({ message: 'Progress not found.' });
    }

    // Only owner or creator can delete
    if (progress.user.toString() !== req.userId.toString()) {
      const group = await Group.findById(progress.group);
      if (group.owner.toString() !== req.userId.toString()) {
        return res.status(403).json({ message: 'You cannot delete this progress.' });
      }
    }

    const groupId = progress.group;
    const title = progress.title;

    await Progress.findByIdAndDelete(req.params.progressId);

    await HistoryLog.create({
      group: groupId,
      action: 'Progress deleted',
      performedBy: req.userId,
      details: `Progress "${title}" was deleted`,
    });

    res.json({ message: 'Progress deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get progress statistics for a group
router.get('/stats/:groupId', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    // Check if user is member
    const isMember =
      group.owner.toString() === req.userId.toString() ||
      group.members.some((m) => m.user.toString() === req.userId.toString());

    if (!isMember) {
      return res.status(403).json({ message: 'You are not a member of this group.' });
    }

    const totalProgress = await Progress.countDocuments({ group: req.params.groupId });
    const progressByType = await Progress.aggregate([
      { $match: { group: require('mongoose').Types.ObjectId(req.params.groupId) } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);

    const progressByUser = await Progress.aggregate([
      { $match: { group: require('mongoose').Types.ObjectId(req.params.groupId) } },
      { $group: { _id: '$user', count: { $sum: 1 } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userInfo' } },
      { $unwind: '$userInfo' },
      { $project: { _id: 1, count: 1, 'userInfo.name': 1, 'userInfo.email': 1 } },
    ]);

    res.json({
      totalProgress,
      progressByType,
      progressByUser,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
