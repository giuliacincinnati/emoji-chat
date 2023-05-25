const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const emoticonContainer = document.getElementById("emoticon-container");
const myVideo = document.createElement("video");
const showChat = document.querySelector("#showChat");
const backBtn = document.querySelector(".header__back");
myVideo.muted = true;
const peers = {}; // Oggetto per memorizzare gli ID PeerJS e gli elementi video associati

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

const userName = prompt("Enter your name");

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
    const call = peer.call(userId, stream);
    const video = document.createElement("video");
    call.on("stream", (userVideoStream) => {
      addVideoStream(video, userVideoStream, userId, userName); // Passa userId come parametro
    });

    // Invia l'emozione corrente al nuovo utente
    socket.emit("message", "", currentEmotion, userId);
  };


peer.on("open", (id) => {
  console.log('my id is' + id);
  socket.emit("join-room", ROOM_ID, id, user, userName);
});

const addVideoStream = (video, stream, userId, userName) => {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
    const peerVideoGrid = document.createElement("div");
    peerVideoGrid.classList.add("peer-video-grid");
    peerVideoGrid.dataset.peer = userId;
    const emoticonContainer = createEmoticonContainer(userId);
    peerVideoGrid.appendChild(video);
    peerVideoGrid.appendChild(emoticonContainer);
    videoGrid.appendChild(peerVideoGrid);

    if (!currentEmotion) {
      videoGrid.appendChild(video);
      videoGrid.appendChild(emoticonContainer);
    }
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
    } else if (text.value.includes("arrabbiat")) {
      currentEmotion = "arrabbiato";
    } else if (text.value.includes("triste")) {
      currentEmotion = "triste";
    } else {
      currentEmotion = "";
    }
    updateEmoticon();
    socket.emit("message", text.value, currentEmotion); // Invia l'emozione corrente
    text.value = "";
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
    updateEmoticon();
    socket.emit("message", text.value, currentEmotion); // Invia l'emozione corrente
    text.value = "";
  }
});


function updateEmoticonContainer(userName, userId) {
  const emoticonContainers = document.querySelectorAll(`[data-peer="${userId}"]`); // Seleziona tutti gli elementi con lo stesso ID PeerJS
  emoticonContainers.forEach((emoticonContainer) => {
    emoticonContainer.innerHTML = '';
    if (currentEmotion) {
      const emoticonImage = document.createElement("img");
      emoticonImage.src = `${currentEmotion}.png`;
      emoticonContainer.appendChild(emoticonImage);
      emoticonContainer.removeAttribute("hidden");
    } else {
      emoticonContainer.setAttribute("hidden", true);
    }
  });
}





socket.on("createMessage", (message, userName, userId) => {
  messages.innerHTML += `
    <div class="message">
      <b><i class="far fa-user-circle"></i> <span>${userName === user ? "me" : userName}</span></b>
      <span>${message}</span>
    </div>`;

  updateEmoticonContainer(userName, userId); // Mostra l'emoticon container sull'elemento video corrispondente
});




function updateEmoticon() {
  const peerVideoGrids = document.querySelectorAll(".peer-video-grid");
  peerVideoGrids.forEach((peerVideoGrid) => {
    const userId = peerVideoGrid.dataset.peer;
    updateEmoticonContainer(userId);
  });
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
