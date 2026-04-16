const express = require('express');
const mongoose = require('mongoose');
const DirectMessage = require('../models/DirectMessage');
const GroupMembership = require('../models/GroupMembership');
const Group = require('../models/Group');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

/**
 * Helper: ensure both users are members of the group (if group is provided)
 */
async function ensureGroupMembership(groupId, userAId, userBId) {
  if (!groupId) {
    return;
  } // no group context → nothing to check

  // Load the group to get the owner
  const group = await Group.findById(groupId).lean();
  if (!group) {
    const err = new Error('Group not found');
    err.statusCode = 404;
    throw err;
  }

  const ownerId = group.owner?.toString();

  // Load memberships for both users in this group
  const memberships = await GroupMembership.find({
    groupId: groupId,
    userId: { $in: [userAId, userBId] },
    // If you have a status field and want only active:
    // status: 'active'
  }).lean();

  const membershipUserIds = memberships.map((m) => m.userId.toString());

  const userAString = userAId.toString();
  const userBString = userBId.toString();

  // Treat owner as a member, even if they don't have a GroupMembership row
  const isUserAMember = userAString === ownerId || membershipUserIds.includes(userAString);
  const isUserBMember = userBString === ownerId || membershipUserIds.includes(userBString);

  if (!isUserAMember || !isUserBMember) {
    const err = new Error('Both users must be members of this group');
    err.statusCode = 403;
    throw err;
  }
}

/**
 * POST /api/messages
 * Send a direct message (GS7.c)
 */
router.post('/', auth, async (req, res) => {
  try {
    const { to, subject, content, group } = req.body;
    const from = req.userId;

    if (!to || !mongoose.Types.ObjectId.isValid(to)) {
      return res.status(400).json({ message: 'Valid recipient is required.' });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Message body is required.' });
    }

    if (content.trim().length > 5000) {
      return res.status(400).json({ message: 'Message is too long.' });
    }

    if (subject && subject.trim().length > 200) {
      return res.status(400).json({ message: 'Subject is too long.' });
    }

    const message = await DirectMessage.create({
      from,
      to,
      subject: subject?.trim() || undefined,
      content: content.trim(),
      group: group || undefined,
    });

    await message.populate('from to', 'name email');

    return res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(error.statusCode || 500).json({
      message: error.statusCode ? error.message : 'Server error sending message',
      error: error.message,
    });
  }
});

/**
 * GET /api/messages/thread/:userId
 * Get all messages between current user and :userId (GS7 – view conversation)
 */
router.get('/thread/:userId', auth, async (req, res) => {
  try {
    const me = req.userId.toString();
    const other = req.params.userId;
    const { group } = req.query;

    if (!mongoose.Types.ObjectId.isValid(other)) {
      return res.status(400).json({ message: 'Invalid user id.' });
    }

    const criteria = {
      $or: [
        { from: me, to: other },
        { from: other, to: me },
      ],
    };

    if (group && mongoose.Types.ObjectId.isValid(group)) {
      criteria.group = group;
    }

    const messages = await DirectMessage.find(criteria)
      .sort('createdAt')
      .populate('from to', 'name email');

    return res.json({ messages });
  } catch (error) {
    console.error('Error fetching message thread:', error);
    res.status(500).json({ message: 'Server error fetching thread', error: error.message });
  }
});

/**
 * GET /api/messages/conversations
 * Get conversation list with latest message + unread count
 */
router.get('/conversations', auth, async (req, res) => {
  try {
    const me = req.userId.toString();

    const docs = await DirectMessage.find({
      $or: [{ from: me }, { to: me }],
    })
      .sort('-createdAt')
      .lean();

    const convoMap = new Map(); // otherUserId -> { lastMessage, unreadCount }

    for (const msg of docs) {
      const from = msg.from.toString();
      const to = msg.to.toString();

      const otherId = from === me ? to : from;

      if (!convoMap.has(otherId)) {
        convoMap.set(otherId, {
          lastMessage: msg,
          unreadCount: 0,
        });
      }

      if (to === me && !msg.isRead) {
        convoMap.get(otherId).unreadCount += 1;
      }
    }

    const otherIds = Array.from(convoMap.keys());
    const users = await User.find({ _id: { $in: otherIds } })
      .select('name email')
      .lean();

    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    const result = otherIds.map((id) => ({
      user: userMap.get(id),
      lastMessage: convoMap.get(id).lastMessage,
      unreadCount: convoMap.get(id).unreadCount,
    }));

    res.json(result);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Server error fetching conversations', error: error.message });
  }
});

/**
 * PUT /api/messages/:id/read
 * Mark a single message as read
 */
router.put('/:id/read', auth, async (req, res) => {
  try {
    const me = req.userId.toString();
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid message id.' });
    }

    const msg = await DirectMessage.findById(id);
    if (!msg) {
      return res.status(404).json({ message: 'Message not found.' });
    }

    if (msg.to.toString() !== me) {
      return res.status(403).json({ message: 'Only the recipient can mark this as read.' });
    }

    if (!msg.isRead) {
      msg.isRead = true;
      msg.readAt = new Date();
      await msg.save();
    }

    res.json({ message: 'Marked as read.' });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * PUT /api/messages/thread/:userId/read
 * Mark all messages in a thread as read (for current user)
 */
router.put('/thread/:userId/read', auth, async (req, res) => {
  try {
    const me = req.userId.toString();
    const other = req.params.userId;
    const { group } = req.query;

    const criteria = {
      from: other,
      to: me,
      isRead: false,
    };

    if (group && mongoose.Types.ObjectId.isValid(group)) {
      criteria.group = group;
    }

    const result = await DirectMessage.updateMany(criteria, {
      $set: { isRead: true, readAt: new Date() },
    });

    res.json({
      updated: result.modifiedCount || result.nModified || 0,
    });
  } catch (error) {
    console.error('Error marking thread as read:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * DELETE /api/messages/:id
 * Delete a message (sender or recipient only)
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const me = req.userId.toString();
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid message id.' });
    }

    const msg = await DirectMessage.findById(id);
    if (!msg) {
      return res.status(404).json({ message: 'Message not found.' });
    }

    if (msg.from.toString() !== me && msg.to.toString() !== me) {
      return res.status(403).json({ message: 'You are not allowed to delete this message.' });
    }

    await msg.deleteOne();
    res.json({ message: 'Message deleted.' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
