const express = require('express');
const { body, validationResult } = require('express-validator');
const Group = require('../models/Group');
const Task = require('../models/Task');
const { Notification, HistoryLog } = require('../models/Notification');
const { auth } = require('../middleware/auth');

const router = express.Router();


/**
 * Validation for group creation/update
 * @returns {Array} Array of validation middlewares.
 */
const validateGroup = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description max 500 characters'),
  body('category')
    .isIn(['Health', 'Fitness', 'Productivity', 'Learning', 'Finance', 'Social', 'Other'])
    .withMessage('Invalid category'),
];

/**
 * Create a new group.
 *
 * @route POST /api/groups
 * @param {Object} req - Express request object containing group data.
 * @param {Object} res - Express response object.
 * @returns {Object} Newly created group details.
 */

// GS1: Create group - only logged in users can create
router.post('/', auth, validateGroup, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    }

    const { name, description, category } = req.body;

    const group = new Group({
      name,
      description: description || '',
      category,
      owner: req.userId,
      members: [{ user: req.userId, role: 'owner' }],
    });

    await group.save();

    // Log history
    await HistoryLog.create({
      group: group._id,
      action: 'Group created',
      performedBy: req.userId,
      details: `Group "${name}" was created`,
    });

    const populated = await Group.findById(group._id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email');

    res.status(201).json({ message: 'Group created successfully', group: populated });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

//Get all groups for user (as owner or member)
router.get('/', auth, async (req, res) => {
  try {
    const groups = await Group.find({
      $or: [{ owner: req.userId }, { 'members.user': req.userId }],
    })
      .populate('owner', 'name email')
      .populate('members.user', 'name email')
      .populate({
        path: 'tasks',
        select: 'status',
      })
      .sort({ updatedAt: -1 });

    //task status and complete
    res.json(
      groups.map((g) => ({
        ...g.toJSON(),
        taskCount: g.taskCount,
        completedTaskCount: g.completedTaskCount,
        completionRate: g.completionRate,
      }))
    );
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


/**
 * Get details of a specific group by ID.
 *
 * @route GET /api/groups/:groupId
 * @param {Object} req - Contains groupId as a route parameter.
 * @param {Object} res - Returns group info including members and roles.
 */
//Get single group with details
router.get('/:groupId', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId)
      .populate('owner', 'name email')
      .populate('members.user', 'name email')
      .populate({
        path: 'tasks',
        select: 'status',
      });

    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    // Check if user is a member
    const isMember =
      group.owner._id.toString() === req.userId.toString() ||
      group.members.some((m) => m.user._id.toString() === req.userId.toString());

    if (!isMember) {
      return res.status(403).json({ message: 'You are not a member of this group.' });
    }

    res.json({
      ...group.toJSON(),
      taskCount: group.taskCount,
      completedTaskCount: group.completedTaskCount,
      completionRate: group.completionRate,
      activeCount: group.activeCount,
      inactiveCount: group.inactiveCount,
      unresponsiveCount: group.unresponsiveCount,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
  
/**
 * Update group details (owner only).
 *
 * @route PUT /api/groups/:groupId
 * @param {Object} req - Contains groupId as a route parameter and updated group data.
 * @param {Object} res - Returns updated group details.
 */
router.put('/:groupId', auth, validateGroup, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    }

    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    if (group.owner.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Only the group owner can edit group details.' });
    }

    const { name, description, category } = req.body;
    group.name = name;
    group.description = description !== undefined ? description : group.description;
    group.category = category;
    await group.save();

    // Log history
    await HistoryLog.create({
      group: group._id,
      action: 'Group updated',
      performedBy: req.userId,
      details: 'Group details were updated',
    });

    const populated = await Group.findById(group._id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email');

    res.json({ message: 'Group updated successfully', group: populated });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * Delete group (owner only) - cascading deletion
 *
 * @route DELETE /api/groups/:groupId
 * @param {Object} req - Contains groupId as a route parameter.
 * @param {Object} res - Returns success message upon deletion.
 */
router.delete('/:groupId', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId).populate('members.user', 'name email');
    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    if (group.owner.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Only the group owner can delete the group.' });
    }

    //Notify all members before deletion
    const memberIds = group.members
      .filter((m) => m.user._id.toString() !== req.userId.toString())
      .map((m) => m.user._id);

    for (const memberId of memberIds) {
      await Notification.create({
        user: memberId,
        type: 'group_deleted',
        message: `The group "${group.name}" has been deleted by the owner.`,
      });
    }

    // Cascading delete - remove all tasks
    await Task.deleteMany({ group: group._id });

    // Delete history logs for this group
    await HistoryLog.deleteMany({ group: group._id });

    // Delete the group
    await Group.findByIdAndDelete(req.params.groupId);

    res.json({ message: 'Group and all associated data deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * Join group by name.
 *
 * @route POST /api/groups/join
 * @param {Object} req - Contains groupName in the request body.
 * @param {Object} res - Returns success message and group details upon joining.
 */
router.post('/join', auth, async (req, res) => {
  try {
    const { groupName } = req.body;
    if (!groupName) {
      return res.status(400).json({ message: 'Group name is required.' });
    }

    const group = await Group.findOne({
      name: { $regex: `^${groupName}$`, $options: 'i' },
    });
    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    const isMember = group.members.some((m) => m.user.toString() === req.userId.toString());
    if (isMember) {
      return res.status(400).json({ message: 'You are already a member of this group.' });
    }

    group.members.push({ user: req.userId, role: 'member' });
    await group.save();

    await HistoryLog.create({
      group: group._id,
      action: 'Member joined',
      performedBy: req.userId,
      details: 'A new member joined the group',
    });

    const populated = await Group.findById(group._id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email');

    res.json({ message: 'Joined group successfully', group: populated });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * Leave group.
 *
 * @route POST /api/groups/:groupId/leave
 * @param {Object} req - Contains groupId as a route parameter.
 * @param {Object} res - Returns success message upon leaving.
 */
router.post('/:groupId/leave', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    const isMember = group.members.some((m) => m.user.toString() === req.userId.toString());
    if (!isMember) {
      return res.status(400).json({ message: 'You are not a member of this group.' });
    }

    // If owner is leaving, must transfer ownership first
    if (group.owner.toString() === req.userId.toString()) {
      const { newOwnerId } = req.body;
      if (!newOwnerId) {
        return res.status(400).json({
          message: 'As the owner, you must assign a new owner before leaving.',
          requiresNewOwner: true,
          members: group.members.filter((m) => m.user.toString() !== req.userId.toString()),
        });
      }

      const newOwner = group.members.find((m) => m.user.toString() === newOwnerId);
      if (!newOwner) {
        return res.status(400).json({ message: 'New owner must be an existing member.' });
      }

      group.owner = newOwnerId;
      newOwner.role = 'owner';

      // Notify new owner
      await Notification.create({
        user: newOwnerId,
        group: group._id,
        type: 'role_changed',
        message: `You are now the owner of "${group.name}"`,
      });
    }

    // Remove leaving member
    group.members = group.members.filter((m) => m.user.toString() !== req.userId.toString());
    await group.save();

    // Remove task assignments
    await Task.updateMany({ group: req.params.groupId }, { $pull: { assignedTo: req.userId } });

    await HistoryLog.create({
      group: group._id,
      action: 'Member left',
      performedBy: req.userId,
      details: 'A member left the group',
    });

    res.json({ message: 'You have left the group successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * Transfer group ownership.
 *
 * @route POST /api/groups/:groupId/transfer-ownership
 * @param {Object} req - Contains groupId as a route parameter and newOwnerId in the body.
 * @param {Object} res - Returns success message and updated group details.
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

    const newOwner = group.members.find((m) => m.user.toString() === newOwnerId);
    if (!newOwner) {
      return res.status(400).json({ message: 'New owner must be an existing member.' });
    }

    // Update old owner's role
    const oldOwner = group.members.find((m) => m.user.toString() === req.userId.toString());
    if (oldOwner) {
      oldOwner.role = 'member';
    }

    group.owner = newOwnerId;
    newOwner.role = 'owner';
    await group.save();

    await Notification.create({
      user: newOwnerId,
      group: group._id,
      type: 'role_changed',
      message: `You are now the owner of "${group.name}"`,
    });

    await HistoryLog.create({
      group: group._id,
      action: 'Ownership transferred',
      performedBy: req.userId,
      details: 'Group ownership was transferred',
    });

    const populated = await Group.findById(group._id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email');

    res.json({
      message: 'Ownership transferred successfully',
      group: populated,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
