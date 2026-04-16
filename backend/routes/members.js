const express = require("express");
const Group = require("../models/Group");
const User = require("../models/User");
const Task = require("../models/Task");
const { Notification, HistoryLog } = require("../models/Notification");
const { auth } = require("../middleware/auth");

const router = express.Router();

// Get members of a group
router.get("/group/:groupId", auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId)
      .populate("owner", "name email")
      .populate("members.user", "name email");

    if (!group) {
      return res.status(404).json({ message: "Group not found." });
    }

    // Check access
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
      _id: m._id,
      userId: m.user._id,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
      isSuspended: m.isSuspended,
      joinedAt: m.joinedAt,
      isOwner: group.owner._id.toString() === m.user._id.toString(),
      status: m.status,
    }));

    res.json(members);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

//Add member to group (owner only)
router.post("/group/:groupId", auth, async (req, res) => {
  try {
    const { userId, role = "member" } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found." });
    }

    if (group.owner.toString() !== req.userId.toString()) {
      return res
        .status(403)
        .json({ message: "Only the group owner can add members." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const isMember = group.members.some((m) => m.user.toString() === userId);
    if (isMember) {
      return res
        .status(400)
        .json({ message: "User is already a member of this group." });
    }

    if (!["member", "viewer"].includes(role)) {
      return res
        .status(400)
        .json({ message: "Invalid role. Must be member or viewer." });
    }

    group.members.push({ user: userId, role });
    await group.save();

    // Notify the added user
    await Notification.create({
      user: userId,
      group: group._id,
      type: "member_joined",
      message: `You have been added to the group "${group.name}"`,
    });

    await HistoryLog.create({
      group: group._id,
      action: "Member added",
      performedBy: req.userId,
      details: `${user.name} was added to the group`,
    });

    const populated = await Group.findById(group._id)
      .populate("owner", "name email")
      .populate("members.user", "name email");

    const members = populated.members.map((m) => ({
      _id: m._id,
      userId: m.user._id,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
      isSuspended: m.isSuspended,
      joinedAt: m.joinedAt,
      isOwner: populated.owner._id.toString() === m.user._id.toString(),
      status: m.status,
    }));

    res.json({ message: "Member added successfully", members });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

//Update member role (owner, moderator only)
router.put("/group/:groupId/:userId/role", auth, async (req, res) => {
  try {
    const { role } = req.body;
    const { groupId, userId } = req.params;
    const validRoles = ["owner", "moderator", "member", "viewer"];

    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role." });
    }

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found." });
    }

    // Caller (the person performing the role change)
    const caller = group.members.find(
      (m) => m.user?.toString() === req.userId.toString(),
    );
    if (!caller) {
      return res.status(403).json({ message: "You are not in this group." });
    }

    const callerRole = caller.role;

    // Target (the person who is getting new role)
    const target = group.members.find((m) => m.user.toString() === userId);
    if (!target) {
      return res
        .status(404)
        .json({ message: "Member not found in this group." });
    }

    if (group.owner.toString() !== req.userId.toString()) {
      return res
        .status(403)
        .json({ message: "Only the group owner can change roles." });
    }

    if (group.owner.toString() === userId) {
      return res
        .status(400)
        .json({ message: "Cannot change the owner's role." });
    }

    // --- PERMISSION CHECKS ---

    // Viewers/members cannot change roles
    if (callerRole === "viewer" || callerRole === "member") {
      return res.status(403).json({ message: "Not authorized." });
    }

    // Moderators cannot modify owner
    if (
      callerRole === "moderator" &&
      target.user.toString() === group.owner.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Moderators cannot modify the owner." });
    }

    // Moderators cannot assign owner role
    if (callerRole === "moderator" && role === "owner") {
      return res
        .status(403)
        .json({ message: "Moderators cannot assign owner role." });
    }

    const memberIndex = group.members.findIndex(
      (m) => m.user.toString() === userId,
    );
    if (memberIndex === -1) {
      return res
        .status(404)
        .json({ message: "Member not found in this group." });
    }

    const oldRole = group.members[memberIndex].role;
    group.members[memberIndex].role = role;
    await group.save();

    // Notify member of role change
    await Notification.create({
      user: userId,
      group: group._id,
      type: "role_changed",
      message: `Your role in "${group.name}" has been changed from ${oldRole} to ${role}`,
    });

    await HistoryLog.create({
      group: group._id,
      action: "Role changed",
      performedBy: req.userId,
      details: `Member role changed from ${oldRole} to ${role}`,
    });

    const populated = await Group.findById(group._id)
      .populate("owner", "name email")
      .populate("members.user", "name email");

    const members = populated.members.map((m) => ({
      _id: m._id,
      userId: m.user._id,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
      isSuspended: m.isSuspended,
      joinedAt: m.joinedAt,
      isOwner: populated.owner._id.toString() === m.user._id.toString(),
      status: m.status,
    }));

    return res.status(200).json({
      success: true,
      message: "Role updated successfully",
      members,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Suspend/unsuspend member (owner only)
router.put("/group/:groupId/:userId/suspend", auth, async (req, res) => {
  try {
    const { groupId, userId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found." });
    }

    if (group.owner.toString() !== req.userId.toString()) {
      return res
        .status(403)
        .json({ message: "Only the group owner can suspend members." });
    }

    if (group.owner.toString() === userId) {
      return res.status(400).json({ message: "Cannot suspend the owner." });
    }

    const member = group.members.find((m) => m.user.toString() === userId);
    if (!member) {
      return res.status(404).json({ message: "Member not found." });
    }

    member.isSuspended = !member.isSuspended;
    await group.save();

    await HistoryLog.create({
      group: group._id,
      action: member.isSuspended ? "Member suspended" : "Member unsuspended",
      performedBy: req.userId,
      details: `Member was ${member.isSuspended ? "suspended" : "unsuspended"}`,
    });

    const populated = await Group.findById(group._id)
      .populate("owner", "name email")
      .populate("members.user", "name email");

    const members = populated.members.map((m) => ({
      _id: m._id,
      userId: m.user._id,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
      isSuspended: m.isSuspended,
      joinedAt: m.joinedAt,
      isOwner: populated.owner._id.toString() === m.user._id.toString(),
      status: m.status,
    }));

    res.json({
      message: member.isSuspended ? "Member suspended" : "Member unsuspended",
      members,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Remove member (owner only)
router.delete("/group/:groupId/:userId", auth, async (req, res) => {
  try {
    const { groupId, userId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found." });
    }

    if (group.owner.toString() !== req.userId.toString()) {
      return res
        .status(403)
        .json({ message: "Only the group owner can remove members." });
    }

    if (group.owner.toString() === userId) {
      return res.status(400).json({
        message: "Cannot remove the owner. Transfer ownership first.",
      });
    }

    const memberIndex = group.members.findIndex(
      (m) => m.user.toString() === userId,
    );
    if (memberIndex === -1) {
      return res.status(404).json({ message: "Member not found." });
    }

    group.members.splice(memberIndex, 1);
    await group.save();

    // Remove from task assignments
    await Task.updateMany(
      { group: groupId },
      { $pull: { assignedTo: userId } },
    );

    await Notification.create({
      user: userId,
      type: "member_left",
      message: `You have been removed from the group "${group.name}"`,
    });

    await HistoryLog.create({
      group: group._id,
      action: "Member removed",
      performedBy: req.userId,
      details: "A member was removed from the group",
    });

    const populated = await Group.findById(group._id)
      .populate("owner", "name email")
      .populate("members.user", "name email");

    const members = populated.members.map((m) => ({
      _id: m._id,
      userId: m.user._id,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
      isSuspended: m.isSuspended,
      joinedAt: m.joinedAt,
      isOwner: populated.owner._id.toString() === m.user._id.toString(),
      status: m.status,
    }));

    res.json({ message: "Member removed successfully", members });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Search friends to add to group
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

//flag member
router.put("/flag/:groupId/:memberId", auth, async (req, res) => {
  try {
    const { flag } = req.body; // "inactive", "unresponsive", "active"

    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const member = group.members.id(req.params.memberId);
    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    member.status = flag;
    await group.save();

    res.json({ message: "Member status updated", member });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
    console.log(err);
  }
});

module.exports = router;
