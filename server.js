const express = require("express");
const app = express();
const server = require("http").Server(app);
const { v4: uuidv4 } = require("uuid");
app.set("view engine", "ejs");
const io = require("socket.io")(server, {
  cors: {
    origin: '*'
  }
});
const { ExpressPeerServer } = require("peer");
const opinions = {
  debug: true,
}

app.use("/peerjs", ExpressPeerServer(server, opinions));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.redirect(`/${uuidv4()}`);
});

app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

// Memorizza lo stato dell'emoticon per ogni utente
const userEmotions = {};

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId, userName, userPeerId) => {
    socket.join(roomId);
    setTimeout(() => {
      socket.to(roomId).broadcast.emit("user-connected", userPeerId);
      socket.emit("user-connected", userPeerId);

      // Invia lo stato dell'emoticon all'utente appena connesso
      if (userEmotions[userPeerId]) {
        socket.emit("user-emotion", userPeerId, userEmotions[userPeerId]);
      }
    }, 1000);
  });

  socket.on("message", (message) => {
    const emotion = message.emotion;
    io.to(roomId).emit("createMessage", message, userName, userId);

    if (emotion) {
      // Memorizza lo stato dell'emoticon dell'utente
      userEmotions[userId] = emotion;

      // Invia lo stato dell'emoticon a tutti gli utenti nella stanza
      io.to(roomId).emit("user-emotion", userId, emotion);
    }
  });
});

server.listen(process.env.PORT || 3030, () => {
  console.log('Server listening on port', process.env.PORT || 3030);
});
