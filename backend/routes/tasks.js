const express = require('express');
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Group = require('../models/Group');
const { auth } = require('../middleware/auth');

const router = express.Router();

const validateTask = [
  body('title').trim().isLength({ min: 2, max: 200 }).withMessage('Title must be 2-200 characters'),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
  body('frequency').optional().isIn(['daily', 'weekly', 'monthly', 'once']).withMessage('Invalid frequency'),
  body('isHabit').optional().isBoolean().withMessage('isHabit must be boolean'),
];

// Create task/habit
router.post('/', auth, validateTask, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    }

    const { groupId, title, description, dueDate, priority, isHabit, frequency } = req.body;
    if (!groupId) {
      return res.status(400).json({ message: 'Group ID is required.' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    const isMember =
      group.owner.toString() === req.userId.toString() ||
      group.members.some((m) => m.user.toString() === req.userId.toString());

    if (!isMember) {
      return res.status(403).json({ message: 'Not allowed to create tasks in this group.' });
    }

    const task = await Task.create({
      title,
      description: description || '',
      group: groupId,
      createdBy: req.userId,
      dueDate: dueDate || null,
      priority: priority || 'medium',
      isHabit: !!isHabit,
      frequency: frequency || 'once',
      assignedTo: [],
    });

    const populated = await Task.findById(task._id)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email');

    return res.status(201).json({ message: 'Task created successfully', task: populated });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// getTasks API with filtering logic (also reusable by UI)
router.get('/group/:groupId', auth, async (req, res) => {
  try {
    const { status, assignedTo, priority, isHabit } = req.query;

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

    const query = { group: req.params.groupId };
    if (status) query.status = status;
    if (assignedTo) query.assignedTo = assignedTo;
    if (priority) query.priority = priority;
    if (typeof isHabit !== 'undefined') query.isHabit = isHabit === 'true';

    const tasks = await Task.find(query)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    return res.json(tasks);
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// assignTask API endpoint linking task to member ID
router.put('/:taskId/assign', auth, async (req, res) => {
  try {
    const { memberId } = req.body;
    if (!memberId) {
      return res.status(400).json({ message: 'memberId is required.' });
    }

    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    const group = await Group.findById(task.group);
    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    if (group.owner.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Only the group owner can assign tasks.' });
    }

    const isMember =
      group.owner.toString() === memberId ||
      group.members.some((m) => m.user.toString() === memberId);

    if (!isMember) {
      return res.status(400).json({ message: 'Selected member is not in this group.' });
    }

    task.assignedTo = [memberId];
    await task.save();

    const populated = await Task.findById(task._id)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email');

    return res.json({ message: 'Task assigned successfully', task: populated });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
