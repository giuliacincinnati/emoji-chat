const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const emoticonContainer = document.getElementById("emoticon-container");
const myVideo = document.createElement("video");
const showChat = document.querySelector("#showChat");
const backBtn = document.querySelector(".header__back");
myVideo.muted = true;
const userEmotions = {};


backBtn.addEventListener("click", () => {
  document.querySelector(".main__left").style.display = "flex";
  document.querySelector(".main__left").style.flex = "1";
  document.querySelector(".main__right").style.display = "none";
  document.querySelector(".header__back").style.display = "none";
});

showChat.addEventListener("click", () => {
  document.querySelector(".main__right").style.display = "flex";
  document.querySelector(".main__right").style.flex = "1";
  document.querySelector(".main__left").style.display = "none";
  document.querySelector(".header__back").style.display = "block";
});

const user = prompt("Enter your name");

var peer = new Peer({
  host: window.location.hostname,
  port: window.location.port || (window.location.protocol === 'https:' ? 443 : 80),
  path: '/peerjs',
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  },
  debug: 3
});

let myVideoStream;
navigator.mediaDevices
  .getUserMedia({
    audio: true,
    video: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream);

    peer.on("call", (call) => {
      console.log('someone call me');
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });

    socket.on("user-connected", (userId) => {
      connectToNewUser(userId, stream);
    });
  });

const connectToNewUser = (userId, stream) => {
  console.log('I call someone' + userId)
  const call = peer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream, userId); // Passa userId come parametro
    updateEmoticonContainer(userId);
  });
};

peer.on("open", (id) => {
  console.log('my id is' + id);
  socket.emit("join-room", ROOM_ID, id, user);
});

const addVideoStream = (video, stream, userId) => {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
    videoGrid.appendChild(video);
    const peerVideoGrid = document.createElement("div"); // Crea un div per il riquadro del video
    peerVideoGrid.classList.add("peer-video-grid"); // Aggiungi una classe per il riquadro del video
    peerVideoGrid.dataset.peer = userId; // Imposta l'attributo data-peer con l'ID dell'utente
    peerVideoGrid.appendChild(video); // Aggiungi il video al riquadro del video
    const emoticonContainer = createEmoticonContainer(userId);
    peerVideoGrid.appendChild(emoticonContainer);
    videoGrid.appendChild(peerVideoGrid); // Aggiungi il riquadro del video al videoGrid
    updateEmoticonContainer(userId); // Mostra l'emoticon container sull'elemento video corrispondente
  });
};



function createEmoticonContainer(userId) {
  const emoticonContainer = document.createElement("div");
  emoticonContainer.classList.add("emoticon-container");
  emoticonContainer.id = `emoticon-container-${userId}`; // Assegna un ID univoco all'emoticon container
  return emoticonContainer;
}

let text = document.querySelector("#chat_message");
let send = document.getElementById("send");
let messages = document.querySelector(".messages");
let currentEmotion = "";

send.addEventListener("click", (e) => {
  if (text.value.length !== 0) {
    if (text.value.includes("felice")) {
      currentEmotion = "felice";
    } else if (text.value.includes("arrabbiato")) {
      currentEmotion = "arrabbiato";
    } else if (text.value.includes("triste")) {
      currentEmotion = "triste";
    } else {
      currentEmotion = "";
    }
    updateEmoticon();
    socket.emit("message", text.value, currentEmotion); // Invia il messaggio al server
    text.value = "";
  }
});

text.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && text.value.length !== 0) {
    if (text.value.includes("felice")) {
      currentEmotion = "felice";
    } else if (text.value.includes("arrabbiato")) {
      currentEmotion = "arrabbiato";
    } else if (text.value.includes("triste")) {
      currentEmotion = "triste";
    } else {
      currentEmotion = "";
    }
    updateEmoticon();
    socket.emit("message", text.value, currentEmotion); // Invia il messaggio al server
    text.value = "";
  }
});

const updateEmoticonContainer = (userId, emoticonContainer) => {
  const peerVideoGrid = document.querySelector(`.peer-video-grid[data-peer="${userId}"]`);
  if (peerVideoGrid && !emoticonContainer) {
    emoticonContainer = createEmoticonContainer(userId);
    peerVideoGrid.appendChild(emoticonContainer);
  }
};




socket.on("createMessage", (message, userName) => {
  let messageContent = message.toLowerCase();
  let includeEmoticon = false;

  if (message.includes("felice")) {
    currentEmotion = "felice";
    includeEmoticon = true;
  } else if (message.includes("arrabbiat")) {
    currentEmotion = "arrabbiato";
    includeEmoticon = true;
  } else if (message.includes("triste")) {
    currentEmotion = "triste";
    includeEmoticon = true;
  } else {
    currentEmotion = "";
  }

  messages.innerHTML += `
    <div class="message">
      <b><i class="far fa-user-circle"></i> <span>${userName === user ? "me" : userName}</span></b>
      <span>${messageContent}</span>
    </div>`;

  if (includeEmoticon) {
    updateEmoticonContainer(userName);
    updateEmoticon();
  }
});


function updateEmoticon(userId) {
  if (currentEmotion === "felice") {
    userEmotions[userId] = "felice"; // Aggiungi questa linea per memorizzare l'emozione corrente dell'utente corrispondente
    createEmoticon("felice.png", userId);
  } else if (currentEmotion === "triste") {
    userEmotions[userId] = "triste"; // Aggiungi questa linea per memorizzare l'emozione corrente dell'utente corrispondente
    createEmoticon("triste.png", userId);
  } else if (currentEmotion === "arrabbiato") {
    userEmotions[userId] = "arrabbiato"; // Aggiungi questa linea per memorizzare l'emozione corrente dell'utente corrispondente
    createEmoticon("arrabbiato.png", userId);

  }

  // Mostra l'emoticon container nell'elemento video corrispondente
  if (userId) {
    updateEmoticonContainer(userId);
  }
}


function createEmoticon(imageFileName, userId) {
  const emoticonImage = document.createElement("img");
  emoticonImage.src = imageFileName;

  const emoticonContainer = document.getElementById(`emoticon-container-${userId}`);
  emoticonContainer.innerHTML = ""; // Rimuovi eventuali emoticon precedenti
  emoticonContainer.appendChild(emoticonImage);

  setTimeout(() => {
    emoticonContainer.innerHTML = ""; // Rimuovi l'emoticon dopo 10 secondi
  }, 10000);
}

const inviteButton = document.querySelector("#inviteButton");
const muteButton = document.querySelector("#muteButton");
const stopVideo = document.querySelector("#stopVideo");

muteButton.addEventListener("click", () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    html = `<i class="fas fa-microphone-slash"></i>`;
    muteButton.classList.toggle("background__red");
    muteButton.innerHTML = html;
  } else {
    myVideoStream.getAudioTracks()[0].enabled = true;
    html = `<i class="fas fa-microphone"></i>`;
    muteButton.classList.toggle("background__red");
    muteButton.innerHTML = html;
  }
});

stopVideo.addEventListener("click", () => {
  const enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    html = `<i class="fas fa-video-slash"></i>`;
    stopVideo.classList.toggle("background__red");
    stopVideo.innerHTML = html;
  } else {
    myVideoStream.getVideoTracks()[0].enabled = true;
    html = `<i class="fas fa-video"></i>`;
    stopVideo.classList.toggle("background__red");
    stopVideo.innerHTML = html;
  }
});

inviteButton.addEventListener("click", (e) => {
  prompt(
    "Copy this link and send it to people you want to meet with",
    window.location.href
  );
});
