const express = require('express');
const Message = require('../models/Message');
const Group = require('../models/Group');
const { Notification } = require('../models/Notification');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get messages for a group
router.get('/group/:groupId', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    const isMember =
      group.owner.toString() === req.userId.toString() ||
      group.members.some((m) => m.user.toString() === req.userId.toString());

    if (!isMember) {
      return res.status(403).json({ message: 'Not a member of this group.' });
    }

    const messages = await Message.find({ group: req.params.groupId })
      .populate('sender', 'name email')
      .sort({ createdAt: 1 })
      .limit(100);

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Send message
router.post('/', auth, async (req, res) => {
  try {
    const { groupId, content, type } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Message content is required.' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    const member = group.members.find((m) => m.user.toString() === req.userId.toString());
    if (member && member.isSuspended) {
      return res.status(403).json({ message: 'You are suspended and cannot send messages.' });
    }

    const message = new Message({
      group: groupId,
      sender: req.userId,
      content: content.trim(),
      type: type || 'normal',
    });

    await message.save();

    const populated = await Message.findById(message._id).populate('sender', 'name email');

    const io = req.app.get('io');
    io.to(groupId).emit('new-message', populated);

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete message
router.delete('/:id', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id).populate('group');
    if (!message) {
      return res.status(404).json({ message: 'Message not found.' });
    }

    const group = await Group.findById(message.group._id).populate('members.user');

    const userId = req.userId.toString();

    const isSender = message.sender.toString() === userId;
    const isOwner = group.owner.toString() === userId;
    const isModerator = group.members.some(
      (m) => m.user._id.toString() === userId && m.role === 'moderator'
    );

    if (!isSender && !isOwner && !isModerator) {
      return res.status(403).json({
        message: 'You are not allowed to delete this message.',
      });
    }

    // SOFT DELETE
    message.isDeleted = true;
    message.content = '';
    message.deletedAt = new Date();
    await message.save();
    res.json({ message: 'Message deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// warning message
router.post('/:id/warn', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id).populate('sender');
    if (!message) {
      return res.status(404).json({ message: 'Message not found.' });
    }

    const group = await Group.findById(message.group);
    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    // Check permission
    const userId = req.userId.toString();

    const isOwner = group.owner.toString() === userId;
    const isModerator = group.members.some(
      (m) => (m.user._id?.toString() || m.user.toString()) === userId && m.role === 'moderator'
    );

    if (!isOwner && !isModerator) {
      return res.status(403).json({ message: 'Not allowed to warn users.' });
    }

    const { reason } = req.body;
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ message: 'Reason is required.' });
    }

    // Already warned?
    if (message.type === 'warning') {
      return res.status(400).json({ message: 'This message is already marked as a warning.' });
    }

    // Apply warning
    message.type = 'warning';
    message.warning = {
      reason,
      warnedBy: req.userId,
      warnedAt: new Date(),
    };

    await message.save();

    // Send socket notification
    req.app.get('io').to(message.sender._id.toString()).emit('warning', {
      messageId: message._id,
      reason,
    });

    res.json({ message: 'Warning issued successfully.', data: message });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

//Announcement
router.patch('/pin/:msgId', auth, async (req, res) => {
  try {
    const { msgId } = req.params;
    const userId = req.user._id;

    const msg = await Message.findById(msgId);
    if (!msg) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const group = await Group.findById(msg.group);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const isOwner = group.owner.toString() === userId.toString();
    const isMod = group.members.some(
      (m) => m.user.toString() === userId.toString() && m.role === 'moderator'
    );

    if (!isOwner && !isMod) {
      return res.status(403).json({ message: 'Not allowed.' });
    }

    if (msg.isDeleted) {
      return res.status(400).json({ message: 'Cannot pin deleted message' });
    }

    // toggle pin
    msg.pinned = !msg.pinned;
    await msg.save();

    // emit to socket
    req.app.get('io').to(msg.group.toString()).emit('messagePinned', msg);

    // Create notification
    for (const member of group.members) {
      await Notification.create({
        user: member.user,
        group: group._id,
        type: 'group_update',
        message: msg.pinned ? 'A new announcement was posted.' : 'An announcement was removed.',
      });
    }

    res.json(msg);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
