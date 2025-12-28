# 🎛️ BingeBoo Frontend

This folder contains the **app you interact with** when using BingeBoo.

If the backend is the “brain”, this is the **face and hands** —  
the buttons you click, the room ID input, and the simple remote controls.

You don’t need to understand how any of this works to use BingeBoo.  
This section exists mainly for clarity and for people who are curious.

---

## 🖱️ What You See (Non-Technical)

<p align="center">
<img src="https://i.ibb.co/27JGc1qx/binge-client-binge-Boo.gif" width="500" alt="bingeboo app" border="5">
</p>

This frontend is responsible for:

- Showing a **clean, minimal UI**
- Letting users **enter a room ID**
- Letting users drag the app for convenience, using the grip (hamburger icon)
- Providing **simple remote buttons**:
  - Play / Pause
  - Rewind
  - Forward
- Sending button actions to the backend instantly

That’s all it’s meant to do;
no clutter, no distractions, no extra features.

---

## 🖥️ Why Electron?

BingeBoo uses **Electron** so the remote can:

- Run as a **desktop app**
- Stay focused while watching together
- Feel more like a “real remote” than a web page

Electron simply wraps the frontend and gives it a desktop shell.  
The logic itself still lives in the frontend code.

---

## 🧑‍💻 For Developers (Technical Details)
If you want to explore or modify the frontend, this section is for you.


### 📁 Backend Structure

```
backend/
├── core/
│   └── rooms.py          → Room creation & management
├── ws/
│   └── relay.py          → Message relay between clients
├── main.py               → FastAPI app entry point
├── requirements.txt      → Python dependencies
└── README.md
```


### Tech Stack
- **React** (UI)
- **Electron** (desktop wrapper)
- **WebSockets** (real-time communication)

The frontend:
- Connects to the FastAPI backend via WebSockets
- Sends playback commands
- Listens for sync updates from the server
- Restarts when host disconnects
---

### Running the Frontend

> Exact commands may vary depending on setup.

Typically:

```bash
cd frontend
npm i
npm run electron:dev
```

---

### Project Responsibility

This frontend:
- Does **not** control Netflix directly  
- Does **not** access user accounts  
- Does **not** handle any protected content  

It only sends **user intent** (button clicks) to the backend.

---

## 🧩 Final Note

The frontend was designed to stay:
- Simple  
- Calm  
- Non-intimidating  

It’s intentionally minimal so users can focus on the show, not the app controlling it.
