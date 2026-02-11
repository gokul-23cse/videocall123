/**
 * 📹 Media Capture Module
 * 
 * Manages camera and microphone access
 * - Request webcam & mic permissions
 * - Start/stop media streams
 * - Attach streams to video elements
 * - Control audio/video tracks
 */

class MediaCapture {
    constructor() {
        this.localStream = null;
        this.isAudioEnabled = true;
        this.isVideoEnabled = true;
        this.callbacks = {
            onStreamReady: null,
            onStreamStopped: null,
            onError: null
        };
    }

    /**
     * Request and start media stream
     * @param {Object} constraints - Media constraints
     */
    async startStream(constraints = null) {
        try {
            // Default constraints
            if (!constraints) {
                constraints = {
                    video: {
                        width: { ideal: 1920 },
                        height: { ideal: 1080 },
                        frameRate: { ideal: 30, max: 60 },
                        facingMode: 'user'
                    },
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    }
                };
            }

            console.log('📹 Requesting camera and microphone access...');
            
            try {
                this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
            } catch (error) {
                // If video fails (camera in use), try audio-only
                if (error.name === 'NotReadableError' || error.message.includes('Could not start video source')) {
                    console.warn('⚠️ Camera in use, falling back to audio-only mode');
                    this.localStream = await navigator.mediaDevices.getUserMedia({
                        video: false,
                        audio: constraints.audio || true
                    });
                    this.isVideoEnabled = false;
                } else {
                    throw error;
                }
            }
            
            console.log('✅ Media stream started');
            console.log(`   Video: ${this.localStream.getVideoTracks().length} track(s)`);
            console.log(`   Audio: ${this.localStream.getAudioTracks().length} track(s)`);
            
            // Fire callback
            console.log('🔔 Firing streamReady callback...');
            if (this.callbacks.onStreamReady) {
                console.log('   Callback exists, calling it now');
                this.callbacks.onStreamReady(this.localStream);
                console.log('   Callback completed');
            } else {
                console.warn('   ⚠️ No streamReady callback registered!');
            }
            
            return this.localStream;

        } catch (error) {
            const message = this.getPermissionError(error);
            console.error('❌ Media access error:', message);
            
            if (this.callbacks.onError) {
                this.callbacks.onError(message);
            }
            
            throw error;
        }
    }

    /**
     * Stop media stream
     */
    stopStream() {
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                track.stop();
                console.log(`⏹️ Stopped ${track.kind} track`);
            });
            
            this.localStream = null;
            
            if (this.callbacks.onStreamStopped) {
                this.callbacks.onStreamStopped();
            }
            
            console.log('✅ Media stream stopped');
        }
    }

    /**
     * Get local stream
     */
    getStream() {
        return this.localStream;
    }

    /**
     * Toggle audio on/off
     */
    toggleAudio() {
        if (!this.localStream) return false;
        
        this.isAudioEnabled = !this.isAudioEnabled;
        
        this.localStream.getAudioTracks().forEach(track => {
            track.enabled = this.isAudioEnabled;
        });
        
        console.log(`🔊 Audio: ${this.isAudioEnabled ? 'ON' : 'OFF'}`);
        return this.isAudioEnabled;
    }

    /**
     * Toggle video on/off
     */
    toggleVideo() {
        if (!this.localStream) return false;
        
        this.isVideoEnabled = !this.isVideoEnabled;
        
        this.localStream.getVideoTracks().forEach(track => {
            track.enabled = this.isVideoEnabled;
        });
        
        console.log(`📹 Video: ${this.isVideoEnabled ? 'ON' : 'OFF'}`);
        return this.isVideoEnabled;
    }

    /**
     * Set audio enabled/disabled
     */
    setAudioEnabled(enabled) {
        if (!this.localStream) return false;
        
        this.isAudioEnabled = enabled;
        
        this.localStream.getAudioTracks().forEach(track => {
            track.enabled = enabled;
        });
        
        return enabled;
    }

    /**
     * Set video enabled/disabled
     */
    setVideoEnabled(enabled) {
        if (!this.localStream) return false;
        
        this.isVideoEnabled = enabled;
        
        this.localStream.getVideoTracks().forEach(track => {
            track.enabled = enabled;
        });
        
        return enabled;
    }

    /**
     * Get audio enabled state
     */
    isAudioOn() {
        return this.isAudioEnabled;
    }

    /**
     * Get video enabled state
     */
    isVideoOn() {
        return this.isVideoEnabled;
    }

    /**
     * Get audio tracks
     */
    getAudioTracks() {
        return this.localStream ? this.localStream.getAudioTracks() : [];
    }

    /**
     * Get video tracks
     */
    getVideoTracks() {
        return this.localStream ? this.localStream.getVideoTracks() : [];
    }

    /**
     * Check device permissions status
     */
    async checkPermissions() {
        try {
            const result = await navigator.permissions.query({ name: 'camera' });
            console.log('Camera permission:', result.state);
            return {
                camera: result.state,
                microphone: (await navigator.permissions.query({ name: 'microphone' })).state
            };
        } catch (error) {
            console.log('Permission check not supported');
            return null;
        }
    }

    /**
     * Parse permission error
     */
    getPermissionError(error) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            return 'Camera/Microphone permission denied. Please allow access in browser settings.';
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
            return 'No camera or microphone found. Please check your devices.';
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
            return 'Camera/Microphone is already in use by another application.';
        } else if (error.name === 'TypeError') {
            return 'Invalid media constraints provided.';
        }
        return error.message || 'Unknown error accessing media devices.';
    }

    /**
     * Register callbacks
     */
    on(event, callback) {
        if (event === 'streamReady') this.callbacks.onStreamReady = callback;
        if (event === 'streamStopped') this.callbacks.onStreamStopped = callback;
        if (event === 'error') this.callbacks.onError = callback;
    }
}

// Export for global use
window.mediaCapture = new MediaCapture();
console.log('✅ Media Capture module initialized');
