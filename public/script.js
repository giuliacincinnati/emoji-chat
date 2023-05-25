const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const emoticonContainer = document.getElementById("emoticon-container");
const myVideo = document.createElement("video");
const showChat = document.querySelector("#showChat");
const backBtn = document.querySelector(".header__back");
myVideo.muted = true;


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
  const call = peer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
};

peer.on("open", (id) => {
  console.log('my id is' + id);
  socket.emit("join-room", ROOM_ID, id, user);
});

const addVideoStream = (video, stream) => {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
    videoGrid.appendChild(video);
    videoGrid.appendChild(emoticonContainer); // Aggiungi emoticonContainer come figlio di videoGrid
  });

  const peerId = stream.id;
  video.setAttribute("data-peer-id", peerId); // Aggiungi l'attributo data-peer-id all'elemento video
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
    updateEmoticon();
    socket.emit("message", text.value);
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

socket.on("createMessage", (message, userName) => {
  let messageContent = message;
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
    updateEmoticon();
  }
});

function updateEmoticon() {
  const videos = document.querySelectorAll("video");
  const peerId = peer.id;

  videos.forEach((video) => {
    const videoPeerId = video.getAttribute("data-peer-id");
    if (videoPeerId === peerId) {
      const emoticonImage = createEmoticonImage();
      const videoContainer = video.parentElement;
      videoContainer.appendChild(emoticonImage);
    }
  });
}

function createEmoticonImage() {
  const emoticonImage = document.createElement("img");
  emoticonImage.src = currentEmotion + ".png";
  emoticonImage.id = "emoticon-image";

  return emoticonImage;
}

function createEmoticon(imageFileName) {
  const emoticonImage = createEmoticonImage();
  const peerId = peer.id;

  const emoticonContainers = document.querySelectorAll("#emoticon-container");

  emoticonContainers.forEach((container) => {
    const containerParent = container.parentElement;
    const video = containerParent.querySelector("video");
    const videoPeerId = video.getAttribute("data-peer-id");

    if (videoPeerId === peerId) {
      container.innerHTML = ""; // Rimuovi l'emoticon precedente
      container.appendChild(emoticonImage);
    }
  });

  setTimeout(() => {
    emoticonContainers.forEach((container) => {
      const containerParent = container.parentElement;
      const video = containerParent.querySelector("video");
      const videoPeerId = video.getAttribute("data-peer-id");

      if (videoPeerId === peerId) {
        container.innerHTML = ""; // Rimuovi l'emoticon dopo 10 secondi
      }
    });
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
