const express = require("express");
const Group = require("../models/Group");
const User = require("../models/User");
const { auth } = require("../middleware/auth");

const router = express.Router();

// Helper: Check if user can manage members (owner or moderator)
function canManageMembers(group, userId) {
  const isOwner = group.owner._id.toString() === userId.toString();
  const memberRecord = group.members.find((m) => m.user._id.toString() === userId.toString());
  const isModerator = memberRecord?.role === "moderator";
  return { isOwner, isModerator, canManage: isOwner || isModerator };
}

/**
 * GET /api/members/group/:groupId
 * Get all members in a group (group members only)
 */
router.get("/group/:groupId", auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId)
      .populate("owner", "name email")
      .populate("members.user", "name email");

    if (!group) {
      return res.status(404).json({ message: "Group not found." });
    }

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

    const members = group.members.map((m) => ({
      userId: m.user._id,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
      joinedAt: m.joinedAt,
    }));

    return res.json(members);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});

/**
 * POST /api/members/group/:groupId/add
 * Add member to group (owner or moderator, required: userId)
 */
router.post("/group/:groupId/add", auth, async (req, res) => {
  try {
    const { userId, role } = req.body;
    const validRoles = ["owner", "moderator", "member", "viewer"];

    if (!userId) {
      return res.status(400).json({ message: "userId is required." });
    }

    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role." });
    }

    const group = await Group.findById(req.params.groupId)
      .populate("owner", "name email")
      .populate("members.user", "name email");

    if (!group) {
      return res.status(404).json({ message: "Group not found." });
    }

    // Permission check: owner or moderator can add members
    const { canManage } = canManageMembers(group, req.userId);
    if (!canManage) {
      return res
        .status(403)
        .json({ message: "Only owner or moderator can add members." });
    }

    // Check if requester is suspended
    const requesterMember = group.members.find((m) => m.user._id.toString() === req.userId.toString());
    if (requesterMember && requesterMember.isSuspended) {
      return res.status(403).json({ message: "You are suspended." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const alreadyMember =
      group.owner._id.toString() === userId ||
      group.members.some((m) => m.user._id.toString() === userId);

    if (alreadyMember) {
      return res
        .status(400)
        .json({ message: "User is already a member of this group." });
    }

    group.members.push({
      user: userId,
      role: role || "member",
    });

    await group.save();

    const updatedGroup = await Group.findById(group._id)
      .populate("owner", "name email")
      .populate("members.user", "name email");

    const members = updatedGroup.members.map((m) => ({
      userId: m.user._id,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
      joinedAt: m.joinedAt,
    }));

    return res.json({
      message: "Member added successfully",
      members,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});

/**
 * GET /api/members/search
 * Search for users to add to group (query: q, groupId)
 */
router.get("/search", auth, async (req, res) => {
  try {
    const { q, groupId } = req.query;

    if (!q || q.length < 1) {
      return res.json([]);
    }

    const user = await User.findById(req.userId).populate(
      "friends",
      "name email",
    );

    let friends = user.friends.filter(
      (f) =>
        f.name.toLowerCase().includes(q.toLowerCase()) ||
        f.email.toLowerCase().includes(q.toLowerCase()),
    );

    // Exclude existing members
    if (groupId) {
      const group = await Group.findById(groupId);
      if (group) {
        const memberIds = group.members.map((m) => m.user.toString());
        friends = friends.filter((f) => !memberIds.includes(f._id.toString()));
      }
    }

    res.json(friends);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * PUT /api/members/group/:groupId/:userId/role
 * Change member role in group (owner or moderator, required: role)
 */
router.put("/group/:groupId/:userId/role", auth, async (req, res) => {
  try {
    const { role } = req.body;
    const { groupId, userId } = req.params;
    const validRoles = ["owner", "moderator", "member", "viewer"];

    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role." });
    }

    const group = await Group.findById(groupId)
      .populate("owner", "name email")
      .populate("members.user", "name email");

    if (!group) {
      return res.status(404).json({ message: "Group not found." });
    }

    // Permission check: only owner or moderator
    const { isOwner, canManage } = canManageMembers(group, req.userId);
    if (!canManage) {
      return res
        .status(403)
        .json({ message: "Only owner or moderator can change roles." });
    }

    // Check if requester is suspended
    const requesterMember = group.members.find((m) => m.user._id.toString() === req.userId.toString());
    if (requesterMember && requesterMember.isSuspended) {
      return res.status(403).json({ message: "You are suspended." });
    }

    // Only owner can change owner role
    if ((role === "owner" || group.owner._id.toString() === userId) && !isOwner) {
      return res
        .status(403)
        .json({ message: "Only the owner can change owner role." });
    }

    if (group.owner._id.toString() === userId && role !== "owner") {
      return res
        .status(400)
        .json({ message: "Cannot demote owner in this endpoint." });
    }

    const memberIndex = group.members.findIndex(
      (m) => m.user._id.toString() === userId,
    );
    if (memberIndex === -1) {
      return res
        .status(404)
        .json({ message: "Member not found in this group." });
    }

    group.members[memberIndex].role = role;

    if (role === "owner") {
      const previousOwnerId = group.owner._id.toString();
      const previousOwnerMemberIndex = group.members.findIndex(
        (m) => m.user._id.toString() === previousOwnerId,
      );
      if (previousOwnerMemberIndex !== -1) {
        group.members[previousOwnerMemberIndex].role = "member";
      }
      group.owner = userId;
    }

    await group.save();

    const members = group.members.map((m) => ({
      userId: m.user._id,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
      joinedAt: m.joinedAt,
    }));

    return res.json({ message: "Role updated successfully", members });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});

/**
 * POST /api/members/group/:groupId/leave
 * Leave a group (cannot leave if owner)
 */
router.post("/group/:groupId/leave", auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found." });
    }

    // Check if suspended
    const member = group.members.find((m) => m.user.toString() === req.userId.toString());
    if (member && member.isSuspended) {
      return res.status(403).json({ message: "You are suspended." });
    }

    // Owner cannot leave without transferring ownership first
    if (group.owner.toString() === req.userId.toString()) {
      return res.status(400).json({
        message:
          "Group owner cannot leave the group without transferring ownership first.",
      });
    }

    const memberIndex = group.members.findIndex(
      (m) => m.user.toString() === req.userId.toString(),
    );

    if (memberIndex === -1) {
      return res
        .status(400)
        .json({ message: "You are not a member of this group." });
    }

    group.members.splice(memberIndex, 1);
    await group.save();

    return res.json({ message: "You have left the group successfully." });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});

/**
 * PUT /api/members/flag/:groupId/:memberId
 * Flag a member for moderation (moderator or owner, required: flag)
 */
router.put("/flag/:groupId/:memberId", auth, async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const { flag } = req.body;

    if (!flag) {
      return res.status(400).json({ message: "Flag is required." });
    }

    const group = await Group.findById(groupId).populate("members.user");
    if (!group) {
      return res.status(404).json({ message: "Group not found." });
    }

    const { canManage } = canManageMembers(group, req.userId);
    if (!canManage) {
      return res
        .status(403)
        .json({ message: "Only owner or moderator can flag members." });
    }

    const memberIndex = group.members.findIndex(
      (m) => m.user._id.toString() === memberId,
    );
    if (memberIndex === -1) {
      return res.status(404).json({ message: "Member not found." });
    }

    // Toggle suspension on flag "suspend"
    if (flag === "suspend") {
      group.members[memberIndex].isSuspended = !group.members[memberIndex].isSuspended;
    }

    await group.save();

    const members = group.members.map((m) => ({
      userId: m.user._id,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
      isSuspended: m.isSuspended,
      joinedAt: m.joinedAt,
    }));

    return res.json({ message: "Member flagged successfully", members });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
