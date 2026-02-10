# 🎥 Video Display Troubleshooting Guide

## If videos are not showing in the call:

### Step 1: Check Browser Console
1. Press **F12** to open DevTools
2. Click the **"Console"** tab
3. Look for these messages:

#### ✅ Expected Messages (Good):
```
✅ Media stream started
   Video: 1 track(s)
   Audio: 1 track(s)

✅ Local stream ready event fired
   Stream: [object MediaStream]
   Video tracks: 1
   Audio tracks: 1

🎥 Attaching local stream to video element...
   Stream: [object MediaStream]
   Video element: <video>
   Video tracks: 1

✅ Local stream attached (track state: live)
```

#### ❌ Error Messages (Bad):
- **"Camera/Microphone permission denied"** → Allow camera access in browser settings
- **"No camera or microphone found"** → Check if camera is connected
- **"Local video element not found!"** → HTML element issue
- **"streamReady callback"** → Not being fired

### Step 2: Check Camera Permissions
1. Settings → Search "Camera privacy settings"
2. Make sure:
   - "Camera access" is turned ON
   - Your browser has camera permission in the list

### Step 3: Check if Camera Works
1. Open **chrome://camera** (if using Chrome)
2. Or go to any website that uses your camera
3. Verify your camera actually shows video

### Step 4: Check HTML Elements
1. In DevTools, click **Elements** tab
2. Search for `<video id="localVideo"`
3. Verify it exists in the DOM

### Step 5: Test Simple Video
Open the browser console and run:
```javascript
// Check if elements exist
console.log('Local video:', document.getElementById('localVideo'));
console.log('Remote video:', document.getElementById('remoteVideo'));

// Try to get a stream manually
navigator.mediaDevices.getUserMedia({video: true, audio: false})
  .then(stream => {
    console.log('✅ Got stream:', stream);
    console.log('Video tracks:', stream.getVideoTracks());
    // Attach to local video
    document.getElementById('localVideo').srcObject = stream;
  })
  .catch(err => console.error('❌ Error:', err));
```

If this works, the browser and camera are fine. The issue is in our code.

## Common Issues & Solutions:

| Issue | Cause | Fix |
|-------|-------|-----|
| Black video box | No camera permission | Allow permissions in browser |
| Black video box | Camera already in use | Close other apps using camera |
| Black video box | No camera connected | Connect USB camera |
| No video element | HTML structure broken | Check indexhtml |
| Permission popup not showing | Wrong protocol | Use `http://localhost:8080` not `localhost:8080` |
| Video freezes | Network issue | Check connection |

## Debug Info Box

A green debug box appears on the right side of the meeting showing:
- **Local:** Stream attachment status
- **Remote:** Remote stream status  
- **Elements:** Whether video elements were found

If it says "ERROR", see above troubleshooting steps.

## Still Not Working?

1. **Take a screenshot** of the console errors
2. **Check your camera** works in other apps
3. **Try a different browser** (Chrome, Firefox, Edge)
4. **Restart the browser** completely
5. **Clear browser cache** (Ctrl+Shift+Delete)

## Quick Fixes
- ✅ Refresh the page (F5)
- ✅ Allow camera permission pop-up
- ✅ Check if camera is plugged in
- ✅ Close other apps using camera
- ✅ Restart your browser
