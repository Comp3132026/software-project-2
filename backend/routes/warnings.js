// backend/routes/warnings.js
const express = require('express');
const Warning = require('../models/Warning');
const { Notification, HistoryLog } = require('../models/Notification');
const Group = require('../models/Group');
const Message = require('../models/Message');
const { auth } = require('../middleware/auth');

const router = express.Router();

/**
 * Helper: check if current user can moderate the group
 * (group owner or member with role 'moderator')
 */
function canModerateGroup(group, userId) {
  const isOwner = group.owner.toString() === userId.toString();
  const memberRecord = group.members.find((m) => m.user.toString() === userId.toString());
  const isModerator = memberRecord?.role === 'moderator';
  return { isOwner, isModerator, canModerate: isOwner || isModerator };
}

/**
 * MS2.c – Issue a warning to a user in a group
 * POST /api/warnings/group/:groupId
 * body: { userId, type, reason, severity?, messageId? }
 */
router.post('/group/:groupId', auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId, type, reason, severity = 'medium', messageId } = req.body;

    if (!userId || !type || !reason) {
      return res.status(400).json({ message: 'userId, type and reason are required.' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    // Permission check
    const { isOwner, isModerator, canModerate } = canModerateGroup(group, req.userId);
    if (!canModerate) {
      return res.status(403).json({ message: 'Only the owner or a moderator can issue warnings.' });
    }

    // Cannot warn the owner
    if (group.owner.toString() === userId.toString()) {
      return res.status(400).json({ message: 'You cannot issue a warning to the group owner.' });
    }

    // Target user must be a member
    const targetMember = group.members.find((m) => m.user.toString() === userId.toString());
    if (!targetMember) {
      return res.status(404).json({ message: 'Target user is not a member of this group.' });
    }

    // Optional: validate messageId belongs to this group
    let messageRef;
    if (messageId) {
      const msg = await Message.findById(messageId);
      if (!msg || msg.group.toString() !== groupId.toString()) {
        return res.status(400).json({ message: 'Message does not belong to this group.' });
      }
      messageRef = msg._id;
    }

    // Create warning record
    const warning = await Warning.create({
      group: groupId,
      user: userId,
      issuedBy: req.userId,
      type,
      reason,
      severity,
      messageRef,
    });

    // Notify the user
    await Notification.create({
      user: userId,
      group: groupId,
      type: 'warning',
      message: `You received a ${severity} warning in "${group.name}": ${reason}`,
    });

    // Log in history
    await HistoryLog.create({
      group: groupId,
      action: `Warning issued (${type})`,
      performedBy: req.userId,
      details: reason,
    });

    const populated = await Warning.findById(warning._id)
      .populate('user', 'name email')
      .populate('issuedBy', 'name');

    return res.status(201).json({
      message: 'Warning issued successfully.',
      warning: populated,
    });
  } catch (err) {
    console.error('Error issuing warning:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * MS2.c – Get warnings for a group (moderators / owner)
 * GET /api/warnings/group/:groupId?userId=&type=&severity=&acknowledged=&limit=
 */
router.get('/group/:groupId', auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId, type, severity, acknowledged, limit = 50 } = req.query;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    const { canModerate } = canModerateGroup(group, req.userId);
    if (!canModerate) {
      return res.status(403).json({
        message: 'Only the owner or a moderator can view group warnings.',
      });
    }

    const query = { group: groupId };
    if (userId) {
      query.user = userId;
    }
    if (type) {
      query.type = type;
    }
    if (severity) {
      query.severity = severity;
    }
    if (acknowledged === 'yes') {
      query.acknowledged = true;
    }
    if (acknowledged === 'no') {
      query.acknowledged = false;
    }

    const warnings = await Warning.find(query)
      .populate('user', 'name email')
      .populate('issuedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10));

    // Simple stats per violation type
    const stats = await Warning.aggregate([
      { $match: { group: group._id } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);

    return res.json({ warnings, stats });
  } catch (err) {
    console.error('Error fetching group warnings:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * MS2.c – Get warnings for the current user
 * GET /api/warnings/my-warnings?groupId=&unacknowledged=true
 */
router.get('/my-warnings', auth, async (req, res) => {
  try {
    const { groupId, unacknowledged } = req.query;

    const query = { user: req.userId };
    if (groupId) {
      query.group = groupId;
    }
    if (unacknowledged === 'true') {
      query.acknowledged = false;
    }

    const warnings = await Warning.find(query)
      .populate('group', 'name')
      .populate('issuedBy', 'name')
      .sort({ createdAt: -1 });

    return res.json(warnings);
  } catch (err) {
    console.error('Error fetching my warnings:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * MS2.c – Acknowledge a warning (only the warned user)
 * PUT /api/warnings/:warningId/acknowledge
 */
router.put('/:warningId/acknowledge', auth, async (req, res) => {
  try {
    const warning = await Warning.findById(req.params.warningId);
    if (!warning) {
      return res.status(404).json({ message: 'Warning not found.' });
    }

    if (warning.user.toString() !== req.userId.toString()) {
      return res.status(403).json({
        message: 'You can only acknowledge your own warnings.',
      });
    }

    warning.acknowledged = true;
    warning.acknowledgedAt = new Date();
    await warning.save();

    return res.json({ message: 'Warning acknowledged.', warning });
  } catch (err) {
    console.error('Error acknowledging warning:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * MS2.c – Delete a warning (owner / moderator)
 * DELETE /api/warnings/:warningId
 */
router.delete('/:warningId', auth, async (req, res) => {
  try {
    const warning = await Warning.findById(req.params.warningId);
    if (!warning) {
      return res.status(404).json({ message: 'Warning not found.' });
    }

    const group = await Group.findById(warning.group);
    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    const { canModerate } = canModerateGroup(group, req.userId);
    if (!canModerate) {
      return res.status(403).json({
        message: 'Only the owner or a moderator can delete warnings.',
      });
    }

    await Warning.deleteOne({ _id: warning._id });

    return res.json({ message: 'Warning deleted.' });
  } catch (err) {
    console.error('Error deleting warning:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
