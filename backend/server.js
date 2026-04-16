const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const groupRoutes = require("./routes/groups");
const taskRoutes = require("./routes/tasks");
const memberRoutes = require("./routes/members");
const notificationRoutes = require("./routes/notifications");
const chatRoutes = require("./routes/chat");
const warningRoutes = require("./routes/warnings");
const profileRoutes = require("./routes/profiles");
const aiRoutes = require("./routes/ai");
const progressRoutes = require("./routes/progress");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
app.set("io", io);

app.use(cors());
app.use(express.json());

const MONGODB_URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  "mongodb://localhost:27017/lifesync";
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    console.log("Database name:", mongoose.connection.name);
  })
  .catch((err) => console.error("MongoDB connection error:", err));
app.use("/api/auth", authRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/warnings", warningRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/progress", progressRoutes);

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Server error", error: err.message });
});

// Socket.IO event handlers for real-time chat
io.on("connection", (socket) => {
  socket.on("join-group", (groupId) => socket.join(groupId));
  socket.on("send-message", (data) =>
    io.to(data.groupId).emit("new-message", data)
  );
  socket.on("pin-message", (msg) => {
    io.to(msg.groupId).emit("message-pinned", msg);
  });
  socket.on("disconnect", () => {});
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = { app, io };
