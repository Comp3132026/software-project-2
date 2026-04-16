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
const chatRoutes = require("./routes/chat");
const notificationRoutes = require("./routes/notifications");
const aiRoutes = require("./routes/ai");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());
app.set("io", io);
app.use("/api/ai", aiRoutes);

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/lifesync";
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.use("/api/auth", authRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/notifications", notificationRoutes);

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

io.on("connection", (socket) => {
  socket.on("join-group", (groupId) => socket.join(groupId));
  socket.on("send-message", (data) =>
    io.to(data.groupId).emit("new-message", data),
  );
  socket.on("pin-message", (msg) => {
    io.to(msg.groupId).emit("message-pinned", msg);
  });
  socket.on("disconnect", () => {});
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Server error", error: err.message });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = { app, io };
