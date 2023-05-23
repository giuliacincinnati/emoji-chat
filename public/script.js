const socket = io("/");
const videoGrid = document.getElementById("video-grid");
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
    videoGrid.append(video);
  });
};

let text = document.querySelector("#chat_message");
let send = document.getElementById("send");
let messages = document.querySelector(".messages");
let currentEmotion = "";
let myEmotion = "";

send.addEventListener("click", (e) => {
  if (text.value.length !== 0) {
    myEmotion = currentEmotion; // Aggiorna l'emozione corrente
    socket.emit("message", { message: text.value, emotion: myEmotion }); // Invia il messaggio e l'emozione al server
    text.value = "";
  }
});


text.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && text.value.length !== 0) {
    myEmotion = currentEmotion; // Aggiorna l'emozione corrente
    socket.emit("message", { message: text.value, emotion: myEmotion }); // Invia il messaggio e l'emozione al server
    text.value = "";
  }
});


socket.on("createMessage", (data) => {
  let messageContent = data.message;
  let userName = data.userName;
  let emotion = data.emotion;

  if (emotion) {
    // Se l'emozione è presente nel messaggio ricevuto, aggiorna l'emozione dell'utente corrispondente
    if (userName === user) {
      myEmotion = emotion;
    }
    // Aggiorna l'emozione nel riquadro video dell'utente corrispondente
    updateParticipantEmotion(userName, emotion);
  }

  // Resto del codice...
});


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
  myEmotion = currentEmotion;
}


function createEmoticon(imageFileName) {
  const emoticonImage = document.createElement("img");
  emoticonImage.src = imageFileName;
  emoticonImage.style.position = "fixed";
  emoticonImage.style.left = "50%";
  emoticonImage.style.top = "50%";
  emoticonImage.style.transform = "translate(-50%, -50%)";
  document.body.appendChild(emoticonImage);

  // Scomparsa dell'emoticon dopo 10 secondi
  setTimeout(() => {
    document.body.removeChild(emoticonImage);
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

function updateParticipantEmotion(userName, emotion) {
  const videoElements = document.getElementsByTagName("video");
  for (let i = 0; i < videoElements.length; i++) {
    const video = videoElements[i];
    if (video.id === userName) {
      // Trova il video dell'utente corrispondente
      const emoticonContainer = video.parentNode.querySelector(
        "#emoticon-container"
      );
      const emoticonImage = emoticonContainer.querySelector("#emoticon-image");

      if (emotion === "felice") {
        emoticonImage.src = "felice.png";
      } else if (emotion === "triste") {
       emoticonImage.src = "triste.png";
     } else if (emotion === "arrabbiato") {
       emoticonImage.src = "arrabbiato.png";
     }
   }
 }
}
