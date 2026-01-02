# 🍿 **BingeBoo — Binge nights, better together!**

> Made for fun ❤️ · Not affiliated with Netflix

Hey!

**BingeBoo** is a small side project I built to make long-distance binge sessions feel less… long-distance.  
It’s basically a **remote control for Netflix**, but shared — one person hosts, the other joins, and both stay perfectly in sync.

No screen sharing.  
No streaming content around.  
Just syncing *playback state* — like play, pause, rewind, and forward.

Simple, cozy, and made for chill watch nights. 🌙

---

## 🛋️ The Idea

You know that moment when you’re watching something with someone on call and you go:

> “Wait—pause. Okay play. No no rewind 10 seconds.”

Yeah.  
BingeBoo exists to kill that chaos.

One person creates a **room**, shares the **room code**, and the other person joins using the app.  
From there, both of you control playback using just **three simple buttons** — and Netflix stays in sync.

---

## 🎥 Quick Look

<p align="center">
<b>WATCH</b>
</p>
<p align="center">
  <a href="https://youtu.be/SD39LjpOwfA">
    <img src="https://img.youtube.com/vi/SD39LjpOwfA/maxresdefault.jpg" width="500" alt="Quick look">
  </a>
</p>

---

## ✨ What It Does

- 🧑‍💻 Host / join rooms using a simple room ID
- 🔗 Room ID sharing  
- ⏯️ Sync play / pause  
- ⏩ Sync rewind & forward  
- 🧩 Chrome extension to hook into Netflix  
- 🖥️ Electron app for the partner’s remote controls  
- ⚡ Real-time sync using WebSockets  

---

# 🧭 Where to Start

### 👉 If you want to *host*:
- Install the [`Chrome extension`](extension#-how-a-normal-user-uses-this)
- Create a room
- Share the room ID with your partner
- Read [`extension`](extension/) to learn more

### 🎮 If you want to *join*:
- [`Download`](https://github.com/jnandevupadhya/bingeboo/releases/latest/download/BingeBoo.Setup.1.0.0.exe)and open the **Electron app**
- Enter the room ID and the password
- Control playback using the remote buttons
- Read [`frontend`](frontend/) to learn more
> Please note: the app is around ~198 MB in size; this is mainly because it’s built with Electron.


---

## 🧱 Tech Stack

- **Backend:** FastAPI + WebSockets  
- **Frontend:** React  
- **Clients:**  
  - Chrome Extension (Netflix controller)  
  - Electron App (remote controller)  
- **Hosting:** Render (FastAPI backend)

---

## 📁 Project Structure
```
.
├── backend/         → FastAPI + WebSockets server
├── extension/       → Chrome extension (Netflix controller)
├── frontend/        → Electron app (remote for partner)
├── .dockerignore
├── .gitignore
├── Dockerfile       → Docker instructions
└── README.md
```


---

## ⚠️ Disclaimer

BingeBoo does **not** stream, share, or modify Netflix content in any way.  
It only syncs **playback state** (play, pause, seek) between users.

This project was built purely for **learning and personal use**.  
Please use it responsibly and at your own discretion.

---

## 🌙 Final Thoughts

BingeBoo isn’t a product or startup; just a cozy little project that makes watching together easier.

If it helps you avoid the constant   “wait—play—pause—rewind” loop, then it’s done its job.

Happy bingeing 🍿
