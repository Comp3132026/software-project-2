const express = require("express");
const { body, validationResult } = require("express-validator");
const Group = require("../models/Group");
const Task = require("../models/Task");
const { Notification, HistoryLog } = require("../models/Notification");
const { auth } = require("../middleware/auth");
const Announcement = require("../models/Announcement");
const Progress = require("../models/Progress");

const { logGroupAction } = require("../services/logService");
const router = express.Router();
const Message = require("../models/Message");
const { notifyGroup } = require("../services/notificationService");

/**
 * Validation for group creation/update
 */
const validateGroup = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be 2-100 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description max 500 characters"),
  body("category")
    .isIn([
      "Health",
      "Fitness",
      "Productivity",
      "Learning",
      "Finance",
      "Social",
      "Other",
    ])
    .withMessage("Invalid category"),
];

/**
 * Create a new group.
 *
 * @route POST /api/groups
 */
router.post("/", auth, validateGroup, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ message: errors.array()[0].msg, errors: errors.array() });
    }

    const { name, description, category } = req.body;

    const group = new Group({
      name,
      description: description || "",
      category,
      owner: req.userId,
      members: [{ user: req.userId, role: "owner" }],
    });
    await logGroupAction({
      group: group._id,
      action: "Group created",
      performedBy: req.userId,
      details: group.name,
    });

    await group.save();

    // Log history
    await HistoryLog.create({
      group: group._id,
      action: "Group created",
      performedBy: req.userId,
      details: `Group "${name}" was created`,
    });

    const populated = await Group.findById(group._id)
      .populate("owner", "name email")
      .populate("members.user", "name email");

    res
      .status(201)
      .json({ message: "Group created successfully", group: populated });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * Get all groups for user (as owner or member)
 *
 * @route GET /api/groups
 */
router.get("/", auth, async (req, res) => {
  try {
    const groups = await Group.find({
      $or: [{ owner: req.userId }, { "members.user": req.userId }],
    })
      .populate("owner", "name email")
      .populate("members.user", "name email")
      .populate({
        path: "tasks",
        select: "status",
      })
      .sort({ updatedAt: -1 });

    res.json(
      groups.map((g) => ({
        ...g.toJSON(),
        taskCount: g.taskCount,
        completedTaskCount: g.completedTaskCount,
        completionRate: g.completionRate,
      })),
    );
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * Get details of a specific group by ID.
 *
 * @route GET /api/groups/:groupId
 */
router.get("/:groupId", auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId)
      .populate("owner", "name email")
      .populate("members.user", "name email")
      .populate({
        path: "tasks",
        select: "status",
      });

    if (!group) {
      return res.status(404).json({ message: "Group not found." });
    }

    // Check if user is a member
    const isMember =
      group.owner._id.toString() === req.userId.toString() ||
      group.members.some(
        (m) => m.user._id.toString() === req.userId.toString(),
      );

    if (!isMember) {
      return res
        .status(403)
        .json({ message: "You are not a member of this group." });
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
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * Update group details (owner only).
 *
 * @route PUT /api/groups/:groupId
 */
router.put("/:groupId", auth, validateGroup, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ message: errors.array()[0].msg, errors: errors.array() });
    }

    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found." });
    }

    if (group.owner.toString() !== req.userId.toString()) {
      return res
        .status(403)
        .json({ message: "Only the group owner can edit group details." });
    }

    const { name, description, category } = req.body;

    group.name = name;
    group.description =
      description !== undefined ? description : group.description;
    group.category = category;
    await group.save();

    // Log history
    await HistoryLog.create({
      group: group._id,
      action: "Group updated",
      performedBy: req.userId,
      details: "Group details were updated",
    });

    const populated = await Group.findById(group._id)
      .populate("owner", "name email")
      .populate("members.user", "name email");

    res.json({ message: "Group updated successfully", group: populated });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * Delete group (owner only) - cascading deletion
 *
 * @route DELETE /api/groups/:groupId
 */
router.delete("/:groupId", auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId).populate(
      "members.user",
      "name email",
    );
    if (!group) {
      return res.status(404).json({ message: "Group not found." });
    }

    if (group.owner.toString() !== req.userId.toString()) {
      return res
        .status(403)
        .json({ message: "Only the group owner can delete the group." });
    }

    // Notify all members before deletion
    const memberIds = group.members
      .filter((m) => m.user._id.toString() !== req.userId.toString())
      .map((m) => m.user._id);

    for (const memberId of memberIds) {
      await Notification.create({
        user: memberId,
        type: "group_deleted",
        message: `The group "${group.name}" has been deleted by the owner.`,
      });
    }

    // Cascading delete - remove all tasks
    await Task.deleteMany({ group: group._id });

    // Delete history logs for this group
    await HistoryLog.deleteMany({ group: group._id });

    // Delete the group
    await Group.findByIdAndDelete(req.params.groupId);

    res.json({ message: "Group and all associated data deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * Join group by name.
 *
 * @route POST /api/groups/join
 */
router.post("/join", auth, async (req, res) => {
  try {
    const { groupName } = req.body;
    if (!groupName) {
      return res.status(400).json({ message: "Group name is required." });
    }

    const group = await Group.findOne({
      name: { $regex: `^${groupName}$`, $options: "i" },
    });
    if (!group) {
      return res.status(404).json({ message: "Group not found." });
    }

    const isMember = group.members.some(
      (m) => m.user.toString() === req.userId.toString(),
    );
    if (isMember) {
      return res
        .status(400)
        .json({ message: "You are already a member of this group." });
    }

    group.members.push({ user: req.userId, role: "member" });
    await group.save();

    await HistoryLog.create({
      group: group._id,
      action: "Member joined",
      performedBy: req.userId,
      details: "A new member joined the group",
    });

    const populated = await Group.findById(group._id)
      .populate("owner", "name email")
      .populate("members.user", "name email");

    res.json({ message: "Joined group successfully", group: populated });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * Leave group.
 *
 * @route POST /api/groups/:groupId/leave
 */
router.post("/:groupId/leave", auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found." });
    }

    const isMember = group.members.some(
      (m) => m.user.toString() === req.userId.toString(),
    );
    if (!isMember) {
      return res
        .status(400)
        .json({ message: "You are not a member of this group." });
    }

    // If owner is leaving, must transfer ownership first
    if (group.owner.toString() === req.userId.toString()) {
      const { newOwnerId } = req.body;
      if (!newOwnerId) {
        return res.status(400).json({
          message: "As the owner, you must assign a new owner before leaving.",
          requiresNewOwner: true,
          members: group.members.filter(
            (m) => m.user.toString() !== req.userId.toString(),
          ),
        });
      }

      const newOwner = group.members.find(
        (m) => m.user.toString() === newOwnerId,
      );
      if (!newOwner) {
        return res
          .status(400)
          .json({ message: "New owner must be an existing member." });
      }

      group.owner = newOwnerId;
      newOwner.role = "owner";

      // Notify new owner
      await Notification.create({
        user: newOwnerId,
        group: group._id,
        type: "role_changed",
        message: `You are now the owner of "${group.name}"`,
      });
    }

    // Remove leaving member
    group.members = group.members.filter(
      (m) => m.user.toString() !== req.userId.toString(),
    );
    await group.save();

    // Remove task assignments
    await Task.updateMany(
      { group: req.params.groupId },
      { $pull: { assignedTo: req.userId } },
    );

    await HistoryLog.create({
      group: group._id,
      action: "Member left",
      performedBy: req.userId,
      details: "A member left the group",
    });

    res.json({ message: "You have left the group successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * Transfer group ownership.
 *
 * @route POST /api/groups/:groupId/transfer-ownership
 */
router.post("/:groupId/transfer-ownership", auth, async (req, res) => {
  try {
    const { newOwnerId } = req.body;
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found." });
    }

    if (group.owner.toString() !== req.userId.toString()) {
      return res
        .status(403)
        .json({ message: "Only the owner can transfer ownership." });
    }

    const newOwner = group.members.find(
      (m) => m.user.toString() === newOwnerId,
    );
    if (!newOwner) {
      return res
        .status(400)
        .json({ message: "New owner must be an existing member." });
    }

    // Update old owner's role
    const oldOwner = group.members.find(
      (m) => m.user.toString() === req.userId.toString(),
    );
    if (oldOwner) {
      oldOwner.role = "member";
    }

    group.owner = newOwnerId;
    newOwner.role = "owner";
    await group.save();

    await Notification.create({
      user: newOwnerId,
      group: group._id,
      type: "role_changed",
      message: `You are now the owner of "${group.name}"`,
    });

    await HistoryLog.create({
      group: group._id,
      action: "Ownership transferred",
      performedBy: req.userId,
      details: "Group ownership was transferred",
    });

    const populated = await Group.findById(group._id)
      .populate("owner", "name email")
      .populate("members.user", "name email");

    res.json({
      message: "Ownership transferred successfully",
      group: populated,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Publish announcement to a group
router.post("/:groupId/announcements", auth, async (req, res) => {
  try {
    const {
      title,
      content,
      priority,
      category,
      expiresAt,
      targetRoles,
      isPinned,
      attachments,
    } = req.body;

    if (!title || !title.trim()) {
      return res
        .status(400)
        .json({ message: "Announcement title is required." });
    }

    if (!content || !content.trim()) {
      return res
        .status(400)
        .json({ message: "Announcement content is required." });
    }

    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found." });
    }

    const isOwner = group.owner.toString() === req.userId.toString();
    const membership = group.members.find(
      (m) => m.user.toString() === req.userId.toString(),
    );
    const isModerator = membership?.role === "moderator";

    if (!isOwner && !isModerator) {
      return res
        .status(403)
        .json({
          message: "Only owners and moderators can publish announcements.",
        });
    }

    const announcement = await Announcement.create({
      group: group._id,
      author: req.userId,
      title: title.trim(),
      content: content.trim(),
      priority: priority || "normal",
      category: category || "general",
      expiresAt: expiresAt || undefined,
      targetRoles: Array.isArray(targetRoles) ? targetRoles : [],
      isPinned: Boolean(isPinned),
      attachments: Array.isArray(attachments) ? attachments : [],
    });
    await logGroupAction({
      group: group._id,
      action: "Announcement published",
      performedBy: req.userId,
      details: title.trim(),
    });
    await notifyGroup({
      group: group._id,
      members: group.members,
      type: "announcement",
      message: title,
    });

    const populatedAnnouncement = await Announcement.findById(announcement._id)
      .populate("author", "name email")
      .populate("group", "name");

    return res.status(201).json({
      message: "Announcement published successfully",
      announcement: populatedAnnouncement,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});

// Submit a progress update to a group
router.post("/:groupId/progress", auth, async (req, res) => {
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
      return res.status(400).json({ message: "Progress title is required." });
    }

    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found." });
    }

    const isMember =
      group.owner.toString() === req.userId.toString() ||
      group.members.some((m) => m.user.toString() === req.userId.toString());

    if (!isMember) {
      return res
        .status(403)
        .json({ message: "You are not a member of this group." });
    }

    const progress = await Progress.create({
      group: group._id,
      user: req.userId,
      title: title.trim(),
      description: description?.trim() || "",
      type: type || "daily_update",
      task: task || undefined,
      metrics: metrics || {},
      attachments: Array.isArray(attachments) ? attachments : [],
      isPublic: isPublic !== undefined ? Boolean(isPublic) : true,
      isPinned: Boolean(isPinned),
    });

    const populatedProgress = await Progress.findById(progress._id)
      .populate("user", "name email")
      .populate("group", "name")
      .populate("task", "title status");

    return res.status(201).json({
      message: "Progress submitted successfully",
      progress: populatedProgress,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});

// Get inactive members in a group
router.get("/:groupId/inactive", auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { days = 7 } = req.query;

    const group = await Group.findById(groupId).populate(
      "members.user",
      "name email",
    );

    if (!group) {
      return res.status(404).json({ message: "Group not found." });
    }

    const isMember =
      group.owner.toString() === req.userId.toString() ||
      group.members.some(
        (m) => m.user._id.toString() === req.userId.toString(),
      );

    if (!isMember) {
      return res.status(403).json({ message: "Not authorized." });
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
      group: {
        _id: group._id,
        name: group.name,
      },
      thresholdDays: parseInt(days),
      totalMembers: group.members.length,
      inactiveCount: inactiveMembers.length,
      activeCount: group.members.length - inactiveMembers.length,
      inactiveMembers,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
