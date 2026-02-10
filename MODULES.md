# 📦 Module Documentation

Complete reference for all application modules.

---

## 1️⃣ UI Manager (`modules/ui.js`)

**Purpose:** Manages the user interface and user interactions.

### Key Properties
```javascript
uiManager.state          // 'home' or 'call'
uiManager.localVideo     // <video> element for local stream
uiManager.remoteVideo    // <video> element for remote stream
```

### Main Methods

#### Screen Management
```javascript
// Show home screen with Create/Join options
uiManager.showHomeScreen()

// Show video call screen
uiManager.showCallScreen()
```

#### Stream Management
```javascript
// Attach local media stream to video element
uiManager.attachLocalStream(stream)

// Attach remote media stream to video element
uiManager.attachRemoteStream(stream)

// Clear remote stream
uiManager.clearRemoteStream()
```

#### Status Updates
```javascript
// Show status message (type: 'info', 'success', 'error')
uiManager.showStatus(message, type)

// Update connection status
uiManager.updateConnectionStatus(state)

// Update ICE connection state
uiManager.updateIceState(state)

// Update remote user display
uiManager.updateRemoteUser(userId)

// Update users list in room
uiManager.updateUsersList(users)
```

#### Control Updates
```javascript
// Set audio button state
uiManager.setAudioState(enabled)  // true/false

// Set video button state
uiManager.setVideoState(enabled)  // true/false

// Enable/disable end call button
uiManager.setEndCallEnabled(enabled)
```

### Events
```javascript
uiManager.on('joinRoom', callback)
uiManager.on('endCall', callback)
uiManager.on('toggleAudio', callback)
uiManager.on('toggleVideo', callback)
uiManager.on('callUser', callback)
```

---

## 2️⃣ Room Manager (`modules/roomManager.js`)

**Purpose:** Manages meeting rooms and user membership.

### Key Properties
```javascript
roomManager.currentRoomId    // Current meeting ID
roomManager.users            // Set of user IDs in room
```

### Main Methods

#### Meeting Management
```javascript
// Generate random 12-character meeting ID (XXXX-XXXX-XXXX)
const meetingId = roomManager.generateMeetingId()

// Join a room/meeting
roomManager.joinRoom(meetingId)

// Leave current room
roomManager.leaveRoom()

// Get current room ID
const id = roomManager.getRoomId()

// Get meeting link for sharing
const link = roomManager.getMeetingLink('http://localhost:8080')
```

#### User Management
```javascript
// Add user to room
roomManager.addUser(userId)

// Remove user from room
roomManager.removeUser(userId)

// Get all users
const users = roomManager.getUsers()

// Get user count
const count = roomManager.getUserCount()

// Check if user exists
const exists = roomManager.hasUser(userId)
```

### Events
```javascript
roomManager.on('userJoined', (userId, users) => {})
roomManager.on('userLeft', (userId, users) => {})
roomManager.on('roomJoined', (roomId) => {})
roomManager.on('roomLeft', (roomId) => {})
```

---

## 3️⃣ Media Capture (`modules/mediaCapture.js`)

**Purpose:** Manages camera and microphone access.

### Key Properties
```javascript
mediaCapture.localStream      // MediaStream object
mediaCapture.isAudioEnabled   // Boolean
mediaCapture.isVideoEnabled   // Boolean
```

### Main Methods

#### Stream Control
```javascript
// Request and start media stream (with constraints)
const stream = await mediaCapture.startStream()

// Stop media stream
mediaCapture.stopStream()

// Get current stream
const stream = mediaCapture.getStream()
```

#### Audio/Video Toggle
```javascript
// Toggle audio on/off
const enabled = mediaCapture.toggleAudio()

// Toggle video on/off
const enabled = mediaCapture.toggleVideo()

// Set audio state
mediaCapture.setAudioEnabled(true)

// Set video state
mediaCapture.setVideoEnabled(false)

// Check if audio is enabled
const isOn = mediaCapture.isAudioOn()

// Check if video is enabled
const isOn = mediaCapture.isVideoOn()
```

#### Track Access
```javascript
// Get audio tracks
const tracks = mediaCapture.getAudioTracks()

// Get video tracks
const tracks = mediaCapture.getVideoTracks()
```

#### Permissions
```javascript
// Check device permissions
const permissions = await mediaCapture.checkPermissions()
// Returns: { camera: 'granted'|'denied'|'prompt', microphone: '...' }
```

### Events
```javascript
mediaCapture.on('streamReady', (stream) => {})
mediaCapture.on('streamStopped', () => {})
mediaCapture.on('error', (errorMessage) => {})
```

### Default Constraints
```javascript
{
    video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user'
    },
    audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
    }
}
```

---

## 4️⃣ Peer Connection Manager (`modules/peerConnection.js`)

**Purpose:** Manages WebRTC peer-to-peer connections.

### Key Properties
```javascript
peerConnectionManager.peerConnections    // Map of connections
peerConnectionManager.config              // ICE server config
```

### Main Methods

#### Connection Management
```javascript
// Create peer connection for a user
const pc = peerConnectionManager.createPeerConnection(peerId)

// Get peer connection
const pc = peerConnectionManager.getPeerConnection(peerId)

// Close peer connection
peerConnectionManager.closePeerConnection(peerId)

// Close all connections
peerConnectionManager.closeAllConnections()

// Check if connection exists
const exists = peerConnectionManager.hasConnection(peerId)

// Get all peer IDs
const peers = peerConnectionManager.getPeerIds()
```

#### Media Management
```javascript
// Add local stream to peer
peerConnectionManager.addLocalStream(peerId, stream)
```

#### SDP Negotiation
```javascript
// Create SDP offer
const offer = await peerConnectionManager.createOffer(peerId)

// Create SDP answer
const answer = await peerConnectionManager.createAnswer(peerId)

// Set remote description (offer or answer)
await peerConnectionManager.setRemoteDescription(peerId, description)

// Add ICE candidate
await peerConnectionManager.addIceCandidate(peerId, candidate)
```

#### Status
```javascript
// Get connection state
const state = peerConnectionManager.getConnectionState(peerId)
// Returns: 'new', 'connecting', 'connected', 'disconnected', 'failed', 'closed'

// Get ICE connection state
const state = peerConnectionManager.getIceConnectionState(peerId)
// Returns: 'new', 'checking', 'connected', 'completed', 'failed', 'disconnected', 'closed'
```

### Events
```javascript
peerConnectionManager.on('remoteStream', (peerId, stream) => {})
peerConnectionManager.on('connectionStateChange', (peerId, state) => {})
peerConnectionManager.on('iceStateChange', (peerId, state) => {})
peerConnectionManager.on('iceCandidate', (peerId, candidate) => {})
peerConnectionManager.on('error', (peerId, error) => {})
```

### Default ICE Servers
```javascript
{
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        { urls: 'stun:stun.stunprotocol.org:3478' },
        { urls: 'stun:stun.services.mozilla.com:3478' }
    ]
}
```

---

## 5️⃣ Network Traversal (`modules/networkTraversal.js`)

**Purpose:** Handles NAT/firewall traversal and network diagnostics.

### Key Properties
```javascript
networkTraversal.publicIp       // Discovered public IP
networkTraversal.localIps       // Set of local IP addresses
networkTraversal.networkType    // Network type ('4g', '3g', '2g', etc)
networkTraversal.stunServers    // Array of STUN server URLs
networkTraversal.turnServers    // Array of TURN server configs
```

### Main Methods

#### IP Discovery
```javascript
// Discover public IP via STUN
const publicIp = await networkTraversal.discoverPublicIp()

// Get local IP addresses
const ips = await networkTraversal.getLocalIps()

// Check if IP is public
const isPublic = networkTraversal.isPublicIp('203.0.113.42')
```

#### Network Detection
```javascript
// Detect network type
const type = await networkTraversal.detectNetworkType()
// Returns: '4g', '3g', '2g', 'slow-2g', 'unknown'

// Get network quality estimate
const quality = networkTraversal.getNetworkQuality()
// Returns: { level: 'excellent'|'good'|'poor', bitrate: number }
```

#### Connectivity
```javascript
// Check internet connectivity
const isOnline = await networkTraversal.checkConnectivity()

// Get full diagnostics
const diag = await networkTraversal.getDiagnostics()
// Returns: {
//   onLine: boolean,
//   publicIp: string,
//   localIps: array,
//   networkType: string,
//   isConnected: boolean,
//   timestamp: ISO string
// }
```

#### Server Configuration
```javascript
// Get ICE servers config
const config = networkTraversal.getIceServers()

// Add TURN server
networkTraversal.addTurnServer(urls, username, credential)

// Get all STUN servers
const stun = networkTraversal.getStunServers()

// Get all TURN servers
const turn = networkTraversal.getTurnServers()
```

### Events
```javascript
networkTraversal.on('networkDetected', (type) => {})
networkTraversal.on('ipDiscovered', (ip) => {})
networkTraversal.on('connectivityCheck', (isOnline) => {})
networkTraversal.on('error', (context, error) => {})
```

---

## 6️⃣ Signaling Client (`signaling-client.js`)

**Purpose:** Manages WebSocket signaling with server.

### Key Properties
```javascript
signalingClient.ws              // WebSocket connection
signalingClient.clientId        // Unique client identifier
signalingClient.roomId          // Current room ID
```

### Main Methods

#### Connection
```javascript
// Connect to signaling server
await signalingClient.connect(url)

// Close connection
signalingClient.close()
```

#### Room Management
```javascript
// Join a room
signalingClient.joinRoom(roomId)

// Get current room ID
const id = signalingClient.roomId
```

#### Signaling
```javascript
// Send SDP offer
signalingClient.sendOffer(offer)

// Send SDP answer
signalingClient.sendAnswer(answer)

// Send ICE candidate
signalingClient.sendIceCandidate(candidate)

// Get users in room
signalingClient.getUsers()
```

### Events
```javascript
signalingClient.on('Connected', () => {})
signalingClient.on('UserJoined', (userId, roomUsers) => {})
signalingClient.on('UserDisconnected', (userId) => {})
signalingClient.on('Offer', (userId, offer) => {})
signalingClient.on('Answer', (userId, answer) => {})
signalingClient.on('IceCandidate', (userId, candidate) => {})
signalingClient.on('Error', (error) => {})
```

---

## 7️⃣ Main App (`main.js`)

**Purpose:** Orchestrates all modules and implements the complete workflow.

### Key Properties
```javascript
app.currentState           // 'home', 'waiting', 'calling'
app.localStream           // Current local MediaStream
app.currentRemoteUser     // Remote peer's user ID
app.isCallActive          // Boolean
```

### Main Workflows

#### Step 1: Create Meeting
```javascript
app.createMeeting()
  // Generates ID, shows link, requests media
```

#### Step 2: Join Meeting
```javascript
app.joinMeeting()
  // Validates ID, requests media
```

#### Step 3-4: Media & Network
```javascript
app.requestMediaPermissions(meetingId)
app.proceedWithMeeting(meetingId)
  // Checks network, connects to signaling
```

#### Step 5: P2P Setup
```javascript
app.initiateCall(userId)
  // Creates peer connection, sends offer
```

#### Step 6: In-Call Controls
```javascript
app.toggleAudio()      // Mute/unmute
app.toggleVideo()      // Camera on/off
```

#### Step 7: Cleanup
```javascript
app.endCall()
  // Closes connections, cleans up
```

---

## Module Dependencies

```
main.js (Orchestrator)
├── ui.js
├── roomManager.js
├── mediaCapture.js
├── peerConnection.js
├── networkTraversal.js
└── signaling-client.js
    └── server.js (WebSocket backend)
```

---

## Global Access

All modules are available globally:

```javascript
// In browser console
window.uiManager
window.roomManager
window.mediaCapture
window.peerConnectionManager
window.networkTraversal
window.signalingClient
window.app
```

Example:
```javascript
// In browser console
> const stream = await window.mediaCapture.startStream()
> const id = window.roomManager.generateMeetingId()
> window.uiManager.showStatus('Hello!', 'success')
```

---

## Error Handling

Each module includes error callbacks:

```javascript
mediaCapture.on('error', (error) => {
    console.error('Media error:', error)
})

peerConnectionManager.on('error', (peerId, error) => {
    console.error('Connection error:', error)
})

networkTraversal.on('error', (context, error) => {
    console.error(`${context} error:`, error)
})

signalingClient.on('Error', (error) => {
    console.error('Signaling error:', error)
})
```

---

**Total Lines of Code:** ~1500 lines
**Module Count:** 7
**State Management:** Event-driven callbacks
**Browser APIs Used:** WebRTC, WebSocket, MediaDevices, Permissions

All modules are production-ready! 🎉
