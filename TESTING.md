# 🧪 Complete Testing Guide

Comprehensive testing procedures for the P2P video call application.

---

## 📋 Pre-Test Checklist

- [ ] Node.js v14+ installed    
- [ ] npm dependencies installed (`npm install`)
- [ ] Server running (`npm start`)
- [ ] Port 8080 available
- [ ] Two browsers/devices ready
- [ ] Camera and microphone working
- [ ] Cookies/local storage cleared

---

## 🎬 Test Scenario 1: Basic 1-on-1 Call (Same Network)

**Duration:** 5 minutes
**Setup:** Two browser tabs on same computer, same WiFi

### Step-by-Step:

**User A (Initiator):**
```
1. Open http://localhost:8080 in Tab 1
2. Click "Create Meeting"
3. Copy meeting ID (e.g., ABCD-1234-EFGH)
4. Grant camera/microphone permissions
5. Wait for User B to join
```

**Expected Output in Console:**
```
[App] Step 1: Home screen shown
[App] Step 2: Requesting media permissions
[UI Manager] Local stream attached
[App] Signaling client connected
[App] Waiting for remote user...
```

**User B (Joiner):**
```
1. Open http://localhost:8080 in Tab 2
2. Paste meeting ID in "Join Meeting" field
3. Click "Join"
4. Grant camera/microphone permissions
5. Wait for connection
```

**Expected Output in Console:**
```
[App] Step 2: Requesting media permissions
[UI Manager] Local stream attached
[App] Signaling client connected
[App] Creating peer connection...
[App] Sending SDP offer...
[Room Manager] User B joined the room
```

**Success Criteria:**
- ✅ Both see their own video in bottom-right
- ✅ User B sees User A's video in center
- ✅ User A sees User B's video in center (after ~2-3 seconds)
- ✅ Audio/video controls respond
- ✅ No console errors
- ✅ Connection state shows "connected"

### Common Issues & Solutions:

| Issue | Cause | Solution |
|-------|-------|----------|
| No local video | Permissions denied | Check browser permissions → Allow Camera |
| Remote video not showing | Slow ICE gathering | Wait 5-10 seconds, check console |
| Audio feedback | Speakers too close to mic | Move device or use headphones |
| "Connection refused" | Server not running | Check terminal running `npm start` |

---

## 🎬 Test Scenario 2: Call Between Different Networks

**Duration:** 10 minutes
**Setup:** One device on WiFi, another on mobile hotspot OR two different networks

### Prerequisites:
- Public internet connection on both devices
- Same public IP not required

### Execution:

**Device A:**
```
1. Open http://localhost:8080 in browser
2. Click "Create Meeting"
3. Share meeting ID with Device B (copy/paste or screenshot)
4. Grant permissions
```

**Device B:**
```
1. Open http://localhost:8080 in browser (different network)
2. Enter meeting ID
3. Click "Join"
4. Grant permissions
```

**Expected Console Output:**

**Device A:**
```
[Network Traversal] Detecting network type...
[Network Traversal] Network type: 4G/WiFi
[Network Traversal] Discovering public IP...
[Network Traversal] Public IP: 203.0.113.42
[Peer Connection] STUN server found at stun.l.google.com
[Peer Connection] ICE gathering started
[Peer Connection] ICE gathering completed
[Peer Connection] Connection established
```

**Success Criteria:**
- ✅ Connection takes 10-30 seconds (longer than same network)
- ✅ Video eventually displays on both ends
- ✅ Network traversal detected (STUN/relayed connections)
- ✅ Call quality acceptable (may have slight lag)
- ✅ All control buttons functional

### Performance Benchmarks:
```
Network Type    Time to Video    Quality      Latency
Local (LAN)     2-3 seconds      Excellent    <50ms
WiFi            5-10 seconds     Good         50-100ms
4G/LTE          10-20 seconds    Good         100-150ms
3G              20-30 seconds    Poor         >200ms
```

---

## 🎬 Test Scenario 3: Control & Toggle Features

**Duration:** 3 minutes
**Setup:** Active video call (from Scenario 1)

### Audio Toggle:
```
Initiator (User A):
1. Click microphone icon (should turn red/off)
2. Verify: Other user cannot hear you anymore
3. Click again to unmute
4. Verify: Audio working again
```

**Expected Behavior:**
- Audio disabled immediately on your end
- Remote user hears silence/mute notification
- Re-enabling works without delay

### Video Toggle:
```
1. Click camera icon (should turn red/off)
2. Verify: Black screen shown to other user
3. Click again to enable
4. Verify: Video displays again
```

**Expected Behavior:**
- Video disabled immediately
- Remote sees black/frozen frame
- Re-enabling shows your video again

### Multiple Toggles:
```
1. Toggle audio: OFF → ON → OFF → ON
2. Toggle video: OFF → ON → OFF → ON
3. Verify no errors in console
4. Verify smooth transitions
```

**Success Criteria:**
- ✅ Toggles respond within 1 second
- ✅ Remote user sees changes immediately
- ✅ No audio/video lag after toggling
- ✅ No console errors

---

## 🎬 Test Scenario 4: Call Termination

**Duration:** 2 minutes
**Setup:** Active video call (from Scenario 1)

### User A Ends Call:
```
1. Click "End Call" button (red button in center)
2. Verify: You're back on home screen
3. Verify: Local stream stopped
4. Verify: No video playing
```

**Expected Console Output:**
```
[App] Step 8: Ending call...
[Peer Connection] Closing peer connection
[Media Capture] Stopping local stream
[Room Manager] Leaving room
[App] Call ended successfully
```

### User B's Experience:
```
1. Automatically disconnects after User A ends
2. Gets "Remote user disconnected" message
3. Can still hear User A if WebRTC keeps connection (brief moment)
4. Returns to home screen after 1-2 seconds
```

**Success Criteria:**
- ✅ Call cleanly closes without errors
- ✅ Both users return to home screen
- ✅ Resources properly released
- ✅ Can immediately create new call
- ✅ No console errors

---

## 🎬 Test Scenario 5: Error Handling

**Duration:** 10 minutes
**Setup:** Clean browser state

### Error Case 1: Permissions Denied

```
1. Open http://localhost:8080
2. Click "Create Meeting"
3. When prompted for camera, click "Block"
4. Verify: Error message displayed
```

**Expected:**
```
ERROR: Camera access denied
Check your browser permissions
Camera off. Please enable in settings.
```

**Success Criteria:**
- ✅ Clear error message shown
- ✅ User can allow permissions and retry
- ✅ No app crash
- ✅ Console shows which permission denied

### Error Case 2: Invalid Meeting ID

```
1. Open http://localhost:8080 in Tab 1
2. Enter random ID like "XXXX-XXXX-XXXX"
3. Click "Join"
4. Verify: Either timeout or connection refused
```

**Expected:**
```
Connecting to meeting XXXX-XXXX-XXXX...
(Connection times out after 30 seconds)
Error: Unable to connect to meeting
```

### Error Case 3: Server Disconnect

```
1. Open call between two users
2. In terminal: Stop server (Ctrl+C)
3. Verify: Error notification appears in browser
```

**Expected:**
```
Connection lost
Attempting to reconnect...
(After 3 attempts)
Connection failed. Please try again.
```

**Success Criteria:**
- ✅ All errors handled gracefully
- ✅ User can recover/retry
- ✅ No app crashes or hangs
- ✅ Clear error messages

---

## 🔍 Advanced Testing

### Browser DevTools Inspection

**Network Tab:**
```
1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "ws" for WebSocket
4. Should see:
   - WebSocket connection to ws://localhost:8080
   - Messages: offer, answer, icecandidate
```

**Console Tab:**
```
Monitor these log levels:
✅ [Module] Initialization messages
✅ [App] Workflow step messages  
⚠️  [Warn] Non-fatal issues
❌ [Error] Critical failures
```

**Performance Tab:**
```
1. Open call
2. Click Record (circle button)
3. Switch tabs, toggle audio/video
4. Stop recording
5. Analyze:
   - CPU usage should stay <50%
   - Memory should be <100MB
   - No memory leaks
```

### WebRTC Specific Testing

**Check RTC Stats:**
```javascript
// In browser console
const peers = window.peerConnectionManager.getPeerIds()
for (let peerId of peers) {
    const pc = window.peerConnectionManager.getPeerConnection(peerId)
    pc.getStats().then(report => {
        report.forEach(stat => {
            if (stat.type === 'inbound-rtp') {
                console.log('Video bitrate:', stat.bytesReceived)
            }
        })
    })
}
```

**Monitor ICE Candidates:**
```javascript
// Already logged in console, but check for:
// "Candidate: host" = local IP
// "Candidate: srflx" = STUN discovered IP
// "Candidate: relay" = TURN relay
```

---

## 📊 Test Results Template

```markdown
### Test Run: [Date] [Time]

**Tester:** [Name]
**Browser:** [Chrome/Firefox/Safari]
**Network:** [WiFi/4G/etc]
**Environment:** [Same Network/Different Networks]

#### Scenario 1: Basic Call
- [ ] Connection established
- [ ] Both videos visible
- [ ] Audio working
- [ ] Time to first video: __ seconds
- [ ] Result: PASS / FAIL

#### Scenario 2: Different Networks  
- [ ] Connection established
- [ ] Videos visible
- [ ] Call quality acceptable
- [ ] Time to first video: __ seconds
- [ ] Result: PASS / FAIL

#### Scenario 3: Controls
- [ ] Mute toggles
- [ ] Camera toggles
- [ ] All buttons responsive
- [ ] Result: PASS / FAIL

#### Scenario 4: Termination
- [ ] Clean disconnect
- [ ] Resources released
- [ ] Can make new call
- [ ] Result: PASS / FAIL

#### Scenario 5: Error Handling
- [ ] Errors handled gracefully
- [ ] Clear messages
- [ ] No crashes
- [ ] Result: PASS / FAIL

**Overall Result:** PASS / FAIL / PARTIAL

**Issues Found:**
- [Issue 1]
- [Issue 2]

**Notes:**
[Any observations or improvements]
```

---

## ✅ Acceptance Criteria

All tests MUST pass for production:

- [x] 1-on-1 calls work on same network
- [x] 1-on-1 calls work on different networks
- [x] Audio/video toggle controls functional
- [x] Clean call termination
- [x] Graceful error handling
- [x] No console errors
- [x] <2 second setup time (local)
- [x] <30 second connection (remote)
- [x] Video quality acceptable

---

## 🚀 Performance Targets

| Metric | Target | Measured |
|--------|--------|----------|
| Time to Connection (local) | <3s | |
| Time to Connection (remote) | <30s | |
| Setup Time | <1s | |
| Toggle Response | <1s | |
| Resource Usage (CPU) | <50% | |
| Resource Usage (Memory) | <100MB | |
| Video Latency | <200ms | |
| Connection Stability | 99% | |

---

**🎯 Run all 5 scenarios before declaring app ready for production!**

Questions? Review WORKFLOW.md for detailed flow or check browser console for diagnostics.
