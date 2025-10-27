// Simple real-time chat server with Socket.IO
const express = require("express");
const path = require("path");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  cors: { origin: "*" },
});

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// In-memory: map socket.id -> username
const users = new Map();

io.on("connection", (socket) => {
  // When a user joins with a chosen name
  socket.on("join", (username) => {
    const cleanName =
      String(username || "Anonymous")
        .trim()
        .slice(0, 32) || "Anonymous";
    users.set(socket.id, cleanName);
    socket.broadcast.emit("system", `${cleanName} joined the chat`);
    io.emit("users", Array.from(users.values()));
  });

  // Chat message
  socket.on("chat", (msg) => {
    const username = users.get(socket.id) || "Anonymous";
    const payload = {
      username,
      message: String(msg).slice(0, 2000),
      ts: Date.now(),
    };
    io.emit("chat", payload);
  });

  // Typing indicators
  socket.on("typing", (isTyping) => {
    const username = users.get(socket.id) || "Someone";
    socket.broadcast.emit("typing", { username, isTyping: !!isTyping });
  });

  // Disconnect
  socket.on("disconnect", () => {
    const name = users.get(socket.id);
    if (name) {
      users.delete(socket.id);
      socket.broadcast.emit("system", `${name} left the chat`);
      io.emit("users", Array.from(users.values()));
    }
  });
});

http.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
