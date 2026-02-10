# 🎥 P2P Video Call Web App

A peer-to-peer video calling application built with **WebRTC** and **WebSocket Signaling**. No backend database required!

## Features

✅ **WebSocket Signaling Server** - Automatic offer/answer exchange  
✅ **Room-Based Architecture** - Multiple rooms with user management  
✅ **STUN Server Integration** - Works across different networks  
✅ **Audio & Video Controls** - Toggle mic and camera on/off  
✅ **Real-time Connection Status** - Monitor call health  
✅ **Responsive Design** - Works on desktop and mobile  
✅ **Multiple Peer Connections** - Support for future group calls  

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | HTML, CSS, JavaScript |
| Video | WebRTC (peer-to-peer) |
| Signaling | WebSocket Server (Node.js) |
| Network | STUN / TURN (for NAT traversal) |

## Required Modules

### NPM Dependencies
```json
{
  "ws": "^8.17.0"
}
```

### Core Technologies
- **WebRTC** - For peer-to-peer video/audio streaming
- **WebSocket** - For real-time signaling
- **Node.js** - Server runtime
- **HTML5** - Media elements and UI
- **CSS3** - Modern styling
- **JavaScript** - Connection management

## Installation & Setup

1. **Open terminal in the project directory:**
```bash
cd d:\videocall1
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start the server:**
```bash
npm start
```

The app will be available at `http://localhost:8080`

## Hosting Requirements

To host this app for real users (not just localhost), you need:

- **HTTPS** for the web app (required for `getUserMedia` outside localhost).
- **WSS** (secure WebSocket) for signaling in production.
- **TURN server** credentials to improve connectivity across strict NATs.
- **Open ports** for HTTP/HTTPS and your WebSocket server (default 8080).

### Recommended Production Steps

1. Set up a domain with HTTPS (e.g., Nginx + Let's Encrypt).
2. Put the WebSocket server behind the same domain with WSS.
3. Update the signaling URL in the client if needed.
4. Configure TURN credentials in the client ICE servers list.

### Environment Notes

- Browsers block camera/mic access on non-HTTPS origins (except localhost).
- Use `turns:` (TLS) for TURN when possible.
- If you use a reverse proxy, enable WebSocket upgrades.

## How to Use

### For Two Users in Same Network

**User A (Initiator):**
1. Open browser and go to `http://localhost:8080`
2. Enter a room ID (e.g., `myroom123`)
3. Click "Join Room"
4. Wait for the call to be established

**User B (Receiver - on same network):**
1. Open browser and go to `http://a-ip-address:8080` (use User A's local IP)
2. Enter the same room ID: `myroom123`
3. Click "Join Room"
4. **Automatic Connection!** ✅ Video call starts automatically

### For Two Users in Different Networks

**Same process** - The app uses STUN servers to handle NAT traversal automatically!

## Architecture

### Server-Side (Node.js)
```
┌─────────────────────────────────┐
│  WebSocket Signaling Server     │
│  - Room Management              │
│  - Offer/Answer Exchange        │
│  - ICE Candidate Routing        │
└─────────────────────────────────┘
```

### Client-Side (Browser)
```
┌────────────┐                  ┌────────────┐
│  User A    │  WebSocket       │  User B    │
│  (Chrome)  ├──────────────────┤  (Firefox) │
└────────────┘                  └────────────┘
      ↓ WebRTC P2P Connection ↓
      (Encrypted DTLS-SRTP)
```

### Connection Flow
1. **User A** joins room → Sends `join-room` via WebSocket
2. **User B** joins room → Broadcast `user-joined` to User A
3. **User A** creates offer → Sends via WebSocket
4. **User B** receives offer → Creates answer → Sends via WebSocket
5. **User A** receives answer → **P2P Connection Established!**
6. Both exchange **ICE candidates** for optimal routing
7. Media flows directly between users (encrypted)

## File Structure

```
videocall1/
├── server.js              # WebSocket signaling server
├── signaling-client.js    # WebSocket client library
├── app.js                 # WebRTC peer connection logic
├── index.html             # UI markup
├── styles.css             # Styling
├── package.json           # Dependencies
├── favicon.svg            # App icon
└── README.md              # This file
```

## How It Works

### Signaling Protocol (WebSocket Messages)

```javascript
// Join Room
{ type: 'join-room', roomId: 'myroom123' }

// User Joined (broadcast)
{ type: 'user-joined', from: 'user1', roomUsers: ['user1', 'user2'] }

// Create Offer
{ type: 'offer', offer: {type: 'offer', sdp: '...'} }

// Send Answer
{ type: 'answer', answer: {type: 'answer', sdp: '...'} }

// ICE Candidate
{ type: 'ice-candidate', candidate: {candidate: '...', ...} }

// User Disconnected
{ type: 'user-disconnected', from: 'user1' }
```

## STUN Servers Used

Public STUN servers for NAT traversal:
```
- stun:stun.l.google.com:19302
- stun:stun1.l.google.com:19302
- stun:stun2.l.google.com:19302
- stun:stun.stunprotocol.org:3478
- stun:stun.services.mozilla.com:3478
```

## Browser Support

✅ Chrome/Chromium 28+  
✅ Firefox 22+  
✅ Safari 11+  
✅ Edge 79+  

## Security Considerations

### Media Security ✅
- **DTLS-SRTP** - Automatically encrypts all media streams
- End-to-end encrypted (server never sees media)

### Signaling Security ⚠️
For production deployments:
- Use **HTTPS** instead of HTTP
- Use **WSS (WebSocket Secure)** instead of WS
- Implement **authentication** for room access
- Add **rate limiting** to prevent abuse
- Consider **TURN servers** for restrictive networks

### Current Limitations
- No room access control (anyone can join)
- Signaling data sent in plain text (for local/dev only)
- Single connection per user

## Deploying to Production

1. **Use HTTPS + WSS:**
```javascript
// Change in index.html
// From: ws://localhost:8080
// To: wss://yourdomain.com
```

2. **Add SSL Certificates:**
```javascript
const fs = require('fs');
const https = require('https');
const server = https.createServer({
    key: fs.readFileSync('private-key.pem'),
    cert: fs.readFileSync('certificate.pem')
}, app);
```

3. **Deploy to Cloud:**
   - Heroku, AWS, Azure, DigitalOcean, etc.
   - Keep port 8080 or use environment variable

## Troubleshooting

### "Connection Failed"
- Check both users are in the same room ID
- Verify network connectivity
- Check browser console (F12) for errors
- Try different STUN servers

### "No Camera/Microphone"
- Check browser permissions
- Allow access when prompted
- Restart browser
- Check if camera is in use by another app

### "Can't connect across networks"
- Ensure server is accessible from internet
- Check firewall rules
- STUN servers need outbound UDP access
- Consider adding TURN servers for restrictive networks

### "Audio/Video Stops"
- Check network stability
- Verify bandwidth
- Check browser console logs
- Try ending and restarting call

## Future Enhancements

- [ ] Add TURN server support
- [ ] Implement room authentication
- [ ] Screen sharing
- [ ] Call recording
- [ ] Group video calls (SFU/MCU)
- [ ] Chat messages
- [ ] File transfer via WebRTC DataChannel
- [ ] Call history/logging
- [ ] Bandwidth quality metrics
- [ ] Mobile app (React Native)

## Performance Optimization

- **ICE Candidate Filtering** - Reduce unnecessary candidates
- **Adaptive Bitrate** - Adjust video quality based on network
- **Connection Pooling** - Reuse WebSocket for multiple calls
- **Memory Management** - Clean up closed peer connections

## License

MIT License - Free to use and modify

## Support

For issues:
1. Check browser console (F12)
2. Verify room ID matches
3. Check network connectivity
4. Review server logs
5. Test with Chrome/Firefox for compatibility

---

**Happy video calling! 🎉**

Built with ❤️ using WebRTC

