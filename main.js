/**
 * 🎬 Main Application Orchestrator
 * 
 * Implements the complete workflow:
 * Step 1: Home screen with Create/Join Meeting
 * Step 2: Media Permission Request
 * Step 3: Signaling (Offer/Answer/ICE)
 * Step 4: Network Traversal (STUN/TURN)
 * Step 5: P2P Connection Establishment
 * Step 6: In-Call Controls (Mute, Camera, End)
 * Step 7: Call Cleanup
 */

class VideoCallApp {
    constructor() {
        this.currentState = 'home'; // 'home', 'waiting', 'calling'
        this.localStream = null;
        this.currentRemoteUser = null;
        this.isCallActive = false;
        
        console.log('🚀 Initializing Video Call Application...');
        this.setupEventListeners();
        this.initializeDiagnostics();
    }

    // =========== STEP 1: HOME SCREEN ===========

    setupEventListeners() {
        console.log('🔌 Setting up event listeners...');
        
        // Create Meeting button
        document.getElementById('createMeetingBtn').addEventListener('click', 
            () => this.createMeeting());
        
        // Join Meeting button
        document.getElementById('joinRoomBtn').addEventListener('click', 
            () => this.joinMeeting());
        
        // UI Callbacks
        window.uiManager.on('joinRoom', (roomId) => this.joinMeeting());
        window.uiManager.on('endCall', () => this.endCall());
        window.uiManager.on('toggleAudio', () => this.toggleAudio());
        window.uiManager.on('toggleVideo', () => this.toggleVideo());
        window.uiManager.on('callUser', (userId) => this.initiateCall(userId));
        
        // Media Capture Callbacks
        window.mediaCapture.on('streamReady', (stream) => this.onStreamReady(stream));
        window.mediaCapture.on('streamStopped', () => this.onStreamStopped());
        window.mediaCapture.on('error', (error) => this.onMediaError(error));
        
        // Peer Connection Callbacks
        window.peerConnectionManager.on('remoteStream', 
            (peerId, stream) => this.onRemoteStream(peerId, stream));
        window.peerConnectionManager.on('connectionStateChange', 
            (peerId, state) => this.onConnectionStateChange(peerId, state));
        window.peerConnectionManager.on('iceStateChange', 
            (peerId, state) => this.onIceStateChange(peerId, state));
        window.peerConnectionManager.on('iceCandidate', 
            (peerId, candidate) => this.onIceCandidate(peerId, candidate));
        window.peerConnectionManager.on('error', 
            (peerId, error) => this.onPeerConnectionError(peerId, error));
        
        // Room Manager Callbacks
        window.roomManager.on('userJoined', (userId, users) => this.onUserJoined(userId, users));
        window.roomManager.on('userLeft', (userId, users) => this.onUserLeft(userId, users));
        
        // Signaling Callbacks
        window.signalingClient.on('UserJoined', 
            (userId, users) => this.onSignalingUserJoined(userId, users));
        window.signalingClient.on('UserDisconnected', 
            (userId) => this.onSignalingUserDisconnected(userId));
        window.signalingClient.on('Offer', 
            (userId, offer) => this.onSignalingOffer(userId, offer));
        window.signalingClient.on('Answer', 
            (userId, answer) => this.onSignalingAnswer(userId, answer));
        window.signalingClient.on('IceCandidate', 
            (userId, candidate) => this.onSignalingIceCandidate(userId, candidate));
    }

    /**
     * Step 1a: Create a new meeting
     */
    createMeeting() {
        console.log('📞 Creating new meeting...');
        
        // Generate unique meeting ID
        const meetingId = window.roomManager.generateMeetingId();
        console.log(`✅ Meeting ID generated: ${meetingId}`);
        
        // Show meeting link
        document.getElementById('meetingLink').style.display = 'block';
        document.getElementById('meetingCode').textContent = meetingId;
        document.getElementById('copyLinkBtn').style.display = 'inline-block';
        
        // Add copy button functionality
        document.getElementById('copyLinkBtn').addEventListener('click', () => {
            const link = window.roomManager.getMeetingLink();
            navigator.clipboard.writeText(link).then(() => {
                window.uiManager.showStatus('Meeting link copied to clipboard!', 'success');
            }).catch(() => {
                window.uiManager.showStatus('Failed to copy link', 'error');
            });
        });
        
        // Auto-join the created meeting
        this.requestMediaPermissions(meetingId);
    }

    /**
     * Step 1b: Join an existing meeting
     */
    joinMeeting() {
        const meetingId = document.getElementById('roomInput').value.trim();
        
        if (!meetingId) {
            window.uiManager.showStatus('Please enter a meeting ID or code', 'error');
            return;
        }
        
        console.log(`📍 Joining meeting: ${meetingId}`);
        this.requestMediaPermissions(meetingId);
    }

    // =========== STEP 2: MEDIA PERMISSION ===========

    /**
     * Request camera and microphone permissions
     */
    async requestMediaPermissions(meetingId) {
        console.log('📹 Requesting media permissions...');
        window.uiManager.showStatus('Requesting camera and microphone access...', 'info');
        
        try {
            // Start media capture
            console.log('   Calling mediaCapture.startStream()...');
            const stream = await window.mediaCapture.startStream();
            
            console.log(`   ✅ Stream returned: ${stream}`);
            console.log(`      Has video: ${stream?.getVideoTracks().length > 0}`);
            console.log(`      Has audio: ${stream?.getAudioTracks().length > 0}`);
            
            // Proceed to signaling
            console.log('   Proceeding with meeting setup...');
            await this.proceedWithMeeting(meetingId);
            
        } catch (error) {
            window.uiManager.showStatus(error.message, 'error');
            console.error('Media permission denied:', error);
        }
    }

    onStreamReady(stream) {
        console.log('✅ Local stream ready event fired');
        console.log(`   Stream: ${stream}`);
        console.log(`   Video tracks: ${stream?.getVideoTracks().length || 0}`);
        console.log(`   Audio tracks: ${stream?.getAudioTracks().length || 0}`);
        
        this.localStream = stream;
        
        // Attach to video element
        console.log('   Attaching stream to video element...');
        window.uiManager.attachLocalStream(stream);
        window.uiManager.showStatus('✅ Camera and microphone ready', 'success');
        
        console.log('✅ onStreamReady completed');
    }

    onStreamStopped() {
        console.log('⏹️ Local stream stopped');
        this.localStream = null;
        window.uiManager.clearRemoteStream();
    }

    onMediaError(error) {
        let errorMessage = error;
        
        // Provide better error messages for common scenarios
        if (error.includes('Permission denied') || error.includes('NotAllowedError')) {
            errorMessage = 'Camera/microphone access denied. Please allow access in browser settings.';
        } else if (error.includes('Could not start video source') || error.includes('NotReadableError')) {
            errorMessage = 'Camera is already in use. Please close other tabs/apps using the camera.';
        } else if (error.includes('NotFoundError')) {
            errorMessage = 'No camera or microphone found. Please connect a device.';
        }
        
        window.uiManager.showStatus(errorMessage, 'error');
        console.error('Media error:', error);
    }

    // =========== STEP 3 & 4: SIGNALING & NETWORK TRAVERSAL ===========

    /**
     * Proceed with meeting after media is ready
     */
    async proceedWithMeeting(meetingId) {
        console.log('🌐 Proceeding with meeting setup...');
        window.uiManager.showStatus('Setting up meeting (this may take 10-15 seconds)...', 'info');
        
        try {
            // Add overall timeout of 30 seconds
            const setupPromise = this._setupMeeting(meetingId);
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Meeting setup timeout after 30 seconds')), 30000)
            );
            
            await Promise.race([setupPromise, timeoutPromise]);
            
        } catch (error) {
            window.uiManager.showStatus(`Setup failed: ${error.message}`, 'error');
            console.error('Meeting setup error:', error);
            window.uiManager.showHomeScreen();
        }
    }

    /**
     * Internal setup method with detailed logging
     */
    async _setupMeeting(meetingId) {
        console.log('📋 Step 1: Checking network connectivity...');
        const isOnline = await window.networkTraversal.checkConnectivity();
        
        if (!isOnline) {
            throw new Error('No internet connection detected');
        }
        console.log('✅ Step 1 complete: Online');
        
        // Step 4b: Detect network type
        console.log('📋 Step 2: Detecting network type...');
        const networkType = await window.networkTraversal.detectNetworkType();
        console.log(`✅ Step 2 complete: ${networkType}`);
        
        // Step 4c: Discover IP (STUN) - but don't fail if timeout
        console.log('📋 Step 3: Discovering public IP via STUN...');
        try {
            const publicIp = await window.networkTraversal.discoverPublicIp();
            console.log(`✅ Step 3 complete: ${publicIp || '(local network)'}`);
        } catch (error) {
            console.warn(`⚠️ Step 3 skipped (non-blocking): ${error.message}`);
        }
        
        // Step 4: Initialize signaling
        console.log('📋 Step 4: Connecting to signaling server...');
        await window.signalingClient.connect();
        console.log('✅ Step 4 complete: Connected');
        
        // Step 5: Join room
        console.log('📋 Step 5: Joining room...');
        window.roomManager.joinRoom(meetingId);
        window.signalingClient.joinRoom(meetingId);
        console.log('✅ Step 5 complete: Room join initiated');
        
        // Step 6: Show call screen
        console.log('📋 Step 6: Preparing call interface...');
        window.uiManager.showCallScreen();
        window.uiManager.showStatus(`Joined meeting: ${meetingId}. Waiting for other users...`, 'info');
        window.uiManager.setEndCallEnabled(true);
        console.log('✅ Step 6 complete: UI ready');
        
        this.currentState = 'waiting';
        console.log('🎉 Meeting setup COMPLETE');
    }

    // =========== STEP 5: P2P CONNECTION ===========

    /**
     * When another user joins the room
     */
    onSignalingUserJoined(userId, roomUsers) {
        console.log(`👤 User joined: ${userId}`);
        window.roomManager.addUser(userId);
        window.uiManager.updateUsersList(roomUsers.filter(u => u !== window.signalingClient.clientId));
        
        // Auto-initiate call with deterministic initiator to avoid offer glare
        if (!this.currentRemoteUser && roomUsers.length > 1) {
            const localId = window.signalingClient.clientId;
            
            // Only proceed if we have our client ID
            if (!localId) {
                console.warn('⚠️ Client ID not yet assigned, deferring call initiation');
                return;
            }
            
            const shouldInitiate = localId < userId;
            console.log(`🔄 Auto-initiator check (local: ${localId}, remote: ${userId}) => ${shouldInitiate}`);
            if (shouldInitiate) {
                this.initiateCall(userId);
            }
        }
    }

    /**
     * Initiate a call with a specific user
     */
    async initiateCall(userId) {
        console.log(`📞 Initiating call with ${userId}`);
        this.currentRemoteUser = userId;
        window.uiManager.updateRemoteUser(userId);
        window.uiManager.showStatus(`Calling ${userId}...`, 'info');
        
        try {
            // Step 5a: Create peer connection
            const pc = window.peerConnectionManager.createPeerConnection(userId);
            
            // Step 5b: Add local stream
            window.peerConnectionManager.addLocalStream(userId, this.localStream);
            
            // Step 5c: Create and send offer
            const offer = await window.peerConnectionManager.createOffer(userId);
            console.log(`📤 Sending offer to ${userId}`);
            window.signalingClient.sendOffer(userId, offer);
            
            window.uiManager.showStatus('Offer sent, waiting for answer...', 'info');
            this.currentState = 'calling';
            
        } catch (error) {
            window.uiManager.showStatus(`Call initiation failed: ${error.message}`, 'error');
            console.error('Call initiation error:', error);
        }
    }

    /**
     * Handle incoming offer from remote user
     */
    async onSignalingOffer(userId, offer) {
        console.log(`📥 Received offer from ${userId}`);
        this.currentRemoteUser = userId;
        window.uiManager.updateRemoteUser(userId);
        
        try {
            // Create peer connection if not exists
            if (!window.peerConnectionManager.hasConnection(userId)) {
                const pc = window.peerConnectionManager.createPeerConnection(userId);
                window.peerConnectionManager.addLocalStream(userId, this.localStream);
            }
            
            // Set remote description
            await window.peerConnectionManager.setRemoteDescription(userId, offer);
            
            // Create and send answer
            const answer = await window.peerConnectionManager.createAnswer(userId);
            console.log(`📤 Sending answer to ${userId}`);
            window.signalingClient.sendAnswer(userId, answer);
            
            window.uiManager.showStatus('Answer sent', 'info');
            
        } catch (error) {
            window.uiManager.showStatus(`Offer handling failed: ${error.message}`, 'error');
            console.error('Offer handling error:', error);
        }
    }

    /**
     * Handle incoming answer from remote user
     */
    async onSignalingAnswer(userId, answer) {
        console.log(`📥 Received answer from ${userId}`);
        
        try {
            await window.peerConnectionManager.setRemoteDescription(userId, answer);
            window.uiManager.showStatus('Answer received. Establishing connection...', 'info');
            
        } catch (error) {
            window.uiManager.showStatus(`Answer handling failed: ${error.message}`, 'error');
            console.error('Answer handling error:', error);
        }
    }

    /**
     * Handle ICE candidates
     */
    async onSignalingIceCandidate(userId, candidate) {
        if (!userId || !candidate) return;
        try {
            await window.peerConnectionManager.addIceCandidate(userId, candidate);
        } catch (error) {
            console.warn('ICE candidate error:', error.message);
        }
    }

    onIceCandidate(userId, candidate) {
        console.log(`❄️ Sending ICE candidate to ${userId}`);
        window.signalingClient.sendIceCandidate(userId, candidate);
    }

    /**
     * Handle remote stream received
     */
    onRemoteStream(userId, stream) {
        console.log(`📹 ===== REMOTE STREAM RECEIVED =====`);
        console.log(`   From user: ${userId}`);
        console.log(`   Stream: ${stream}`);
        console.log(`   Stream ID: ${stream?.id}`);
        console.log(`   Audio tracks: ${stream?.getAudioTracks().length || 0}`);
        console.log(`   Video tracks: ${stream?.getVideoTracks().length || 0}`);
        
        if (stream?.getVideoTracks().length > 0) {
            const videoTrack = stream.getVideoTracks()[0];
            console.log(`   Video track state: ${videoTrack.readyState}`);
            console.log(`   Video track enabled: ${videoTrack.enabled}`);
        }
        
        console.log(`   Attaching to UI...`);
        window.uiManager.attachRemoteStream(stream);
        window.uiManager.showStatus(`Connected with ${userId}`, 'success');
        console.log(`✅ Remote stream handler complete`);
    }

    /**
     * Handle connection state changes
     */
    onConnectionStateChange(userId, state) {
        console.log(`🔗 Connection state: ${state}`);
        window.uiManager.updateConnectionStatus(state);
        
        if (state === 'connected') {
            this.currentState = 'calling';
            window.uiManager.showStatus('✅ Call Connected!', 'success');
            this.isCallActive = true;
        } else if (state === 'failed') {
            window.uiManager.showStatus('Connection failed. Please try refreshing the page.', 'error');
            // Don't auto-cleanup - let user decide
            console.warn('⚠️ Connection failed but staying in call screen');
        } else if (state === 'closed') {
            // Only cleanup if the user explicitly ended the call
            if (this.isCallActive) {
                window.uiManager.showStatus('Call ended', 'info');
                this.cleanup();
            }
        } else if (state === 'disconnected') {
            window.uiManager.showStatus('Connection lost. Reconnecting...', 'warning');
        }
    }

    /**
     * Handle ICE connection state changes
     */
    onIceStateChange(userId, state) {
        console.log(`❄️ ICE state: ${state}`);
        window.uiManager.updateIceState(state);
    }

    onPeerConnectionError(userId, error) {
        window.uiManager.showStatus(`Connection error: ${error.message}`, 'error');
        console.error('Peer connection error:', error);
    }

    /**
     * When user leaves room
     */
    onSignalingUserDisconnected(userId) {
        console.log(`👤 User disconnected: ${userId}`);
        
        if (this.currentRemoteUser === userId) {
            window.uiManager.showStatus(`${userId} left the call`, 'info');
            window.uiManager.clearRemoteStream();
            window.peerConnectionManager.closePeerConnection(userId);
            this.currentRemoteUser = null;
        }
        
        window.roomManager.removeUser(userId);
    }

    onUserJoined(userId, users) {
        window.uiManager.updateUsersList(users.filter(u => u !== window.signalingClient.clientId));
    }

    onUserLeft(userId, users) {
        window.uiManager.updateUsersList(users.filter(u => u !== window.signalingClient.clientId));
    }

    // =========== STEP 6: IN-CALL CONTROLS ===========

    toggleAudio() {
        const isEnabled = window.mediaCapture.toggleAudio();
        window.uiManager.setAudioState(isEnabled);
    }

    toggleVideo() {
        const isEnabled = window.mediaCapture.toggleVideo();
        window.uiManager.setVideoState(isEnabled);
    }

    // =========== STEP 7: CALL CLEANUP ===========

    /**
     * End the call
     */
    endCall() {
        console.log('📞 Ending call...');
        window.uiManager.showStatus('Ending call...', 'info');
        this.cleanup();
    }

    /**
     * Cleanup function
     */
    cleanup() {
        console.log('🧹 Cleaning up...');
        
        // Close all peer connections
        window.peerConnectionManager.closeAllConnections();
        this.currentRemoteUser = null;
        this.isCallActive = false;
        
        // Stop media stream
        window.mediaCapture.stopStream();
        
        // Leave room
        window.roomManager.leaveRoom();
        window.signalingClient.close();
        
        // Reset UI
        window.uiManager.showHomeScreen();
        document.getElementById('roomInput').value = '';
        
        this.currentState = 'home';
        window.uiManager.showStatus('You have left the meeting', 'info');
    }

    // =========== DIAGNOSTICS ===========

    async initializeDiagnostics() {
        console.log('🔧 Running initial diagnostics...');
        
        try {
            const diagnostics = await window.networkTraversal.getDiagnostics();
            console.log('📊 Diagnostics Results:', diagnostics);
            
            // Log to console for debugging (handle if diagnostics is null)
            if (diagnostics) {
                if (diagnostics.publicIp) {
                    console.log(`✅ Public IP: ${diagnostics.publicIp}`);
                } else {
                    console.log(`✅ No public IP (may be on local network) - this is normal`);
                }
                
                if (diagnostics.localIps && diagnostics.localIps.length > 0) {
                    console.log(`✅ Local IPs: ${diagnostics.localIps.join(', ')}`);
                }
                
                console.log(`✅ Network: ${diagnostics.networkType}`);
                console.log(`✅ Online: ${diagnostics.isConnected}`);
            }
            
        } catch (error) {
            console.warn('⚠️ Diagnostics failed:', error.message);
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('📱 DOM Content Loaded');
    window.app = new VideoCallApp();
    console.log('✅ Application Ready!');
    console.log('🎬 Workflow: Home → Create/Join → Media Permission → Signaling → P2P → Controls → Cleanup');
});
