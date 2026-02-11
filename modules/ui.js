/**
 * 🎥 User Interface Module - Professional Video Meeting
 * 
 * Manages interface similar to Google Meet
 * - Welcome screen with create/join meeting
 * - Video call with picture-in-picture layout
 * - Control buttons (mic, camera, end call)
 */

class UIManager {
    constructor() {
        this.state = 'welcome'; // 'welcome' or 'call'
        this.audioEnabled = true;
        this.videoEnabled = true;
        this.callbacks = {
            onJoinRoom: null,
            onEndCall: null,
            onToggleAudio: null,
            onToggleVideo: null,
            onCreateMeeting: null,
            onCallUser: null
        };
        
        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        // Screen elements
        this.welcomeScreen = document.getElementById('welcomeScreen');
        this.callContainer = document.getElementById('callContainer');
        
        // Welcome screen elements
        this.roomInput = document.getElementById('roomInput');
        this.joinRoomBtn = document.getElementById('joinRoomBtn');
        this.createMeetingBtn = document.getElementById('createMeetingBtn');
        this.meetingLink = document.getElementById('meetingLink');
        this.meetingCode = document.getElementById('meetingCode');
        this.copyLinkBtn = document.getElementById('copyLinkBtn');
        
        // Video elements
        this.localVideo = document.getElementById('localVideo');
        this.remoteVideo = document.getElementById('remoteVideo');
        
        // Control buttons
        this.toggleAudioBtn = document.getElementById('toggleAudioBtn');
        this.toggleVideoBtn = document.getElementById('toggleVideoBtn');
        this.endCallBtn = document.getElementById('endCallBtn');
        
        // Status elements
        this.statusEl = document.getElementById('status');
        this.connType = document.getElementById('connType');
        this.remoteUser = document.getElementById('remoteUser');
        this.iceState = document.getElementById('iceState');
        this.callDuration = document.getElementById('callDuration');
        this.participantCount = document.getElementById('participantCount');
        this.remoteIndicator = document.getElementById('remoteIndicator');
    }

    attachEventListeners() {
        // Welcome screen
        this.createMeetingBtn?.addEventListener('click', () => this.handleCreateMeeting());
        this.joinRoomBtn?.addEventListener('click', () => this.handleJoinRoom());
        this.roomInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleJoinRoom();
        });
        this.copyLinkBtn?.addEventListener('click', () => this.copyMeetingCode());

        // Call screen
        this.toggleAudioBtn?.addEventListener('click', () => this.handleToggleAudio());
        this.toggleVideoBtn?.addEventListener('click', () => this.handleToggleVideo());
        this.endCallBtn?.addEventListener('click', () => this.handleEndCall());
    }

    // ====== Event Handlers ======

    handleCreateMeeting() {
        if (this.callbacks.onCreateMeeting) {
            this.callbacks.onCreateMeeting();
        }
    }

    handleJoinRoom() {
        const roomId = this.roomInput.value.trim();
        if (!roomId) {
            this.showMessage('Please enter a meeting code', 'error');
            return;
        }

        if (this.callbacks.onJoinRoom) {
            this.callbacks.onJoinRoom(roomId);
        }
    }

    handleToggleAudio() {
        if (this.callbacks.onToggleAudio) {
            this.callbacks.onToggleAudio();
        }
    }

    handleToggleVideo() {
        if (this.callbacks.onToggleVideo) {
            this.callbacks.onToggleVideo();
        }
    }

    handleEndCall() {
        if (this.callbacks.onEndCall) {
            this.callbacks.onEndCall();
        }
    }

    copyMeetingCode() {
        const code = this.meetingCode.textContent;
        navigator.clipboard.writeText(code).then(() => {
            this.showMessage('Meeting code copied!', 'success');
            const btn = this.copyLinkBtn;
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i> Copied';
            setTimeout(() => {
                btn.innerHTML = originalHTML;
            }, 2000);
        });
    }

    // ====== State Management ======

    showWelcomeScreen() {
        this.state = 'welcome';
        this.welcomeScreen.style.display = 'flex';
        this.callContainer.style.display = 'none';
    }

    // Backward compatibility alias
    showHomeScreen() {
        this.showWelcomeScreen();
    }

    showCallScreen() {
        this.state = 'call';
        console.log('📱 Showing call screen...');
        console.log(`   Welcome screen: ${this.welcomeScreen}`);
        console.log(`   Call container: ${this.callContainer}`);
        console.log(`   Local video element: ${this.localVideo}`);
        console.log(`   Remote video element: ${this.remoteVideo}`);
        
        this.welcomeScreen.style.display = 'none';
        this.callContainer.style.display = 'flex';
        
        console.log('✅ Call screen displayed');
        
        // Update debug info
        const debugEl = document.getElementById('debugVideoElements');
        if (debugEl) {
            debugEl.innerHTML = `Local: ${this.localVideo ? '✓' : '✗'} Remote: ${this.remoteVideo ? '✓' : '✗'}`;
        }
    }

    // ====== Video Management ======

    attachLocalStream(stream) {
        console.log('🎥 Attaching local stream to video element...');
        console.log(`   Stream: ${stream}`);
        console.log(`   Video element: ${this.localVideo}`);
        console.log(`   Video tracks: ${stream?.getVideoTracks().length || 0}`);
        
        if (!this.localVideo) {
            console.error('❌ Local video element not found!');
            this.updateDebugInfo('Local: ERROR - video element not found');
            return;
        }
        
        const hasVideo = stream?.getVideoTracks().length > 0;
        
        if (hasVideo) {
            this.localVideo.srcObject = stream;
            this.localVideo.style.display = 'block';
            const localPlayPromise = this.localVideo.play();
            if (localPlayPromise && typeof localPlayPromise.catch === 'function') {
                localPlayPromise.catch(error => {
                    console.warn('⚠️ Local video autoplay blocked:', error.message);
                });
            }
        } else {
            // Audio-only mode - show placeholder
            this.localVideo.style.display = 'none';
            const localContainer = this.localVideo.parentElement;
            if (localContainer && !localContainer.querySelector('.audio-only-indicator')) {
                const indicator = document.createElement('div');
                indicator.className = 'audio-only-indicator';
                indicator.innerHTML = '<i class="fas fa-microphone"></i><br>Audio Only';
                indicator.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:white;text-align:center;font-size:14px;';
                localContainer.appendChild(indicator);
            }
        }
        
        const videoTrack = hasVideo ? stream.getVideoTracks()[0]  : null;
        const trackState = videoTrack?.readyState || 'none';
        
        console.log(`✅ Local stream attached (track state: ${trackState})`);
        this.updateDebugInfo(`Local: ✓ (${stream?.getVideoTracks().length} tracks, state: ${trackState})`);
    }

    attachRemoteStream(stream) {
        console.log(`👥 ===== ATTACHING REMOTE STREAM TO UI =====`);
        console.log(`   Stream: ${stream}`);
        console.log(`   Stream ID: ${stream?.id}`);
        console.log(`   Video element: ${this.remoteVideo}`);
        console.log(`   Video element ID: ${this.remoteVideo?.id}`);
        console.log(`   Video tracks: ${stream?.getVideoTracks().length || 0}`);
        
        if (!this.remoteVideo) {
            console.error('❌ Remote video element NOT found!');
            this.updateDebugInfo('Remote: ERROR - video element not found');
            return;
        }
        
        try {
            const hasVideo = stream?.getVideoTracks().length > 0;
            
            if (hasVideo) {
                this.remoteVideo.srcObject = stream;
                this.remoteVideo.style.display = 'block';
                const remotePlayPromise = this.remoteVideo.play();
                if (remotePlayPromise && typeof remotePlayPromise.catch === 'function') {
                    remotePlayPromise.catch(error => {
                        console.warn('⚠️ Remote video autoplay blocked:', error.message);
                    });
                }
                // Remove audio-only indicator if exists
                const remoteContainer = this.remoteVideo.parentElement;
                const indicator = remoteContainer?.querySelector('.remote-audio-only-indicator');
                if (indicator) indicator.remove();
            } else {
                // Audio-only mode for remote - show placeholder
                this.remoteVideo.style.display = 'none';
                const remoteContainer = this.remoteVideo.parentElement;
                if (remoteContainer && !remoteContainer.querySelector('.remote-audio-only-indicator')) {
                    const indicator = document.createElement('div');
                    indicator.className = 'remote-audio-only-indicator';
                    indicator.innerHTML = '<i class="fas fa-user"></i><br>Audio Only';
                    indicator.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:white;text-align:center;font-size:24px;';
                    remoteContainer.appendChild(indicator);
                }
            }
            
            console.log(`✅ srcObject set on video element`);
            console.log(`   Current srcObject: ${this.remoteVideo.srcObject}`);
            console.log(`   Video element readyState: ${this.remoteVideo.readyState}`);
            
            const videoTrack = hasVideo ? stream.getVideoTracks()[0]  : null;
            const trackState = videoTrack?.readyState || 'none';
            
            console.log(`✅ Remote stream attached (track state: ${trackState})`);
            this.updateDebugInfo(`Remote: ✓ (${stream?.getVideoTracks().length} tracks, state: ${trackState})`);
        } catch (error) {
            console.error(`❌ Error setting remote stream:`, error);
            this.updateDebugInfo(`Remote: ERROR - ${error.message}`);
        }
    }

    updateDebugInfo(message) {
        const debugEl = document.getElementById('debugLocalStream');
        if (debugEl) {
            debugEl.textContent = 'Local: ' + message.split('Local: ')[1] || message;
        }
    }

    clearRemoteStream() {
        this.remoteVideo.srcObject = null;
    }

    // ====== Status Updates ======

    showMessage(message, type = 'info') {
        // You can replace this with a toast notification system
        console.log(`[${type.toUpperCase()}] ${message}`);
    }

    showStatus(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
        if (this.statusEl) {
            this.statusEl.textContent = message;
            this.statusEl.style.color = 
                type === 'error' ? '#ef4444' : 
                type === 'success' ? '#10b981' : '#3b82f6';
        }
    }

    updateConnectionStatus(state) {
        if (this.connType) {
            this.connType.textContent = state;
        }
        
        if (state === 'connected') {
            this.showStatus('✅ Connected', 'success');
            this.remoteIndicator?.classList.add('connected');
            this.remoteIndicator?.classList.remove('connecting', 'disconnected');
        } else if (state === 'connecting') {
            this.showStatus('⏳ Connecting...', 'info');
            this.remoteIndicator?.classList.add('connecting');
            this.remoteIndicator?.classList.remove('connected', 'disconnected');
        } else if (state === 'failed') {
            this.showStatus('❌ Connection failed', 'error');
            this.remoteIndicator?.classList.add('disconnected');
            this.remoteIndicator?.classList.remove('connected', 'connecting');
        }
    }

    updateIceState(state) {
        if (this.iceState) {
            this.iceState.textContent = state;
        }
    }

    updateRemoteUser(userId) {
        if (this.remoteUser) {
            this.remoteUser.textContent = userId || 'Waiting...';
        }
    }

    updateCallDuration(seconds) {
        if (this.callDuration) {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            this.callDuration.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }
    }

    // ====== Controls Update ======

    setAudioState(enabled) {
        this.audioEnabled = enabled;
        if (this.toggleAudioBtn) {
            this.toggleAudioBtn.classList.toggle('disabled', !enabled);
            const icon = this.toggleAudioBtn.querySelector('i');
            if (icon) {
                icon.className = enabled ? 'fas fa-microphone' : 'fas fa-microphone-slash';
            }
            const tooltip = this.toggleAudioBtn.querySelector('.tooltip');
            if (tooltip) {
                tooltip.textContent = enabled ? 'Mute (Ctrl+D)' : 'Unmute (Ctrl+D)';
            }
        }
    }

    setVideoState(enabled) {
        this.videoEnabled = enabled;
        if (this.toggleVideoBtn) {
            this.toggleVideoBtn.classList.toggle('disabled', !enabled);
            const icon = this.toggleVideoBtn.querySelector('i');
            if (icon) {
                icon.className = enabled ? 'fas fa-video' : 'fas fa-video-slash';
            }
            const tooltip = this.toggleVideoBtn.querySelector('.tooltip');
            if (tooltip) {
                tooltip.textContent = enabled ? 'Stop camera' : 'Start camera';
            }
        }
    }

    setEndCallEnabled(enabled) {
        if (this.endCallBtn) {
            this.endCallBtn.disabled = !enabled;
        }
    }

    // ====== Meeting Setup ======

    setMeetingCode(code) {
        this.meetingCode.textContent = code;
        this.meetingLink.style.display = 'flex';
        this.meetingLink.style.flexDirection = 'column';
        this.meetingLink.style.alignItems = 'center';
        this.meetingLink.style.gap = '12px';
        this.copyLinkBtn.style.display = 'block';
    }

    setMeetingTitle(title) {
        const titleEl = document.querySelector('#meetingTitle');
        if (titleEl) {
            titleEl.textContent = title;
        }
    }

    updateParticipantCount(count) {
        if (this.participantCount) {
            this.participantCount.textContent = `${count} participant${count !== 1 ? 's' : ''}`;
        }
    }

    updateUsersList(users) {
        const remoteUsers = Array.isArray(users) ? users : [];
        this.updateParticipantCount(remoteUsers.length + 1);

        const usersList = document.getElementById('usersList');
        if (!usersList) {
            return;
        }

        if (remoteUsers.length === 0) {
            usersList.innerHTML = '<p>Waiting for other users...</p>';
            return;
        }

        const html = remoteUsers.map(userId => {
            return `
                <div class="user-item">
                    <strong>${userId}</strong>
                    <button class="btn btn-sm btn-primary" data-user-id="${userId}">Call</button>
                </div>
            `;
        }).join('');

        usersList.innerHTML = html;
        usersList.querySelectorAll('button[data-user-id]').forEach(button => {
            button.addEventListener('click', () => {
                const userId = button.getAttribute('data-user-id');
                if (this.callbacks.onCallUser && userId) {
                    this.callbacks.onCallUser(userId);
                }
            });
        });
    }

    clearMeetingCode() {
        this.meetingCode.textContent = '';
        this.meetingLink.style.display = 'none';
    }

    // ====== Callbacks Registration ======

    on(event, callback) {
        if (event === 'joinRoom') this.callbacks.onJoinRoom = callback;
        if (event === 'endCall') this.callbacks.onEndCall = callback;
        if (event === 'toggleAudio') this.callbacks.onToggleAudio = callback;
        if (event === 'toggleVideo') this.callbacks.onToggleVideo = callback;
        if (event === 'createMeeting') this.callbacks.onCreateMeeting = callback;
        if (event === 'callUser') this.callbacks.onCallUser = callback;
    }

}

// Export for global use
window.uiManager = new UIManager();
console.log('✅ UI Manager initialized');
