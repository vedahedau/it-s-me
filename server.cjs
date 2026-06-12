const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

app.get("/", (req, res) => {
  res.send("Socket server is running");
});

const io = new Server(server, {
  cors: {
    origin: true,
    methods: ["GET", "POST"],
  },
});

const waitingUsers = [];

function removeFromQueue(socketId) {
  const index = waitingUsers.findIndex((user) => user.id === socketId);
  if (index !== -1) {
    waitingUsers.splice(index, 1);
  }
}

function getSocketById(id) {
  return io.sockets.sockets.get(id);
}

function pairUsers() {
  console.log("Queue length:", waitingUsers.length);

  while (waitingUsers.length >= 2) {
    const user1 = waitingUsers.shift();
    const user2 = waitingUsers.shift();

    const socket1 = user1 && getSocketById(user1.id);
    const socket2 = user2 && getSocketById(user2.id);

    if (!socket1 || !socket2) {
      console.log("Skipping invalid socket pair");
      continue;
    }

    socket1.data.partnerId = socket2.id;
    socket2.data.partnerId = socket1.id;

    console.log("Paired:", socket1.id, "<->", socket2.id);

    socket1.emit("status-update", "connected");
    socket2.emit("status-update", "connected");
  }
}

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  socket.data.partnerId = null;

  socket.on("start-chat", () => {
    console.log("Start chat from:", socket.id);

    removeFromQueue(socket.id);

    if (!socket.data.partnerId) {
      waitingUsers.push({ id: socket.id });
      socket.emit("status-update", "waiting");
      console.log("Added to queue:", socket.id);
      pairUsers();
    }
  });

  socket.on("send-message", (message) => {
    const partner = getSocketById(socket.data.partnerId);
    if (partner) {
      partner.emit("receive-message", message);
    }
  });

  socket.on("typing-start", () => {
    const partner = getSocketById(socket.data.partnerId);
    if (partner) {
      partner.emit("stranger-typing");
    }
  });

  socket.on("typing-stop", () => {
    const partner = getSocketById(socket.data.partnerId);
    if (partner) {
      partner.emit("stranger-stop-typing");
    }
  });

  socket.on("next-stranger", () => {
    console.log("Next stranger from:", socket.id);

    const partner = getSocketById(socket.data.partnerId);

    if (partner) {
      partner.data.partnerId = null;
      partner.emit("status-update", "disconnected");
      partner.emit("stranger-stop-typing");
    }

    socket.data.partnerId = null;
    removeFromQueue(socket.id);
    waitingUsers.push({ id: socket.id });
    socket.emit("status-update", "waiting");

    pairUsers();
  });

  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);

    removeFromQueue(socket.id);

    const partner = getSocketById(socket.data.partnerId);
    if (partner) {
      partner.data.partnerId = null;
      partner.emit("status-update", "disconnected");
      partner.emit("stranger-stop-typing");
    }
  });
});

server.listen(3001, "0.0.0.0", () => {
  console.log("Socket server running on http://0.0.0.0:3001");
});