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

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId, userName) => {
    socket.join(roomId);
    setTimeout(() => {
      socket.to(roomId).broadcast.emit("user-connected", userId);
    }, 1000);
    socket.on("message", (message) => {
  const emotion = message.emotion;
  io.to(roomId).emit("createMessage", message, userName, userId);

  if (emotion) {
    io.to(roomId).emit("user-emotion", userId, emotion);
  }
    });
    });

  socket.on("createMessage", (message, userName, userId) => {
      let messageContent = message.text;

      messages.innerHTML += `
        <div class="message">
          <b><i class="far fa-user-circle"></i> <span>${userName === user ? "me" : userName}</span></b>
          <span>${messageContent}</span>
        </div>`;

      if (message.emotion) {
        currentEmotion = message.emotion;
        updateEmoticonContainer(userId); // Aggiorna l'emoticon container per il mittente
        socket.emit("user-emotion", userId, message.emotion); // Invia l'emozione dell'utente agli altri utenti
      } else {
        currentEmotion = "";
      }
    });
  });


server.listen(process.env.PORT || 3030, () => {
  console.log('Server listening on port', process.env.PORT || 3030);
});
