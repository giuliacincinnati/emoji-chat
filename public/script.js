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
    const call = peer.call(userId, stream);
    const video = document.createElement("video");
    call.on("stream", (userVideoStream) => {
      addVideoStream(video, userVideoStream, userId); // Passa userId come parametro
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
    const peerVideoGrid = document.createElement("div");
    peerVideoGrid.classList.add("peer-video-grid");
    peerVideoGrid.appendChild(video);

    const emoticonContainer = createEmoticonContainer(userId);
    peerVideoGrid.appendChild(emoticonContainer);

    videoGrid.appendChild(peerVideoGrid);
  });
};


function createEmoticonContainer(userId) {
  const emoticonContainer = document.createElement("div");
  emoticonContainer.classList.add("emoticon-container");
  emoticonContainer.id = `emoticon-container-${userId}`;
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
    updateEmoticon(); // Mostra l'emoticon container sul tuo elemento video
    socket.emit("message", text.value, currentEmotion); // Invia il messaggio e l'emozione corrente
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
    socket.emit("message", text.value);
    text.value = "";
  }
});

socket.on("createMessage", (message, userName, emotion) => {
  let messageContent = message;

  if (emotion === "felice" || emotion === "triste" || emotion === "arrabbiato") {
    updateEmoticon(userName); // Mostra l'emoticon container sul suo elemento video
  }

  messages.innerHTML += `
    <div class="message">
      <b><i class="far fa-user-circle"></i> <span>${userName === user ? "me" : userName}</span></b>
      <span>${messageContent}</span>
    </div>`;
});



function updateEmoticon(targetUserId) {
  if (currentEmotion === "felice") {
    createEmoticon("felice.png", targetUserId);
  } else if (currentEmotion === "triste") {
    createEmoticon("triste.png", targetUserId);
  } else if (currentEmotion === "arrabbiato") {
    createEmoticon("arrabbiato.png", targetUserId);


  // Mostra l'emoticon container nell'elemento video corrispondente
  if (userId) {
    let emoticonContainer = document.getElementById(`emoticon-container-${userId}`);
    if (!emoticonContainer) {
      emoticonContainer = createEmoticonContainer(userId);
      const peerVideoGrid = document.querySelector(`.peer-video-grid[data-peer="${userId}"]`);
      if (peerVideoGrid) {
        peerVideoGrid.appendChild(emoticonContainer);
      }
    }
  }
    }
  }




function createEmoticon(imageFileName, userId) {
  const emoticonImage = document.createElement("img");
  emoticonImage.src = imageFileName;

  const emoticonContainer = document.getElementById(`emoticon-container-${userId}`); // Seleziona l'emoticon container corretto utilizzando l'ID univoco
  emoticonContainer.innerHTML = ''; // Rimuovi eventuali emoticon precedenti
  emoticonContainer.appendChild(emoticonImage);

  setTimeout(() => {
    emoticonContainer.innerHTML = ''; // Rimuovi l'emoticon dopo 10 secondi
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
