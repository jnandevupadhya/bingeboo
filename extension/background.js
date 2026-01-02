console.log("🎬 FlickMate Host injected");

let ROOM_ID = null;
let WS_URL = null;
let manualClose = false;
let roomPass = null;
let ws = null;
let hosted = false;
let pookieConnected = false;
let connecting = false;
let fallbackTimer;
let fallbackOpened = false;
let globalTabId = null;

chrome.storage.local.get(["ROOM_ID"], (result) => {
  if (result.ROOM_ID) ROOM_ID = result.ROOM_ID;
});

const attachedTabs = new Set();

async function ensureDebugger(tabId) {
  if (attachedTabs.has(tabId)) return;

  await chrome.debugger.attach({ tabId }, "1.3");
  attachedTabs.add(tabId);
}

async function detachDebugger(tabId) {
  if (!attachedTabs.has(tabId)) return;

  try {
    await chrome.debugger.detach({ tabId });
  } catch (e) {
    // Ignore if already detached
  } finally {
    attachedTabs.delete(tabId);
  }
}

async function getNetflixTabId() {
  const tabs = await chrome.tabs.query({
    url: ["*://www.netflix.com/*"],
  });

  if (!tabs.length) {
    console.warn("❌ Netflix tab not found");
    return null;
  }

  return tabs[0].id;
}

function openFallback() {
  if (fallbackOpened) return;
  fallbackOpened = true;

  chrome.tabs.create({
    url: "https://bingeboo-backend-status.netlify.app/",
    active: true, // or false if you want it in background
  });
}

function connectWS() {
  if (!roomPass && roomPass.length > 0) {
    console.warn("⛔ No room pass, not connecting");
    return;
  }

  if (ws && ws.readyState === WebSocket.OPEN) return;

  const params = new URLSearchParams({
    pass: roomPass,
    ...(ROOM_ID ? { room_id: ROOM_ID } : {}),
  });

  // const WS_URL = `ws://127.0.0.1:8000/ws/host?${params.toString()}`; //use if you're developing locally

  const WS_URL = `wss://bingeboo-dev.onrender.com/ws/host?${params.toString()}`;

  fallbackTimer = setTimeout(() => {
    console.warn("⏳ WS taking too long, opening countdown page");
    openFallback();
  }, 5000);

  ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    console.log("🟢 WS connected as HOST");
  };

  ws.onmessage = async (e) => {
    let cmd;
    try {
      cmd = JSON.parse(e.data);
    } catch {
      return;
    }

    if (cmd?.type == "hosted") {
      clearTimeout(fallbackTimer); // ⛔ stop fallback
      const ROOM_ID = cmd.room_id;
      hosted = true;
      connecting = false;

      chrome.runtime.sendMessage({
        type: "ROOM_ID",
        ROOM_ID,
      });

      chrome.storage.local.set({ ROOM_ID }, () => {
        if (chrome.runtime.lastError) {
          console.error("Failed to save ROOM_ID", chrome.runtime.lastError);
        } else {
          console.log("✅ ROOM_ID saved:", ROOM_ID);
        }
      });
    } else if (cmd?.type === "controller_connected") {
      pookieConnected = true;

      await sendInitialPlaybackState();

      chrome.runtime.sendMessage({ type: "CONTROLLER_CONNECTED" });
    } else if (cmd?.type === "controller_disconnected") {
      pookieConnected = false;
      chrome.runtime.sendMessage({ type: "CONTROLLER_DISCONNECTED" });
    }
    {
      console.log(cmd);
      dispatchNetflixCommand(cmd);
    }
  };

  ws.onerror = (e) => {
    console.error("❌ WS error", e);
  };

  ws.onclose = (event) => {
    console.warn("🔌 WS closed", event.code, event.reason);

    if (manualClose) {
      console.log("🛑 Manual disconnect, no reconnect");
      manualClose = false; // reset
      return;
    }

    // ❗ Only runs for unexpected closes
    console.warn("🔁 Unexpected close, reconnecting...");
    setTimeout(connectWS, 2000);
  };
}

async function dispatchNetflixCommand(cmd) {
  const tabId = await getNetflixTabId();
  if (!tabId) return;

  switch (cmd.action) {
    case "play":
    case "pause":
    case "toggle":
      await clickNetflixPlayPause(tabId);
      break;

    case "forward":
      await sendNetflixKey(tabId, "ArrowRight", "ArrowRight", 39);
      break;

    case "rewind":
      await sendNetflixKey(tabId, "ArrowLeft", "ArrowLeft", 37);
      break;

    // case "fullscreen":
    //   await sendNetflixKey(tabId, "f", "KeyF", 70);
    //   break;

    // case "mute":
    //   await sendNetflixKey(tabId, "m", "KeyM", 77);
    //   break;

    default:
      console.warn("Unknown Netflix command:", cmd);
  }
}

async function clickNetflixPlayPause(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const video = document.querySelector("video");

      if (!video) {
        console.warn("Video element not found");
        return;
      }

      if (video.paused) {
        video.play().catch((err) => {
          console.warn("Play blocked:", err);
        });
      } else {
        video.pause();
      }
    },
  });

  sendToActiveNetflix({
    type: "TOGGLE",
    reason: "paused_by_partner",
  });
}

async function sendNetflixKey(tabId, key, code, keyCode) {
  await chrome.scripting.executeScript({
    target: { tabId },
    func: (key, code, keyCode) => {
      const player =
        document.querySelector('[data-uia="player"]') ||
        document.querySelector("video")?.parentElement;

      if (!player) return;

      player.focus();

      player.dispatchEvent(
        new KeyboardEvent("keydown", {
          key,
          code,
          keyCode,
          which: keyCode,
          bubbles: true,
          cancelable: true,
        })
      );

      player.dispatchEvent(
        new KeyboardEvent("keyup", {
          key,
          code,
          keyCode,
          which: keyCode,
          bubbles: true,
          cancelable: true,
        })
      );
    },
    args: [key, code, keyCode],
  });
}

chrome.tabs.onRemoved.addListener(async (tabId) => {
  if (attachedTabs.has(tabId)) {
    await chrome.debugger.detach({ tabId });
    attachedTabs.delete(tabId);
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "SET_ROOM_PASS") {
    roomPass = msg.pass;
    console.log("🔐 Room pass set", roomPass);
    connecting = true;

    connectWS();

    sendResponse({
      ok: true,
      roomId: ROOM_ID,
    });
    return true;
  }

  if (msg.type === "ROOM_INFO") {
    console.log("ROOM PASS: ", roomPass);
    sendResponse({
      roomId: ROOM_ID,
      roomPass: roomPass,
      isHost: hosted,
      pookieConnected,
      connecting,
    });
    return true;
  }

  if (msg.type === "DISCONNECT") {
    if (ws && ws.readyState === WebSocket.OPEN) {
      manualClose = true;
      ws.close(1000, "manual disconnect");
      hosted = false;
    }
    return true;
  }

  if (msg.type === "TOGGLE_MANUAL") {
    console.log("Manual toggle triggered");
    sendJSON({
      type: !msg.paused ? "playing" : "paused",
    });
  }
});

chrome.alarms.create({
  delayInMinutes: 0.47,
  periodInMinutes: 0.47,
});
chrome.alarms.onAlarm.addListener(() => {});

function sendToActiveNetflix(message) {
  chrome.tabs.query({ currentWindow: true }, (tabs) => {
    const netflixTab = tabs.find(
      (tab) => tab.url && tab.url.startsWith("https://www.netflix.com/")
    );

    if (!netflixTab) {
      console.warn("No active Netflix tab found");
      return;
    }

    chrome.tabs.sendMessage(netflixTab.id, message, (resp) => {
      if (chrome.runtime.lastError) {
        console.warn("Send failed:", chrome.runtime.lastError.message);
        return;
      }

      if (resp?.type === "TOGGLE_RESP") {
        console.log("TOGGLE_RESP TRIGGERED");

        sendJSON({
          type: !resp.paused ? "playing" : "paused",
        });
      }
    });
  });
}

function sendJSON(obj) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify(obj));
}

async function sendInitialPlaybackState() {
  globalTabId = await getNetflixTabId();
  if (globalTabId) {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: globalTabId },
      func: () => {
        const video = document.querySelector("video");
        if (!video) return null;
        return video.paused;
      },
    });

    if (result !== null) {
      console.log(result);
      sendJSON({
        type: result ? "paused" : "playing",
      });
    }
  }
}
