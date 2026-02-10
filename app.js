// WebRTC P2P Video Call Application with WebSocket Signaling

class VideoCaller {
    constructor() {
        this.localStream = null;
        this.peerConnections = new Map(); // Multiple peer connections
        this.currentRemoteUser = null;
        this.isAudioEnabled = true;
        this.isVideoEnabled = true;
        this.roomId = null;

        // STUN/TURN servers for NAT traversal
        this.peerConfig = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
                { urls: 'stun:stun3.l.google.com:19302' },
                { urls: 'stun:stun4.l.google.com:19302' },
                { urls: 'stun:stun.stunprotocol.org:3478' },
                { urls: 'stun:stun.services.mozilla.com:3478' },
                // Public TURN servers (optional - for very restrictive networks)
                // { urls: 'turn:turnserver.example.com', username: 'user', credential: 'pass' }
            ]
        };

        this.initializeUI();
        this.connectToSignaling();
    }

    initializeUI() {
        // Room join
        document.getElementById('joinRoomBtn').addEventListener('click', () => this.joinRoom());
        document.getElementById('roomInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.joinRoom();
        });

        // Controls
        document.getElementById('toggleAudioBtn').addEventListener('click', () => this.toggleAudio());
        document.getElementById('toggleVideoBtn').addEventListener('click', () => this.toggleVideo());
        document.getElementById('endCallBtn').addEventListener('click', () => this.endCall());
    }

    async connectToSignaling() {
        try {
            await window.signalingClient.connect();
            this.updateStatus('Connected to signaling server', 'success');

            // Setup signaling callbacks
            window.signalingClient.on('UserJoined', (userId, roomUsers) => this.onUserJoined(userId, roomUsers));
            window.signalingClient.on('UserDisconnected', (userId) => this.onUserDisconnected(userId));
            window.signalingClient.on('Offer', (userId, offer) => this.onOffer(userId, offer));
            window.signalingClient.on('Answer', (userId, answer) => this.onAnswer(userId, answer));
            window.signalingClient.on('IceCandidate', (userId, candidate) => this.onIceCandidate(userId, candidate));
            window.signalingClient.on('Error', (error) => this.onSignalingError(error));
        } catch (error) {
            this.updateStatus(`Signaling error: ${error.message}`, 'error');
            console.error('Signaling connection error:', error);
        }
    }

    async joinRoom() {
        const roomInput = document.getElementById('roomInput').value.trim();
        if (!roomInput) {
            this.updateStatus('Please enter a room ID', 'error');
            return;
        }

        this.roomId = roomInput;

        try {
            this.updateStatus('Requesting camera and microphone access...', 'info');

            const constraints = {
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
            };

            this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
            document.getElementById('localVideo').srcObject = this.localStream;

            // Join room via signaling
            window.signalingClient.joinRoom(roomInput);

            // Hide room setup, show video section
            document.getElementById('roomSetup').style.display = 'none';
            document.getElementById('videoSection').style.display = 'block';
            document.getElementById('controlSection').style.display = 'block';

            this.updateStatus(`Joined room: ${roomInput}`, 'success');

        } catch (error) {
            this.updateStatus(`Error accessing media: ${error.message}`, 'error');
            console.error('Media access error:', error);
        }
    }

    onUserJoined(userId, roomUsers) {
        console.log('User joined:', userId);
        this.updateUsersList(roomUsers);
        this.updateStatus(`User joined: ${userId}`, 'info');

        // Automatically initiate call with first user
        if (!this.currentRemoteUser) {
            this.initiateCall(userId);
        }
    }

    onUserDisconnected(userId) {
        console.log('User disconnected:', userId);
        if (this.currentRemoteUser === userId) {
            this.endCallWithUser(userId);
        }
        this.updateUsersList([]);
        this.updateStatus('User disconnected', 'info');
    }

    async initiateCall(remoteUserId) {
        this.currentRemoteUser = remoteUserId;
        this.updateStatus(`Calling ${remoteUserId}...`, 'info');

        try {
            const peerConnection = this.createPeerConnection(remoteUserId);
            this.peerConnections.set(remoteUserId, peerConnection);

            // Add local tracks
            this.localStream.getTracks().forEach(track => {
                peerConnection.addTrack(track, this.localStream);
            });

            // Create and send offer
            const offer = await peerConnection.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
            });

            await peerConnection.setLocalDescription(offer);
            window.signalingClient.sendOffer(offer);

            this.updateStatus('Offer sent, waiting for answer...', 'info');

        } catch (error) {
            this.updateStatus(`Error initiating call: ${error.message}`, 'error');
            console.error('Call initiation error:', error);
        }
    }

    async onOffer(remoteUserId, offer) {
        console.log('Received offer from:', remoteUserId);
        this.currentRemoteUser = remoteUserId;

        try {
            if (!this.peerConnections.has(remoteUserId)) {
                const peerConnection = this.createPeerConnection(remoteUserId);
                this.peerConnections.set(remoteUserId, peerConnection);

                // Add local tracks
                this.localStream.getTracks().forEach(track => {
                    peerConnection.addTrack(track, this.localStream);
                });
            }

            const peerConnection = this.peerConnections.get(remoteUserId);
            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

            // Create answer
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            // Send answer
            window.signalingClient.sendAnswer(answer);

            this.updateStatus('Answer sent', 'success');

        } catch (error) {
            this.updateStatus(`Error handling offer: ${error.message}`, 'error');
            console.error('Offer handling error:', error);
        }
    }

    async onAnswer(remoteUserId, answer) {
        console.log('Received answer from:', remoteUserId);

        try {
            const peerConnection = this.peerConnections.get(remoteUserId);
            if (peerConnection) {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
                this.updateStatus('Connected!', 'success');
            }
        } catch (error) {
            this.updateStatus(`Error handling answer: ${error.message}`, 'error');
            console.error('Answer handling error:', error);
        }
    }

    async onIceCandidate(remoteUserId, candidate) {
        try {
            const peerConnection = this.peerConnections.get(remoteUserId);
            if (peerConnection && candidate) {
                await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            }
        } catch (error) {
            console.error('Error adding ICE candidate:', error);
        }
    }

    createPeerConnection(remoteUserId) {
        const peerConnection = new RTCPeerConnection(this.peerConfig);

        // Handle remote stream
        peerConnection.ontrack = (event) => {
            console.log('Received remote track:', event.track.kind);
            const remoteVideo = document.getElementById('remoteVideo');
            if (remoteVideo.srcObject !== event.streams[0]) {
                remoteVideo.srcObject = event.streams[0];
            }
        };

        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                window.signalingClient.sendIceCandidate(event.candidate);
            } else {
                console.log('All ICE candidates gathered');
            }
        };

        // Connection state changes
        peerConnection.onconnectionstatechange = () => {
            console.log('Connection state:', peerConnection.connectionState);
            this.updateConnectionStatus(peerConnection);
        };

        peerConnection.oniceconnectionstatechange = () => {
            console.log('ICE connection state:', peerConnection.iceConnectionState);
            this.updateIceState(peerConnection);
        };

        return peerConnection;
    }

    toggleAudio() {
        if (this.localStream) {
            this.isAudioEnabled = !this.isAudioEnabled;
            this.localStream.getAudioTracks().forEach(track => {
                track.enabled = this.isAudioEnabled;
            });
            document.getElementById('toggleAudioBtn').textContent = 
                `🔊 Audio ${this.isAudioEnabled ? 'ON' : 'OFF'}`;
            document.getElementById('toggleAudioBtn').style.background = 
                this.isAudioEnabled ? '#8b5cf6' : '#ef4444';
        }
    }

    toggleVideo() {
        if (this.localStream) {
            this.isVideoEnabled = !this.isVideoEnabled;
            this.localStream.getVideoTracks().forEach(track => {
                track.enabled = this.isVideoEnabled;
            });
            document.getElementById('toggleVideoBtn').textContent = 
                `📹 Video ${this.isVideoEnabled ? 'ON' : 'OFF'}`;
            document.getElementById('toggleVideoBtn').style.background = 
                this.isVideoEnabled ? '#8b5cf6' : '#ef4444';
        }
    }

    endCall() {
        if (this.currentRemoteUser) {
            this.endCallWithUser(this.currentRemoteUser);
        }
    }

    endCallWithUser(userId) {
        const peerConnection = this.peerConnections.get(userId);
        if (peerConnection) {
            peerConnection.close();
            this.peerConnections.delete(userId);
        }

        document.getElementById('remoteVideo').srcObject = null;
        this.currentRemoteUser = null;
        this.updateStatus('Call ended', 'info');
    }

    updateUsersList(users) {
        const usersList = document.getElementById('usersList');
        
        if (!users || users.length === 0) {
            usersList.innerHTML = '<p>Waiting for other users...</p>';
            return;
        }

        let html = '';
        users.forEach(userId => {
            html += `
                <div class="user-item">
                    <strong>${userId}</strong>
                    <button class="btn btn-sm btn-primary" onclick="window.videoCaller.initiateCall('${userId}')">Call</button>
                </div>
            `;
        });

        usersList.innerHTML = html;
    }

    updateStatus(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
        const statusEl = document.getElementById('status');
        statusEl.textContent = message;
        statusEl.style.color = type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#0ea5e9';
    }

    updateConnectionStatus(peerConnection) {
        const state = peerConnection?.connectionState || 'disconnected';
        document.getElementById('connType').textContent = state;
        document.getElementById('remoteUser').textContent = this.currentRemoteUser || 'None';

        if (state === 'connected') {
            this.updateStatus('Connected! Call active.', 'success');
        } else if (state === 'connecting') {
            this.updateStatus('Connecting...', 'info');
        } else if (state === 'failed') {
            this.updateStatus('Connection failed. Check network.', 'error');
        }
    }

    updateIceState(peerConnection) {
        const state = peerConnection?.iceConnectionState || 'new';
        document.getElementById('iceState').textContent = state;
    }

    onSignalingError(error) {
        this.updateStatus(`Signaling error: ${error}`, 'error');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.videoCaller = new VideoCaller();
    console.log('✅ Video Call App Initialized');
});
