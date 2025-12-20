const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

/* Serve frontend */
app.use(express.static(path.join(__dirname, "public")));

/* Shared board state */
let boardState = {
  states: [],
  transitions: [],
  startStateId: null,
  alphabet: ["0", "1"]
};

const users = {};

io.on("connection", socket => {
  users[socket.id] = {
    name: "User-" + socket.id.slice(0, 4),
    color: `hsl(${Math.random() * 360},80%,50%)`
  };

  socket.emit("sync-board", boardState);
  socket.emit("user-info", users[socket.id]);

  socket.on("board-update", data => {
    boardState = data;
    socket.broadcast.emit("sync-board", boardState);
  });

  socket.on("cursor-move", pos => {
    socket.broadcast.emit("cursor-update", {
      id: socket.id,
      ...pos,
      user: users[socket.id]
    });
  });

  socket.on("disconnect", () => {
    delete users[socket.id];
    io.emit("cursor-remove", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
