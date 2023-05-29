// Creazione delle costanti e dei selettori degli elementi HTML
const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const emoticonContainer = document.getElementById("emoticon-container");
const myVideo = document.createElement("video");
const showChat = document.querySelector("#showChat");
const backBtn = document.querySelector(".header__back");

// Impostazione del video in modalità muto
myVideo.muted = true;

// Dizionario per memorizzare le emozioni degli utenti
const userEmotions = {};

// Aggiunta di un event listener al pulsante "Indietro" per tornare alla schermata principale
backBtn.addEventListener("click", () => {
  document.querySelector(".main__left").style.display = "flex";
  document.querySelector(".main__left").style.flex = "1";
  document.querySelector(".main__right").style.display = "none";
  document.querySelector(".header__back").style.display = "none";
});

// Aggiunta di un event listener al pulsante "Mostra chat" per visualizzare la schermata della chat
showChat.addEventListener("click", () => {
  document.querySelector(".main__right").style.display = "flex";
  document.querySelector(".main__right").style.flex = "1";
  document.querySelector(".main__left").style.display = "none";
  document.querySelector(".header__back").style.display = "block";
});

// Richiesta del nome dell'utente
const user = prompt("Enter your name");

// Creazione di una nuova istanza di Peer
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

// Variabile per memorizzare lo stream video dell'utente
let myVideoStream;

// Ottenere l'accesso all'audio e al video dell'utente
navigator.mediaDevices
  .getUserMedia({
    audio: true,
    video: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream);

    // Gestione delle chiamate in arrivo
    peer.on("call", (call) => {
      console.log('someone call me');
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });

    // Gestione della connessione di un nuovo utente
    socket.on("user-connected", (userId) => {
      connectToNewUser(userId, stream);
    });
  });

// Connessione a un nuovo utente
const connectToNewUser = (userId, stream) => {
  console.log('I call someone' + userId)
  const call = peer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream, userId); // Passa userId come parametro
    updateEmoticonContainer(userId);
  });
};

// Evento scatenato quando il Peer è pronto e ha un ID
peer.on("open", (id) => {
  console.log('my id is' + id);
  socket.emit("join-room", ROOM_ID, id, user);
});

// Aggiunta dello stream video al video grid
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
    updateEmoticonContainer(userId, emoticonContainer); // Mostra l'emoticon container sull'elemento video corrispondente
  });
};

// Creazione di un elemento HTML per contenere le emoticon
function createEmoticonContainer(userId) {
  const emoticonContainer = document.createElement("div");
  emoticonContainer.classList.add("emoticon-container");
  emoticonContainer.id = `emoticon-container-${userId}`; // Assegna un ID univoco all'emoticon container
  return emoticonContainer;
}

// Selettore degli elementi HTML per la chat
let text = document.querySelector("#chat_message");
let send = document.getElementById("send");
let messages = document.querySelector(".messages");
let currentEmotion = "";

// Aggiunta di un event listener al pulsante di invio del messaggio
send.addEventListener("click", (e) => {
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

// Aggiunta di un event listener alla casella di testo per inviare il messaggio premendo il tasto Invio
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

// Aggiornamento dell'emoticon container per l'utente corrispondente
const updateEmoticonContainer = (userId, emoticonContainer) => {
  const peerVideoGrid = document.querySelector(`.peer-video-grid[data-peer="${userId}"]`);
  if (peerVideoGrid && !emoticonContainer) {
    emoticonContainer = createEmoticonContainer(userId);
    peerVideoGrid.appendChild(emoticonContainer);
  }
};

// Gestione dell'evento "createMessage" per mostrare i messaggi nella chat
socket.on("createMessage", (message, userName) => {
  let messageContent = message;
  let includeEmoticon = false;

  if (message.includes("felice")) {
    currentEmotion = "felice";
    includeEmoticon = true;
  } else if (message.includes("arrabbiato")) {
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

// Aggiornamento dell'emoticon per l'utente corrispondente
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

// Creazione di un'immagine emoticon
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

// Aggiunta degli event listener ai pulsanti di controllo audio/video
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
