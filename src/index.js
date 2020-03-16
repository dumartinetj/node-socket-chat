const http = require("http");
const path = require("path");
const express = require("express");
const socketio = require("socket.io");
const BadWordsFilter = require("bad-words");
const { createMessage, createLocationMessage } = require("./utils/message");
const {
  addUser,
  getUser,
  getUsersInRoom,
  removeUser
} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const publicDirPath = path.join(__dirname, "../public");
const port = process.env.PORT || 3000;

app.use(express.static(publicDirPath));

io.on("connection", socket => {
  socket.on("join", ({ username, room }, callback) => {
    const { user, error } = addUser({ id: socket.id, username, room });

    if (error) {
      return callback(error);
    }

    socket.join(user.room);

    socket.emit(
      "message",
      createMessage("Admin", `Welcome ${user.username} to ${user.room} !`)
    );

    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        createMessage("Admin", `${user.username} has joined ${user.room} !`)
      );

    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room)
    });

    callback();
  });

  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);
    const filter = new BadWordsFilter();
    if (filter.isProfane(message)) {
      return callback("Profanity is not allowed");
    }

    io.to(user.room).emit("message", createMessage(user.username, message));
    callback("Message sent !");
  });

  socket.on("sendLocation", (location, callback) => {
    const user = getUser(socket.id);
    io.to(user.room).emit(
      "locationMessage",
      createLocationMessage(
        user.username,
        `https://www.google.com/maps?q=${location.latitude},${location.longitude}`
      )
    );
    callback();
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit(
        "message",
        createMessage("Admin", `${user.username} has left ${user.room} !`)
      );

      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room)
      });
    }
  });
});

server.listen(port, () => {
  console.log("Express server launched on port " + port);
});
