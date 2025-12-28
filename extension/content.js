let overlay;
let firstCallDone = false;
let video = null;

function createOverlay() {
  overlay = document.createElement("div");
  overlay.id = "bingeboo-overlay";
  overlay.innerHTML = "⏸ pookie paused netflix >.<";

  Object.assign(overlay.style, {
    position: "fixed",
    top: "10%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    padding: "16px 24px",
    background: "rgba(255,255,255,0.75)",
    color: "#000000",
    fontSize: "16px",
    borderRadius: "10px",
    zIndex: "999999",
    display: "none",
    pointerEvents: "none", // 👈 click-through
  });

  document.body.appendChild(overlay);
}

function waitForVideo() {
  video = document.querySelector("video");

  if (!video) {
    setTimeout(waitForVideo, 500);
    return;
  }

  if (!overlay) createOverlay();

  overlay.tabIndex = -1;

  overlay.addEventListener("mousedown", (e) => {
    e.preventDefault();
    console.log("focusing overlay");

    const video = document.querySelector("video");
    video.focus();
  });

  overlay.addEventListener("focusin", (e) => {
    console.log("focusing overlay");
    const video = document.querySelector("video");
    if (video) video.focus();
  });

  overlay.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    video.focus();
  });
}

waitForVideo();

function attachVideoListeners(video) {
  if (video.paused)
    chrome.runtime.sendMessage({
      type: "TOGGLE_MANUAL",
      paused: true,
    });
  else
    chrome.runtime.sendMessage({
      type: "TOGGLE_MANUAL",
      paused: false,
    });

  video.addEventListener("play", () => {
    if (firstCallDone) overlay.style.display = "none";
    chrome.runtime.sendMessage({
      type: "TOGGLE_MANUAL",
      paused: false,
    });
  });

  video.addEventListener("pause", () => {
    if (firstCallDone) overlay.style.display = "block";
    chrome.runtime.sendMessage({
      type: "TOGGLE_MANUAL",
      paused: true,
    });
  });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type !== "TOGGLE") {
    sendResponse({ ignored: true });
    return;
  }

  firstCallDone = true;

  const video = document.querySelector("video");
  if (!video) {
    sendResponse({ error: "NO_VIDEO" });
    return;
  }

  if (video.paused) {
    overlay.style.display = "block";
    sendResponse({ type: "TOGGLE_RESP", paused: true });
  } else {
    overlay.style.display = "none";
    sendResponse({ type: "TOGGLE_RESP", paused: false });
  }
});

const observer = new MutationObserver(() => {
  const currentVideo = document.querySelector("video");

  // video disappeared
  if (video && !currentVideo) {
    console.log("🎥 Video removed");

    // chrome.runtime.sendMessage({
    //   type: "VIDEO_REMOVED",
    // });

    overlay.style.display = "none";
    video = null;
  }

  // video replaced
  if (currentVideo && currentVideo !== video) {
    console.log("🎥 New video detected");

    video = currentVideo;
    attachVideoListeners(video);
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});
