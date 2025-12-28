const passInput = document.getElementById("roomPass");
const connectBtn = document.getElementById("connectBtn");
const btnText = document.getElementById("btnText");
const btnLoader = document.getElementById("btnLoader");
const hostView = document.getElementById("hostView");
const guestView = document.getElementById("guestView");
const roomIdDisplay = document.getElementById("roomIdDisplay");
const roomPassDisplay = document.getElementById("roomPassDisplay");
const copyBtn = document.getElementById("copyBtn");
const hostExitBtn = document.getElementById("hostExitBtn");
const connectionDot = document.getElementById("connectionDot");
const connectionText = document.getElementById("connectionText");

let roomId = null;
let roomPass = null;
let isLoading = false;
let pookieConnected = false;

// Validate input and enable/disable join button
function validateInput() {
  const pass = passInput.value.trim();
  connectBtn.disabled = pass.length === 0;
}

passInput.addEventListener("input", validateInput);

// Copy room info to clipboard
copyBtn.addEventListener("click", () => {
  const roomId = roomIdDisplay.textContent;
  const pass = roomPassDisplay.textContent;
  const copyText = `Room ID: ${roomId}\nPassword: ${pass}`;
  navigator.clipboard.writeText(copyText).then(() => {
    const originalText = copyBtn.textContent;
    copyBtn.textContent = "Copied!";
    setTimeout(() => {
      copyBtn.textContent = originalText;
    }, 1500);
  });
});

// Exit button - disconnect and show login view
hostExitBtn.addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "DISCONNECT" });
  showGuestView();
});

// Get room info from background
chrome.runtime.sendMessage({ type: "ROOM_INFO" }, (response) => {
  if (chrome.runtime.lastError) {
    console.error(chrome.runtime.lastError);
    return;
  }

  if (!response) {
    showGuestView();
    return;
  }

  roomId = response?.roomId;
  roomPass = response?.roomPass;
  const isHost = response?.isHost;
  pookieConnected = response?.pookieConnected;
  const connecting = response?.connecting;

  if (connecting) setLoading(true);

  if (pookieConnected) pookieConnectedTrue();
  else pookieConnectedFalse();

  if (isHost && roomId) {
    showHostView(roomId, roomPass);
  } else {
    showGuestView();
  }
});

function showHostView(roomId, pass) {
  hostView.classList.add("active");
  guestView.classList.add("hidden");
  roomIdDisplay.textContent = roomId;
  roomPassDisplay.textContent = pass || "-----";
}

function showGuestView() {
  console.log("Guest view called");
  hostView.classList.remove("active");
  guestView.classList.remove("hidden");

  // Autofill saved password
  chrome.storage.local.get(["roomPass"], (res) => {
    if (res.roomPass) {
      passInput.value = res.roomPass;
    }
    validateInput();
  });
}

function setLoading(loading) {
  isLoading = loading;
  connectBtn.disabled = loading || passInput.value.trim().length === 0;
  btnText.textContent = loading ? "Connecting..." : "Host Room";
  btnLoader.classList.toggle("hidden", !loading);
}

connectBtn.addEventListener("click", () => {
  const pass = passInput.value.trim();

  if (!pass || isLoading) return;

  setLoading(true);
  roomPass = pass;

  // Save password
  chrome.storage.local.set({ roomPass: pass });

  // Notify background
  chrome.runtime.sendMessage(
    {
      type: "SET_ROOM_PASS",
      pass,
    },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        setLoading(false);
        return;
      }

      if (!response?.ok) {
        console.error("Failed to set pass");
        setLoading(false);
        return;
      }

      // BG has connected + received room ID
      roomId = response.roomId;

      console.log("✅ Room assigned:", roomId);
    }
  );
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "ROOM_ID") {
    showHostView(msg.ROOM_ID, roomPass);
    setLoading(false);
    roomId = msg.ROOM_ID;
    roomIdDisplay.textContent = roomId;
  }

  if (msg.type === "CONTROLLER_CONNECTED") {
    pookieConnectedTrue();
  }

  if (msg.type === "CONTROLLER_DISCONNECTED") {
    pookieConnectedFalse(true);
  }
});

function pookieConnectedTrue() {
  connectionDot.classList.add("connected");
  connectionText.textContent = "pookie joined ⸜(｡˃ ᵕ ˂ )⸝♡!";
}

function pookieConnectedFalse(disconnected = false) {
  connectionDot.classList.remove("connected");
  connectionText.textContent = !disconnected
    ? "waiting for pookie >.<"
    : "pookie left ૮◞‸◟˶𑁬";
}
