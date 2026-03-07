const express = require('express');
const Group = require('../models/Group');
const Task = require('../models/Task');
const { HistoryLog } = require('../models/Notification');
const { auth } = require('../middleware/auth');

const router = express.Router();


/**
 * Get group dashboard with progress stats.
 *
 * @route GET /api/dashboard/group/:groupId
 * @param {Object} req - Contains groupId as a route parameter.
 * @param {Object} res - Returns group details and progress statistics.
 */
// GS8: Get group dashboard with progress stats
router.get('/group/:groupId', auth, async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId)
      .populate('owner', 'name email')
      .populate('members.user', 'name email');

    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    // Check membership
    const isMember =
      group.owner._id.toString() === req.userId.toString() ||
      group.members.some((m) => m.user._id.toString() === req.userId.toString());

    if (!isMember) {
      return res.status(403).json({ message: 'Not a member of this group.' });
    }

    // Get all tasks for the group
    const tasks = await Task.find({ group: groupId })
      .populate('assignedTo', 'name email')
      .populate('completedBy.user', 'name email');

    // Calculate overall progress
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    const inProgressTasks = tasks.filter((t) => t.status === 'in-progress').length;
    const pendingTasks = tasks.filter((t) => t.status === 'pending').length;
    const overdueTasks = tasks.filter(
      (t) => t.status !== 'completed' && t.dueDate && new Date(t.dueDate) < new Date()
    ).length;

    const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // GS8.d: Calculate per-member stats and detect inactive members
    const memberStats = await Promise.all(
      group.members.map(async (member) => {
        const memberTasks = tasks.filter((t) =>
          t.assignedTo.some((a) => a._id.toString() === member.user._id.toString())
        );
        const memberCompleted = memberTasks.filter((t) =>
          t.completedBy.some((c) => c.user._id.toString() === member.user._id.toString())
        ).length;

        // Check last activity
        const lastActivity = await HistoryLog.findOne({
          group: groupId,
          performedBy: member.user._id,
        }).sort({ createdAt: -1 });

        const daysSinceActivity = lastActivity
          ? Math.floor((Date.now() - lastActivity.createdAt) / (1000 * 60 * 60 * 24))
          : Math.floor((Date.now() - member.joinedAt) / (1000 * 60 * 60 * 24));

        const isInactive = daysSinceActivity > (group.inactiveThresholdDays || 7);

        return {
          _id: member.user._id,
          name: member.user.name,
          email: member.user.email,
          role: member.role,
          isSuspended: member.isSuspended,
          isFlagged: member.isFlagged,
          flagReason: member.flagReason,
          totalAssigned: memberTasks.length,
          completed: memberCompleted,
          completionRate:
            memberTasks.length > 0 ? Math.round((memberCompleted / memberTasks.length) * 100) : 0,
          lastActivityAt: lastActivity?.createdAt || member.joinedAt,
          daysSinceActivity,
          isInactive,
          joinedAt: member.joinedAt,
        };
      })
    );

    // Identify inactive members
    const inactiveMembers = memberStats.filter((m) => m.isInactive);

    res.json({
      group: {
        _id: group._id,
        name: group.name,
        category: group.category,
        description: group.description,
        owner: group.owner,
        memberCount: group.members.length,
        createdAt: group.createdAt,
      },
      progress: {
        overall: overallProgress,
        totalTasks,
        completedTasks,
        inProgressTasks,
        pendingTasks,
        overdueTasks,
      },
      memberStats,
      inactiveMembers,
      inactiveThresholdDays: group.inactiveThresholdDays || 7,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


/**
 * Get filtered tasks for a group.
 *
 * @route GET /api/dashboard/group/:groupId/tasks
 * @param {Object} req - Contains groupId as a route parameter and query parameters for filtering.
 * @param {Object} res - Returns filtered tasks and filter statistics.
 */
// GS8.b: Get filtered tasks
router.get('/group/:groupId/tasks', auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const {
      status,
      assignedTo,
      priority,
      startDate,
      endDate,
      isHabit,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // Build query
    const query = { group: groupId };

    if (status) {
      query.status = status;
    }

    if (assignedTo) {
      query.assignedTo = assignedTo;
    }

    if (priority) {
      query.priority = priority;
    }

    if (isHabit !== undefined) {
      query.isHabit = isHabit === 'true';
    }

    // Date filtering
    if (startDate || endDate) {
      query.dueDate = {};
      if (startDate) {
        query.dueDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.dueDate.$lte = new Date(endDate);
      }
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('completedBy.user', 'name email')
      .sort(sortOptions);

    // Calculate filter stats
    const allTasks = await Task.find({ group: groupId });
    const filterStats = {
      total: allTasks.length,
      filtered: tasks.length,
      byStatus: {
        pending: allTasks.filter((t) => t.status === 'pending').length,
        'in-progress': allTasks.filter((t) => t.status === 'in-progress').length,
        completed: allTasks.filter((t) => t.status === 'completed').length,
      },
      byPriority: {
        low: allTasks.filter((t) => t.priority === 'low').length,
        medium: allTasks.filter((t) => t.priority === 'medium').length,
        high: allTasks.filter((t) => t.priority === 'high').length,
      },
    };

    res.json({ tasks, filterStats });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


/**
 * Update inactive threshold and notification settings for a group.
 *
 * @route PUT /api/dashboard/group/:groupId/settings
 * @param {Object} req - Contains groupId as a route parameter and settings in the body.
 * @param {Object} res - Returns updated group details.
 */
// GS8: Update inactive threshold
router.put('/group/:groupId/settings', auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { inactiveThresholdDays, notificationSettings } = req.body;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    if (group.owner.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Only the owner can update settings.' });
    }

    if (inactiveThresholdDays !== undefined) {
      group.inactiveThresholdDays = inactiveThresholdDays;
    }

    if (notificationSettings) {
      group.notificationSettings = { ...group.notificationSettings, ...notificationSettings };
    }

    await group.save();

    await HistoryLog.create({
      group: groupId,
      action: 'Group settings updated',
      actionType: 'settings_changed',
      performedBy: req.userId,
      details: 'Dashboard settings were updated',
    });

    res.json({ message: 'Settings updated', group });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


/**
 * Get progress over time (for charts)
 * 
 * @route GET /api/dashboard/group/:groupId/progress-history
 * @param {Object} req - Contains groupId as a route parameter and optional days query parameter.
 * @param {Object} res - Returns progress data over time.
 */
// GS8: Get progress over time (for charts)
router.get('/group/:groupId/progress-history', auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get completed tasks grouped by date
    const tasks = await Task.find({
      group: groupId,
      'completedBy.completedAt': { $gte: startDate },
    });

    // Group completions by date
    const progressByDate = {};
    tasks.forEach((task) => {
      task.completedBy.forEach((completion) => {
        if (completion.completedAt >= startDate) {
          const date = completion.completedAt.toISOString().split('T')[0];
          progressByDate[date] = (progressByDate[date] || 0) + 1;
        }
      });
    });

    // Fill in missing dates with 0
    const result = [];
    const currentDate = new Date(startDate);
    const endDate = new Date();

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      result.push({
        date: dateStr,
        completions: progressByDate[dateStr] || 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * Flag a member as inactive/unresponsive.
 *
 * @route PATCH /api/dashboard/:groupId/members/:userId/flag-inactive
 * @param {Object} req - Contains groupId and userId as route parameters and reason in the body.
 * @param {Object} res - Returns updated member status.
 */
router.patch('/:groupId/members/:userId/flag-inactive', auth, async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const { reason } = req.body;

    // populate members.user so we can return nice info
    const group = await Group.findById(groupId).populate('members.user', 'name email');
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // find acting user in members
    const actingMember = group.members.find((m) => m.user._id.toString() === req.userId.toString());

    if (!actingMember) {
      return res.status(403).json({ message: 'You are not a member of this group' });
    }

    // Only owner or moderator can flag
    if (!['owner', 'moderator'].includes(actingMember.role)) {
      return res.status(403).json({
        message: 'Only the group owner or a moderator can flag members as inactive',
      });
    }

    const member = group.members.find((m) => m.user._id.toString() === userId.toString());

    if (!member) {
      return res.status(404).json({ message: 'Member not found in this group' });
    }

    // Don’t allow flagging the owner as inactive
    if (member.role === 'owner') {
      return res.status(400).json({ message: 'You cannot flag the group owner as inactive' });
    }

    member.status = 'inactive';
    member.inactiveFlag = {
      isFlagged: true,
      reason: reason?.trim() || 'Flagged as inactive/unresponsive',
      flaggedBy: req.userId,
      flaggedAt: new Date(),
    };

    await group.save();

    const inactivityDays = member.lastActiveAt
      ? Math.floor((Date.now() - new Date(member.lastActiveAt)) / (1000 * 60 * 60 * 24))
      : null;

    return res.json({
      message: 'Member flagged as inactive',
      member: {
        id: member.user._id,
        name: member.user.name,
        email: member.user.email,
        role: member.role,
        status: member.status,
        inactiveFlag: member.inactiveFlag,
        inactivityDays,
      },
    });
  } catch (err) {
    console.error('Error flagging member inactive', err);
    res.status(500).json({ message: 'Server error', error: err.message || String(err) });
  }
});

/** * Get dashboard including flagged members.
 *
 * @route GET /api/dashboard/:groupId
 * @param {Object} req - Contains groupId as a route parameter.
 * @param {Object} res - Returns group details and flagged members.
 */
router.get('/:groupId', auth, async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId).populate('members.user', 'name email');
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // ...existing dashboard logic (task stats, etc.)

    // MS4.d – build flagged members section
    const flaggedMembers = group.members
      .filter((m) => m.inactiveFlag && m.inactiveFlag.isFlagged)
      .map((m) => {
        const inactivityDays = m.lastActiveAt
          ? Math.floor((Date.now() - new Date(m.lastActiveAt)) / (1000 * 60 * 60 * 24))
          : null;

        return {
          userId: m.user._id,
          name: m.user.name,
          email: m.user.email,
          role: m.role,
          inactivityDays,
          reason: m.inactiveFlag.reason,
          flaggedAt: m.inactiveFlag.flaggedAt,
          flaggedBy: m.inactiveFlag.flaggedBy,
        };
      });

    return res.json({
      // ...your existing summary fields
      flaggedMembers, // <– MS4.d
    });
  } catch (err) {
    console.error('Error loading dashboard', err);
    res.status(500).json({ message: 'Server error', error: err.message || String(err) });
  }
});

module.exports = router;
