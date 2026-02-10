# 🚀 Quick Start Guide

Get your P2P video call app running in 2 minutes!

---

## ✅ Prerequisites

- **Node.js** 14+ ([Download](https://nodejs.org))
- **npm** 6+ (comes with Node.js)
- **Two browsers/tabs** or two computers on the same network
- **Chrome, Firefox, Safari, or Edge** (WebRTC support required)

---

## 1️⃣ Installation & Server Start

```bash
# Navigate to project folder
cd d:\videocall1

# Install dependencies
npm install

# Start WebSocket server
npm start
```

**Expected output:**
```
🎥 P2P Video Call Server Running!
📍 HTTP Server: http://localhost:8080
🔌 WebSocket Server: ws://localhost:8080
✅ Server ready for connections...
```

---

## 2️⃣ Access the App

Open your browser to:
```
http://localhost:8080
```

You should see the home screen with:
- 📱 "Create Meeting" button
- 📝 "Join Meeting" input field

---

## 3️⃣ Create Your First Call

### User 1 (Call Creator):
1. Click **"Create Meeting"** button
2. A meeting ID appears (e.g., `ABCD-1234-EFGH`)
3. Copy the link or share the ID with your friend
4. **Allow camera/microphone permissions** when prompted
5. Wait for remote user to join

### User 2 (Call Joiner):
1. In a new browser window/tab, go to `http://localhost:8080`
2. Paste the meeting ID in the "Join Meeting" field
3. Click **"Join"**
4. **Allow camera/microphone permissions** when prompted
5. Video call will establish automatically!

---

## 4️⃣ During the Call

### Controls:
- 🎤 **Microphone Icon**: Mute/unmute audio
- 📹 **Camera Icon**: Turn camera on/off
- ❌ **End Call Button**: Disconnect and return to home

### What You'll See:
- Your video in the **bottom-right corner**
- Remote user's video in the **center**
- Connection status and network info
- Real-time user count

---

## 5️⃣ Testing Tips

### ✅ Test on Same Network
- Open two browser tabs on the **same computer**
- Both users in **same WiFi network**
- Everything works via local NAT

### ✅ Test on Different Networks
- One user on WiFi, another on mobile hotspot
- The app uses **STUN servers** to traverse NAT
- Connection works but may be slower

### ✅ Test Network Switching
- Start on WiFi, switch to mobile hotspot mid-call
- The app detects network changes
- Connection quality metrics update automatically

---

## 🔍 Debugging

### Open Browser Console
```
Press: F12 → Console tab
```

You should see messages like:
```javascript
// Module initialization
[UI Manager] Initialized
[Room Manager] Initialized
[Media Capture] Initialized
[Peer Connection] Initialized
[Network Traversal] Initialized
[Signaling Client] Initialized

// Workflow steps
[App] Step 1: Home screen shown
[App] Step 2: Requesting media permissions
[App] Step 3: Media permission granted
[App] Step 4: Checking connectivity...
[App] Step 5: Connecting to signaling server...
[App] Step 6: Creating peer connection...
[App] Step 7: ICE connection established
[App] Step 8: Call active
```

### Common Issues

#### ❌ "Connection refused"
```
Solution: Check if server is running
> npm start in terminal
```

#### ❌ "Camera/Microphone blocked"
```
Solution: Click site settings (lock icon → Permissions)
Check if Camera/Microphone are set to "Allow"
```

#### ❌ "No remote video"
```
Solution: Check console for errors
Both users must grant permissions
Check if ICE connection is "connected"
```

#### ❌ "Choppy/Low quality video"
```
Solution: This is normal on slow networks
Check Network Quality in status display
Can be improved with TURN server
```

---

## 📊 Monitoring Connection Quality

During a call, the app displays:

```
Network Type: 4G / WiFi / 3G
ICE State: connected
Peer Count: 1
Public IP: 203.0.113.42 (if available)
```

---

## 🛠️ Project Structure

```
d:\videocall1\
├── index.html              # Web interface
├── styles.css              # UI styling
├── server.js               # WebSocket server
├── signaling-client.js      # WebSocket client
├── main.js                 # App orchestrator
├── modules/
│   ├── ui.js              # UI management
│   ├── roomManager.js      # Room/user management
│   ├── mediaCapture.js     # Camera/microphone
│   ├── peerConnection.js   # WebRTC peer handling
│   └── networkTraversal.js # Network diagnostics
├── package.json
├── WORKFLOW.md            # Complete workflow docs
├── TECH_STACK.md          # Technology reference
└── MODULES.md             # Module API reference
```

---

## 📚 Documentation Files

- **[WORKFLOW.md](./WORKFLOW.md)** - Complete 8-step workflow explanation
- **[TECH_STACK.md](./TECH_STACK.md)** - Technology decisions and architecture
- **[MODULES.md](./MODULES.md)** - API reference for all modules
- **[README.md](./README.md)** - Project overview

---

## 🎯 Next Steps

### After First Successful Call:
1. Test with different network conditions
2. Try calling from different browsers (Chrome ↔ Firefox)
3. Test on mobile (iOS Safari, Android Chrome)
4. Add TURN server for better NAT traversal
5. Deploy to public server for global access

### To Deploy Publicly:
1. Get SSL certificate (required for getUserMedia in production)
2. Deploy server.js to cloud (Heroku, Azure, AWS, etc.)
3. Update signaling server URL in signaling-client.js
4. Share your public URL instead of localhost

---

## 💡 Pro Tips

✨ **Share Meeting Link**
```javascript
// In browser console:
> console.log(window.roomManager.getMeetingLink('http://localhost:8080'))
```

✨ **Test Disconnect**
```javascript
// Simulate network disconnect:
F12 → Network tab → click offline button
```

✨ **Monitor ICE Candidates**
```javascript
// In browser console:
> const pc = window.peerConnectionManager.getPeerConnection(peerId)
> pc.getStats()
```

✨ **Check Media Permissions**
```javascript
// In browser console:
> await navigator.permissions.query({ name: 'camera' })
```

---

## ❓ FAQ

**Q: Can I host this online?**
A: Yes! Deploy server.js to any Node.js hosting (Azure, Heroku, etc.)

**Q: Do I need a backend database?**
A: No! Meetings are ephemeral. Users share IDs directly.

**Q: How many people can call at once?**
A: Currently 2 peer connections (1-on-1). Scale to multi-party with SFU.

**Q: What if we're behind corporate firewall?**
A: Add TURN server to networkTraversal.addTurnServer()

**Q: Is the call encrypted?**
A: Yes! DTLS-SRTP encrypts all media automatically.

---

**🎉 You're all set! Start a video call now!**

Questions? Check the console logs or review WORKFLOW.md for detailed step-by-step flow.
