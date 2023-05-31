const socket = io("/");
const videoGrid = document.getElementById("video-grid");
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
  console.log('I call someone' + userId);
  setTimeout(() => {
    const call = peer.call(userId, stream);
    const video = document.createElement("video");
    call.on("stream", (userVideoStream) => {
      addVideoStream(video, userVideoStream, userId);
      updateEmoticonContainer(userId);
    });

    // Aggiungi questa parte per inviare l'emozione corrente all'utente appena connesso
    if (currentEmotion !== "") {
      socket.emit("user-emotion", userId, currentEmotion);
    }

    // Aggiorna la riga seguente per impostare correttamente l'emozione dell'utente appena connesso
    userEmotions[userId] = currentEmotion;

    // Aggiungi questo controllo per creare l'emoticon container anche per l'utente che avvia l'app
    if (userId === peer.id) {
      updateEmoticonContainer(userId);
    }
  }, 1000);
};


peer.on("open", (id) => {
  console.log('my id is' + id);
  socket.emit("join-room", ROOM_ID, id, user, peer.id);
});

const addVideoStream = (video, stream, userId) => {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
    videoGrid.appendChild(video);
    const peerVideoGrid = document.createElement("div");
    peerVideoGrid.classList.add("peer-video-grid");
    peerVideoGrid.dataset.peer = userId;
    peerVideoGrid.appendChild(video);

    if (userId) {
      const emoticonContainer = createEmoticon(userId);
      peerVideoGrid.appendChild(emoticonContainer);
    }

    videoGrid.appendChild(peerVideoGrid);
    updateEmoticonContainer(userId);
  });
};



let text = document.querySelector("#chat_message");
let send = document.getElementById("send");
let messages = document.querySelector(".messages");
let currentEmotion = "";

send.addEventListener("click", (e) => {
  if (text.value.length !== 0) {
    if (text.value.includes("felice")) {
      currentEmotion = "felice";
    } else if (text.value.includes("arrabbiat")) {
      currentEmotion = "arrabbiato";
    } else if (text.value.includes("triste")) {
      currentEmotion = "triste";
    } else {
      currentEmotion = "";
    }
    const message = { text: text.value, emotion: currentEmotion };
    socket.emit("message", message);
    text.value = "";

    // Aggiungi questo controllo per aggiornare l'emoticon container per l'utente che avvia l'app
    if (peer.id === userId) {
      updateEmoticonContainer(userId);
    }
  }
});

text.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && text.value.length !== 0) {
    if (text.value.includes("felice")) {
      currentEmotion = "felice";
    } else if (text.value.includes("arrabbiat")) {
      currentEmotion = "arrabbiato";
    } else if (text.value.includes("triste")) {
      currentEmotion = "triste";
    } else {
      currentEmotion = "";
    }
//    updateEmoticonContainer();
    const message = { text: text.value, emotion: currentEmotion };
    socket.emit("message", message);
    text.value = "";

    // Aggiungi questo controllo per aggiornare l'emoticon container per l'utente che avvia l'app
    if (peer.id === userId) {
      updateEmoticonContainer(userId);
    }
  }
});

socket.on("user-emotion", (userId, emotion) => {
  userEmotions[userId] = emotion;
  updateEmoticonImage(userId);
});


socket.on("createMessage", (message, userName, userId) => {
  let messageContent = message.text;
  let includeEmoticon = false;

  if (message.emotion === "felice") {
    currentEmotion = "felice";
    includeEmoticon = true;
  } else if (message.emotion === "arrabbiato") {
    currentEmotion = "arrabbiato";
    includeEmoticon = true;
  } else if (message.emotion === "triste") {
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
    updateEmoticonContainer(userId);
  }
});





const updateEmoticonContainer = (userId) => {
  const peerVideoGrid = document.querySelector(`.peer-video-grid[data-peer="${userId}"]`);
  if (peerVideoGrid) {
    let emoticonContainer = document.querySelector(`#emoticon-container-${userId}`);
    if (!emoticonContainer) {
      emoticonContainer = createEmoticon(userId);
      peerVideoGrid.appendChild(emoticonContainer);
    }
    if (currentEmotion === "felice") {
      userEmotions[userId] = "felice";
      updateEmoticonImage(userId);
    } else if (currentEmotion === "triste") {
      userEmotions[userId] = "triste";
      updateEmoticonImage(userId);
    } else if (currentEmotion === "arrabbiato") {
      userEmotions[userId] = "arrabbiato";
      updateEmoticonImage(userId);

      const userEmotion = userEmotions[userId];
        if (userEmotion) {
          currentEmotion = userEmotion;
          updateEmoticonImage(userId);
        }
      }
    }
    };




const updateEmoticonImage = (userId) => {
  const emoticonContainer = document.querySelector(`#emoticon-container-${userId}`);
  if (emoticonContainer) {
    let emoticonImage = emoticonContainer.querySelector("img");
    if (!emoticonImage) {
      emoticonImage = document.createElement("img");
      emoticonContainer.appendChild(emoticonImage);
    }
    emoticonImage.src = `${userEmotions[userId]}.png`;
  }
};

const createEmoticon = (userId) => {
  const emoticonContainerId = `emoticon-container-${userId}`;
  let emoticonContainer = document.getElementById(emoticonContainerId);

  if (!emoticonContainer) {
    emoticonContainer = document.createElement("div");
    emoticonContainer.classList.add("emoticon-container");
    emoticonContainer.id = emoticonContainerId;

    const peerVideoGrid = document.querySelector(`.peer-video-grid[data-peer="${userId}"]`);
    if (peerVideoGrid) {
      peerVideoGrid.appendChild(emoticonContainer);
    }
  }

  updateEmoticonImage(userId);

  setTimeout(() => {
    emoticonContainer.innerHTML = "";
  }, 10000);

  return emoticonContainer;
};



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
