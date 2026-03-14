const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  group: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
  type: {
    type: String,
    enum: [
      "task_assigned",
      "task_completed",
      "member_joined",
      "member_left",
      "role_changed",
      "group_update",
      "group_deleted",
      "announcement",
      "reminder",
    ],
    required: true,
  },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const historyLogSchema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
  action: { type: String, required: true },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  details: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const Notification = mongoose.model("Notification", notificationSchema);
const HistoryLog = mongoose.model("HistoryLog", historyLogSchema);

module.exports = { Notification, HistoryLog };
