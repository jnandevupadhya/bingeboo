console.log("🎬 FlickMate Host injected");

let ROOM_ID = null;
let WS_URL = null;
let manualClose = false;
let roomPass = null;
let ws = null;
let hosted = false;
let pookieConnected = false;
let connecting = false;

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

  ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    console.log("🟢 WS connected as HOST");
  };

  ws.onmessage = (e) => {
    let cmd;
    try {
      cmd = JSON.parse(e.data);
    } catch {
      return;
    }

    if (cmd?.type === "hosted") {
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
  const keyMap = {
    play: { key: " ", code: "Space", vk: 32 },
    pause: { key: " ", code: "Space", vk: 32 },
    toggle: { key: " ", code: "Space", vk: 32 },
    forward: { key: "ArrowRight", code: "ArrowRight", vk: 39 },
    rewind: { key: "ArrowLeft", code: "ArrowLeft", vk: 37 },
    fullscreen: { key: "f", code: "KeyF", vk: 70 },
    mute: { key: "m", code: "KeyM", vk: 77 },
  };

  const k = keyMap[cmd.action];
  if (!k) {
    console.warn("Unknown Netflix command:", cmd);
    return;
  }

  const tabId = await getNetflixTabId();
  if (!tabId) return;

  await ensureDebugger(tabId);

  // do debugger stuff
  await sendKey(tabId, k);
  // or await clickToggleNetflix(tabId);

  await detachDebugger(tabId);
}

async function sendKey(tabId, { key, code, vk }) {
  await chrome.debugger.sendCommand({ tabId }, "Input.dispatchKeyEvent", {
    type: "keyDown",
    key,
    code,
    windowsVirtualKeyCode: vk,
    nativeVirtualKeyCode: vk,
  });

  await chrome.debugger.sendCommand({ tabId }, "Input.dispatchKeyEvent", {
    type: "keyUp",
    key,
    code,
    windowsVirtualKeyCode: vk,
    nativeVirtualKeyCode: vk,
  });

  sendToActiveNetflix({
    type: "TOGGLE",
    reason: "paused_by_partner",
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
