# 🧠 BingeBoo Backend

This folder contains the **server** that keeps BingeBoo in sync.

You don’t need to understand how it works to use BingeBoo —  
this backend just sits in the background and makes sure both people see the same thing at the same time.

If you’re **not a developer**, you can safely stop reading after the first section.  
If you *are* curious (or a nerd), scroll down — the technical stuff is at the end 🙂

---

## 🛠️ What This Does (Plain English)

When two people use BingeBoo:

- One person **creates a room**
- The other person **joins using a room code**
- When someone presses **play / pause / rewind / forward**
- This backend instantly tells the other side to do the same thing

That’s it.

No videos are sent.
No screens are shared.
No Netflix content ever passes through this server.

It only handles **signals**, like:
> “Play now”  
> “Pause here”  
> “Rewind 10 seconds”

---

## 🔐 Is Any Netflix Data Stored Here?

No.

This backend:
- Does **not** access Netflix accounts
- Does **not** stream or store video
- Does **not** save watch history

It only relays **real-time playback state** between connected clients.

---

## 🧑‍💻 For Developers (Technical Details)

If you want to run or modify the backend, this section is for you.

### Tech Stack
- **FastAPI**
- **WebSockets**
- **Uvicorn**

The server acts as a lightweight real-time relay between:
- The Chrome extension (host side)
- The Electron app (client side)

---

### WebSocket Flow (High Level)

- A **host** connects to the server and creates a room  
- A **client** joins the same room using the room code  
- The **Client**'s WebSocket connection is mapped to the host and used for authentication.
- Playback actions (play, pause, rewind, forward) are sent as WebSocket messages  
- The server forwards these messages to the other connected participant  

The backend does **not** interpret or process media — it only forwards playback state.

---

### Running Locally

```bash
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload
```

By default, the server runs on:
```
http://127.0.0.1:8000
```
---
### Deployment

The backend is hosted using **Render** for easy deployment and availability.

The same codebase works for:
- Local development
- Cloud deployment

No environment-specific changes are required beyond updating the websocket URL.

---

## 🧩 Final Note

This backend was designed to be:
- Small
- Easy to understand
- Easy to extend

No heavy architecture, no unnecessary layers —  
just a clean WebSocket relay that keeps both sides in sync.
