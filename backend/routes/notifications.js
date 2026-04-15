const express = require("express");
const { Notification, HistoryLog } = require("../models/Notification");
const User = require("../models/User");
const Group = require("../models/Group");
const Task = require("../models/Task");
const { auth } = require("../middleware/auth");

const router = express.Router();

/**
 * GET /api/notifications
 * Get all notifications for current user (limit 50, sorted by newest)
 */
router.get("/", auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.userId })
      .populate("group", "name")
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(notifications);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * POST /api/notifications/announcement/:groupId
 * Send announcement to all group members (owner or moderator, required: message)
 */
router.post("/announcement/:groupId", auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res
        .status(400)
        .json({ message: "Announcement message is required" });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if user is owner (via group.owner) or has owner/moderator role in members
    const isOwner = group.owner.toString() === req.userId.toString();
    const membership = group.members.find(
      (m) => m.user?.toString() === req.userId.toString(),
    );
    const isModerator = membership?.role === "moderator";

    if (!isOwner && !isModerator) {
      return res
        .status(403)
        .json({ message: "Only owners and moderators can send announcements" });
    }

    const sender = await User.findById(req.userId);
    if (!sender) {
      return res.status(404).json({ message: "User not found" });
    }

    // Create notification for all group members + owner
    const notifications = [];
    const recipientIds = new Set();

    recipientIds.add(group.owner.toString());
    group.members.forEach((m) => {
      if (m.user) recipientIds.add(m.user.toString());
    });

    for (const userId of recipientIds) {
      const notification = await Notification.create({
        user: userId,
        group: groupId,
        type: "announcement",
        message: `📢 Announcement from ${sender.name}: ${message}`,
      });
      notifications.push(notification);
    }

    // Log to history
    await HistoryLog.create({
      group: groupId,
      performedBy: req.userId,
      action: "Sent announcement",
      details: message.substring(0, 100),
    });

    res.json({ message: "Announcement sent", count: notifications.length });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * POST /api/notifications/reminder/:taskId
 * Set reminder for a task (required: reminderDate, reminderMessage)
 */
router.post("/reminder/:taskId", auth, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { reminderDate, reminderMessage } = req.body;

    if (!reminderDate) {
      return res.status(400).json({ message: "Reminder date is required" });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Update task with reminder
    task.reminderDate = new Date(reminderDate);
    task.reminderMessage = reminderMessage || `Reminder: ${task.title}`;
    task.reminderSet = true;
    await task.save();

    // Create immediate notification for the assignee
    const targetUser = task.assignedTo || req.userId;

    await Notification.create({
      user: targetUser,
      group: task.group,
      type: "reminder",
      message: `⏰ Reminder set for "${task.title}" on ${new Date(reminderDate).toLocaleDateString()}`,
    });

    res.json({ message: "Reminder set successfully", task });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * GET /api/notifications/reminders
 * Get all upcoming reminders for current user
 */
router.get("/reminders", auth, async (req, res) => {
  try {
    const tasks = await Task.find({
      assignedTo: req.userId,
      reminderSet: true,
      reminderDate: { $gte: new Date() },
    }).populate("group", "name");

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * GET /api/notifications/history/:groupId
 * Get activity history for a group (limit 50, sorted by newest)
 */
router.get("/history/:groupId", auth, async (req, res) => {
  try {
    const history = await HistoryLog.find({ group: req.params.groupId })
      .populate("performedBy", "name")
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(history);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * PUT /api/notifications/:id/read
 * Mark a single notification as read
 */
router.put("/:id/read", auth, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found." });
    }

    if (notification.user.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: "Not your notification." });
    }

    notification.isRead = true;
    await notification.save();

    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read for current user
 */
router.put("/read-all", auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.userId, isRead: false },
      { isRead: true },
    );
    res.json({ message: "All notifications marked as read." });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * GET /api/notifications/unread-count
 * Get count of unread notifications for current user
 */
router.get("/unread-count", auth, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      user: req.userId,
      isRead: false,
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * GET /api/notifications/group/:groupId
 * Get notifications for a specific group
 */
router.get("/group/:groupId", auth, async (req, res) => {
  try {
    const { groupId } = req.params;

    // notifications inside this group that belong to logged-in user
    const notifications = await Notification.find({
      group: groupId,
      user: req.userId,
    })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * PUT /api/notifications/frequency
 * Save notification frequency preference (required: frequency in body)\n
 */
router.put("/frequency", auth, async (req, res) => {
  try {
    const { frequency } = req.body;

    if (!frequency)
      return res.status(400).json({ message: "Frequency is required" });

    const user = await User.findById(req.userId);
    user.notificationFrequency = frequency;
    await user.save();

    res.json({ message: "Frequency updated", frequency });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
