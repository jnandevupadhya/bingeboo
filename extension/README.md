# 🧩 BingeBoo Browser Extension

This extension is the **bridge between Netflix and BingeBoo**.

You don’t use it directly to “watch” anything —  
it simply listens for sync commands and applies them to Netflix so both people stay perfectly in sync.

If you’re not a developer, the first half is all you need.  
The technical details are at the end.

---

## 🧠 What This Extension Does (Simple Explanation)

When you use BingeBoo:

- Your partner presses a button (play / pause / rewind / forward)
- That action goes to the backend
- This extension receives the command
- Netflix does the same thing on your screen

The extension also:
- Shows the **Room ID**
- Shows the **Room password**
- Shows whether your **partner is connected or not**

It does **not** stream video, share your screen, or access your Netflix account.

---

## 🔐 Why a Password Is Required

When you open the extension, the first thing you’ll see is a **password prompt**.

This is intentional.

The password:
- Prevents random or accidental connections
- Makes sure only your intended partner can join
- Keeps the session private

Only after the backend accepts the request does the extension switch to the main view.

---

## 🪜 How a Normal User Uses This

<p align="center">
<img src="https://i.ibb.co/n8CT7p4N/binge-extension-binge-Boo.gif" width="500" alt="bingeboo-extension" border="5">
</p>

1. [Download](https://github.com/jnandevupadhya/bingeboo/releases/latest/download/extension.rar) the extension
2. [Install](https://ui.vision/howto/install-chrome-extension-from-file) the extension  
3. Open **Netflix** in your browser  
4. Click the BingeBoo extension  
5. Enter a **password** to create a protected room  
6. Wait for the backend to accept the request  
7. Once accepted, you’ll see:
   - Room ID  
   - Room password  
   - Partner connection status  

From here, everything stays in sync automatically.


---

## ⚠️ Important Notes

- You must watch your shows on the browser where you install the extension
- This extension **only works with the BingeBoo backend running**. [Click to wake the backend up.]()
- It isn’t meant to be used on its own — it’s designed for two people, like friends or couples, watching together.
- It only activates on **netflix.com**
- No Netflix content ever leaves your browser

---

## 🧑‍💻 For Developers (Technical Details)

### Permissions Used

The extension uses:
- `tabs`
- `scripting`
- `storage`
- `activeTab`
- Host permissions for `https://www.netflix.com/*`

These are required to:
- Detect Netflix playback
- Apply control commands
- Store room information locally

---

### What It Technically Does

- Listens for **WebSocket messages** from the backend
- Receives:
  - Playback commands
  - Partner connection status
- Executes commands on the Netflix player using a content script
- Updates the extension UI in real time

It does **not**:
- Read Netflix credentials
- Access video streams
- Store any media-related data


---

## 🧩 Final Note

This extension is intentionally minimal.

It does one thing well:
> keep Netflix playback in sync without getting in the way.

Everything else; rooms, logic and pairing is handled elsewhere.

