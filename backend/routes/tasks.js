const express = require('express');
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Group = require('../models/Group');
const { Notification, HistoryLog } = require('../models/Notification');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Validation
const validateTask = [
  body('title').trim().isLength({ min: 2, max: 200 }).withMessage('Title must be 2-200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description max 1000 characters'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
  body('frequency')
    .optional()
    .isIn(['daily', 'weekly', 'monthly', 'once'])
    .withMessage('Invalid frequency'),
];

// GS12: Create task/habit
router.post('/', auth, validateTask, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ message: errors.array()[0].msg, errors: errors.array() });
    }

    const { groupId, title, description, dueDate, priority, assignedTo, isHabit, frequency } =
      req.body;

    if (!groupId) {
      return res.status(400).json({ message: 'Group ID is required.' });
    }

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    // Check permission - owner and members can create, not viewers
    const member = group.members.find((m) => m.user.toString() === req.userId.toString());
    const isOwner = group.owner.toString() === req.userId.toString();

    if (!isOwner && (!member || member.role === 'viewer')) {
      return res.status(403).json({ message: 'Viewers cannot create tasks.' });
    }

    // GS12c: Check for duplicate task title
    const existingTask = await Task.findOne({
      group: groupId,
      title: { $regex: `^${title}$`, $options: 'i' },
    });
    if (existingTask) {
      return res.status(400).json({
        message: 'A task with this title already exists in the group.',
      });
    }

    // Validate assignees are group members
    const validAssignees = [];
    if (assignedTo && assignedTo.length > 0) {
      for (const userId of assignedTo) {
        const isMember =
          group.members.some((m) => m.user.toString() === userId) ||
          group.owner.toString() === userId;
        if (isMember) {
          validAssignees.push(userId);
        }
      }
    }

    const task = new Task({
      title,
      description: description || '',
      group: groupId,
      createdBy: req.userId,
      dueDate: dueDate || null,
      priority: priority || 'medium',
      assignedTo: validAssignees,
      isHabit: isHabit || false,
      frequency: frequency || 'once',
    });

    await task.save();

    // Notify assigned users
    for (const userId of validAssignees) {
      if (userId !== req.userId.toString()) {
        await Notification.create({
          user: userId,
          group: groupId,
          type: 'task_assigned',
          message: `New task assigned to you: "${title}"`,
        });
      }
    }

    await HistoryLog.create({
      group: groupId,
      action: 'Task created',
      performedBy: req.userId,
      details: `Task "${title}" was created`,
    });

    const populated = await Task.findById(task._id)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email');

    res.status(201).json({ message: 'Task created successfully', task: populated });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get tasks for a group
router.get('/group/:groupId', auth, async (req, res) => {
  try {
    const { status, assignedTo, priority } = req.query;
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    // Check if user is a member
    const isMember =
      group.owner.toString() === req.userId.toString() ||
      group.members.some((m) => m.user.toString() === req.userId.toString());

    if (!isMember) {
      return res.status(403).json({ message: 'You are not a member of this group.' });
    }

    const query = { group: req.params.groupId };
    if (status) {
      query.status = status;
    }
    if (assignedTo) {
      query.assignedTo = assignedTo;
    }
    if (priority) {
      query.priority = priority;
    }

    const tasks = await Task.find(query)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('completedBy.user', 'name email')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get tasks assigned to current user
router.get('/my-tasks', auth, async (req, res) => {
  try {
    const { groupId, status } = req.query;

    const query = { assignedTo: req.userId };
    if (groupId) {
      query.group = groupId;
    }
    if (status) {
      query.status = status;
    }
    const tasks = await Task.find(query)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('group', 'name category members')
      .populate('completedBy.user', 'name email')
      .sort({ dueDate: 1, createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single task
router.get('/:taskId', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('completedBy.user', 'name email')
      .populate('group', 'name');

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GS14: Update task
router.put('/:taskId', auth, validateTask, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    }

    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    const group = await Group.findById(task.group);
    const isOwner = group.owner.toString() === req.userId.toString();
    const member =
      group.members.find((m) => m.user.toString() === req.userId.toString()) || {};

    if (!isOwner && (!member || member.role === 'viewer')) {
      return res.status(403).json({ message: 'Viewers cannot update tasks.' });
    }

    const { title, description, dueDate, priority, status, isHabit, frequency, assignedTo } =
      req.body;

    // Check duplicate title
    if (title && title !== task.title) {
      const existing = await Task.findOne({
        group: task.group,
        title: { $regex: `^${title}$`, $options: 'i' },
        _id: { $ne: task._id },
      });
      if (existing) {
        return res.status(400).json({ message: 'A task with this title already exists.' });
      }
    }

    if (title) {
      task.title = title;
    }
    if (description !== undefined) {
      task.description = description;
    }
    if (dueDate !== undefined) {
      task.dueDate = dueDate;
    }
    if (priority) {
      task.priority = priority;
    }
    if (status) {
      task.status = status;
    }
    if (isHabit !== undefined) {
      task.isHabit = isHabit;
    }
    if (frequency) {
      task.frequency = frequency;
    }
    if (assignedTo !== undefined) {
      // Validate assignees similar to creation
      const validAssignees = [];
      if (assignedTo.length > 0) {
        for (const userId of assignedTo) {
          const isMember =
            group.members.some((m) => m.user.toString() === userId) ||
            group.owner.toString() === userId;

          if (isMember) {
            validAssignees.push(userId);
          }
        }
      }

      task.assignedTo = validAssignees;
    }

    await task.save();

    await HistoryLog.create({
      group: task.group,
      action: 'Task updated',
      performedBy: req.userId,
      details: `Task "${task.title}" was updated`,
    });

    const populated = await Task.findById(task._id)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('completedBy.user', 'name email');

    res.json({ message: 'Task updated successfully', task: populated });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GS10: Assign task to members
router.put('/:taskId/assign', auth, async (req, res) => {
  try {
    const { assignedTo } = req.body;

    const task = await Task.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    const group = await Group.findById(task.group);
    const isOwner = group.owner.toString() === req.userId.toString();
    const member =
      group.members.find((m) => m.user.toString() === req.userId.toString()) || {};

    if (!isOwner && (!member || member.role === 'viewer')) {
      return res.status(403).json({ message: 'Viewers cannot assign tasks.' });
    }

    // Validate assignees
    const validAssignees = [];
    if (assignedTo && assignedTo.length > 0) {
      for (const userId of assignedTo) {
        const isMember =
          group.members.some((m) => m.user.toString() === userId) ||
          group.owner.toString() === userId;
        if (isMember) {
          validAssignees.push(userId);
        }
      }
    }

    // Find new assignees to notify
    const newAssignees = validAssignees.filter(
      (id) => !task.assignedTo.map((a) => a.toString()).includes(id),
    );

    task.assignedTo = validAssignees;
    await task.save();

    // Notify new assignees
    for (const userId of newAssignees) {
      await Notification.create({
        user: userId,
        group: task.group,
        type: 'task_assigned',
        message: `You have been assigned to task: "${task.title}"`,
      });
    }

    await HistoryLog.create({
      group: task.group,
      action: 'Task assigned',
      performedBy: req.userId,
      details: `Task "${task.title}" assignments updated`,
    });

    const populated = await Task.findById(task._id)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email');

    res.json({ message: 'Task assignments updated', task: populated });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark task complete
router.post('/:taskId/complete', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    const group = await Group.findById(task.group);
    const isOwner = group.owner.toString() === req.userId.toString();
    const isAssigned = task.assignedTo.some((u) => u.toString() === req.userId.toString());

    if (!isOwner && !isAssigned) {
      return res.status(403).json({ message: 'You are not assigned to this task.' });
    }

    const alreadyCompleted = task.completedBy.some(
      (c) => c.user.toString() === req.userId.toString(),
    );

    if (alreadyCompleted) {
      return res.status(400).json({ message: 'You have already completed this task.' });
    }

    task.completedBy.push({ user: req.userId });

    if (task.assignedTo.length > 0 && task.completedBy.length >= task.assignedTo.length) {
      task.status = 'completed';
    } else if (task.completedBy.length > 0) {
      task.status = 'in-progress';
    }

    await task.save();

    await HistoryLog.create({
      group: task.group,
      action: 'Task completed',
      performedBy: req.userId,
      details: `User completed task "${task.title}"`,
    });

    const populated = await Task.findById(task._id)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('completedBy.user', 'name email');

    res.json({ message: 'Task marked as complete', task: populated });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete task
router.delete('/:taskId', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    const group = await Group.findById(task.group);
    const isOwner = group.owner.toString() === req.userId.toString();
    const isCreator = task.createdBy.toString() === req.userId.toString();

    if (!isOwner && !isCreator) {
      return res.status(403).json({
        message: 'Only the group owner or task creator can delete this task.',
      });
    }

    await Task.findByIdAndDelete(req.params.taskId);

    await HistoryLog.create({
      group: task.group,
      action: 'Task deleted',
      performedBy: req.userId,
      details: `Task "${task.title}" was deleted`,
    });

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
