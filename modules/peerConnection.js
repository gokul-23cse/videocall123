/**
 * 🔗 Peer Connection Module (WebRTC)
 * 
 * Manages direct browser-to-browser connections
 * - Create RTCPeerConnection
 * - Add local media tracks
 * - Receive remote media tracks
 * - Handle SDP offer/answer negotiation
 * - Manage connection state
 */
 
class PeerConnectionManager {
    constructor(config = null) {
        this.peerConnections = new Map();
        
        // Default WebRTC configuration
        this.config = config || {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },   
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
                { urls: 'stun:stun3.l.google.com:19302' },
                { urls: 'stun:stun4.l.google.com:19302' },
                { urls: 'stun:stun.stunprotocol.org:3478' },
                { urls: 'stun:stun.services.mozilla.com:3478' },
                // TURN (replace with your relay credentials)
                {
                    urls: 'turn:YOUR_TURN_HOST:3478',
                    username: 'YOUR_TURN_USERNAME',
                    credential: 'YOUR_TURN_PASSWORD'
                }
            ],
            iceCandidatePoolSize: 6,
            bundlePolicy: 'max-bundle',
            rtcpMuxPolicy: 'require',
            iceTransportPolicy: 'all'
        };
        
        this.callbacks = {
            onRemoteStream: null,
            onConnectionStateChange: null,
            onIceStateChange: null,
            onIceCandidate: null,
            onError: null
        };
        this.pendingIceCandidates = new Map();
    }

    /**
     * Create a new peer connection
     * @param {string} peerId - Unique identifier for the peer
     */
    createPeerConnection(peerId) {
        try {
            console.log(`🔌 Creating peer connection with ${peerId}`);
            
            const peerConnection = new RTCPeerConnection(this.config);
            
            // Handle remote stream
            peerConnection.ontrack = (event) => {
                console.log(`📥 [ONTRACK] Received ${event.track.kind} track from ${peerId}`);
                console.log(`   ├─ Track enabled: ${event.track.enabled}`);
                console.log(`   ├─ Track readyState: ${event.track.readyState}`);
                console.log(`   ├─ Streams received: ${event.streams.length}`);
                console.log(`   └─ Stream ID: ${event.streams[0]?.id}`);
                
                if (this.callbacks.onRemoteStream) {
                    console.log(`   🎯 Calling onRemoteStream callback with stream`);
                    this.callbacks.onRemoteStream(peerId, event.streams[0]);
                } else {
                    console.warn(`   ⚠️ No onRemoteStream callback registered!`);
                }
            };

            // Handle ICE candidates
            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    // Log candidate type for debugging
                    const candidateStr = event.candidate.candidate;
                    let candidateType = 'unknown';
                    if (candidateStr.includes('typ host')) candidateType = 'host (local)';
                    else if (candidateStr.includes('typ srflx')) candidateType = 'srflx (STUN)';
                    else if (candidateStr.includes('typ relay')) candidateType = 'relay (TURN)';
                    
                    console.log(`❄️ ICE candidate [${candidateType}] from ${peerId}`);
                    
                    if (this.callbacks.onIceCandidate) {
                        this.callbacks.onIceCandidate(peerId, event.candidate);
                    }
                } else {
                    console.log(`✅ All ICE candidates gathered for ${peerId}`);
                }
            };

            // Handle connection state changes
            peerConnection.onconnectionstatechange = () => {
                console.log(`🔗 Connection state (${peerId}): ${peerConnection.connectionState}`);
                
                if (this.callbacks.onConnectionStateChange) {
                    this.callbacks.onConnectionStateChange(peerId, peerConnection.connectionState);
                }
            };

            // Handle ICE connection state changes
            peerConnection.oniceconnectionstatechange = () => {
                console.log(`❄️ ICE state (${peerId}): ${peerConnection.iceConnectionState}`);
                
                if (this.callbacks.onIceStateChange) {
                    this.callbacks.onIceStateChange(peerId, peerConnection.iceConnectionState);
                }
                
                // Log additional info for debugging
                if (peerConnection.iceConnectionState === 'failed') {
                    console.error(`❌ ICE connection failed for ${peerId}. May need TURN server.`);
                } else if (peerConnection.iceConnectionState === 'disconnected') {
                    console.warn(`⚠️ ICE disconnected for ${peerId}. Connection may recover...`);
                }
            };
            
            // Monitor ICE gathering state
            peerConnection.onicegatheringstatechange = () => {
                console.log(`❄️ ICE gathering state (${peerId}): ${peerConnection.iceGatheringState}`);
            };

            // Handle signaling state changes
            peerConnection.onsignalingstatechange = () => {
                console.log(`📡 Signaling state (${peerId}): ${peerConnection.signalingState}`);
            };

            this.peerConnections.set(peerId, peerConnection);
            this._flushPendingIce(peerId);
            return peerConnection;

        } catch (error) {
            console.error('❌ Error creating peer connection:', error);
            if (this.callbacks.onError) {
                this.callbacks.onError(peerId, error);
            }
            throw error;
        }
    }

    /**
     * Get peer connection
     */
    getPeerConnection(peerId) {
        return this.peerConnections.get(peerId);
    }

    /**
     * Add local stream to peer connection
     * @param {string} peerId - Peer ID
     * @param {MediaStream} stream - Local media stream
     */
    addLocalStream(peerId, stream) {
        const pc = this.getPeerConnection(peerId);
        if (!pc) {
            console.error(`❌ Peer connection not found for ${peerId}`);
            return;
        }

        try {
            console.log(`📤 Adding local stream to ${peerId}...`);
            console.log(`   Stream tracks: ${stream.getTracks().length}`);
            
            stream.getTracks().forEach(track => {
                console.log(`   ├─ Adding ${track.kind} track (enabled: ${track.enabled}, state: ${track.readyState})`);
                const sender = pc.addTrack(track, stream);
                this._configureSender(sender, track);
            });
            
            console.log(`✅ Local stream added successfully to ${peerId}`);
        } catch (error) {
            console.error('❌ Error adding local stream:', error);
            if (this.callbacks.onError) {
                this.callbacks.onError(peerId, error);
            }
        }
    }

    /**
     * Create SDP offer
     * @param {string} peerId - Peer ID
     */
    async createOffer(peerId) {
        try {
            const pc = this.getPeerConnection(peerId);
            if (!pc) throw new Error(`Peer connection not found for ${peerId}`);

            console.log(`📝 ===== CREATING OFFER =====`);
            console.log(`   Peer: ${peerId}`);
            
            const offer = await pc.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
            });

            await pc.setLocalDescription(offer);
            console.log(`✅ Offer created successfully`);
            console.log(`   SDP contains video: ${offer.sdp.includes('m=video')}`);
            console.log(`   SDP contains audio: ${offer.sdp.includes('m=audio')}`);
            console.log(`   Local description set, signaling state: ${pc.signalingState}`);
            
            return offer;

        } catch (error) {
            console.error('❌ Error creating offer:', error);
            if (this.callbacks.onError) {
                this.callbacks.onError(peerId, error);
            }
            throw error;
        }
    }

    /**
     * Create SDP answer
     * @param {string} peerId - Peer ID
     */
    async createAnswer(peerId) {
        try {
            const pc = this.getPeerConnection(peerId);
            if (!pc) throw new Error(`Peer connection not found for ${peerId}`);

            console.log(`📝 ===== CREATING ANSWER =====`);
            console.log(`   Peer: ${peerId}`);
            
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            console.log(`✅ Answer created successfully`);
            console.log(`   SDP contains video: ${answer.sdp.includes('m=video')}`);
            console.log(`   SDP contains audio: ${answer.sdp.includes('m=audio')}`);
            console.log(`   Local description set, signaling state: ${pc.signalingState}`);
            
            return answer;

        } catch (error) {
            console.error('❌ Error creating answer:', error);
            if (this.callbacks.onError) {
                this.callbacks.onError(peerId, error);
            }
            throw error;
        }
    }

    /**
     * Set remote description (offer or answer)
     * @param {string} peerId - Peer ID
     * @param {RTCSessionDescription} description - Remote SDP
     */
    async setRemoteDescription(peerId, description) {
        try {
            const pc = this.getPeerConnection(peerId);
            if (!pc) throw new Error(`Peer connection not found for ${peerId}`);

            if (description?.type === 'answer') {
                if (pc.signalingState === 'stable' && pc.currentRemoteDescription?.type === 'answer') {
                    console.warn(`⚠️ Ignoring duplicate answer for ${peerId} (already stable)`);
                    return;
                }

                if (pc.signalingState !== 'have-local-offer') {
                    console.warn(`⚠️ Ignoring answer for ${peerId} in state: ${pc.signalingState}`);
                    return;
                }
            }

            console.log(`📥 ===== SETTING REMOTE DESCRIPTION =====`);
            console.log(`   Peer: ${peerId}`);
            console.log(`   Type: ${description.type}`);
            console.log(`   SDP type contains video: ${description.sdp.includes('m=video')}`);
            
            await pc.setRemoteDescription(new RTCSessionDescription(description));
            console.log(`✅ Remote description set successfully`);
            console.log(`   Connection state: ${pc.connectionState}`);
            console.log(`   ICE connection state: ${pc.iceConnectionState}`);
            console.log(`   Signaling state: ${pc.signalingState}`);

            this._flushPendingIce(peerId);
        } catch (error) {
            console.error('❌ Error setting remote description:', error);
            if (this.callbacks.onError) {
                this.callbacks.onError(peerId, error);
            }
            throw error;
        }
    }

    /**
     * Add ICE candidate
     * @param {string} peerId - Peer ID
     * @param {RTCIceCandidate} candidate - ICE candidate
     */
    async addIceCandidate(peerId, candidate) {
        try {
            const pc = this.getPeerConnection(peerId);
            if (!pc) {
                this._queueIceCandidate(peerId, candidate);
                return;
            }

            if (!pc.remoteDescription) {
                this._queueIceCandidate(peerId, candidate);
                return;
            }

            if (candidate) {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
                console.log(`✅ ICE candidate added for ${peerId}`);
            }
        } catch (error) {
            console.error('Error adding ICE candidate:', error);
            // Don't throw - ICE candidate errors are non-fatal
        }
    }

    _queueIceCandidate(peerId, candidate) {
        if (!candidate) return;
        const list = this.pendingIceCandidates.get(peerId) || [];
        list.push(candidate);
        this.pendingIceCandidates.set(peerId, list);
        console.log(`⏳ Queued ICE candidate for ${peerId} (pending: ${list.length})`);
    }

    async _flushPendingIce(peerId) {
        const pc = this.getPeerConnection(peerId);
        const list = this.pendingIceCandidates.get(peerId);
        if (!pc || !pc.remoteDescription || !list || list.length === 0) return;

        this.pendingIceCandidates.delete(peerId);
        for (const cand of list) {
            try {
                await pc.addIceCandidate(new RTCIceCandidate(cand));
            } catch (err) {
                console.warn(`⚠️ Failed to add queued ICE candidate for ${peerId}:`, err);
            }
        }
        console.log(`✅ Flushed queued ICE candidates for ${peerId}`);
    }

    /**
     * Close peer connection
     * @param {string} peerId - Peer ID
     */
    closePeerConnection(peerId) {
        const pc = this.getPeerConnection(peerId);
        if (pc) {
            pc.close();
            this.peerConnections.delete(peerId);
            console.log(`🔌 Peer connection closed for ${peerId}`);
        }
    }

    /**
     * Close all peer connections
     */
    closeAllConnections() {
        this.peerConnections.forEach((pc, peerId) => {
            pc.close();
            console.log(`🔌 Peer connection closed for ${peerId}`);
        });
        this.peerConnections.clear();
    }

    /**
     * Get connection state
     */
    getConnectionState(peerId) {
        const pc = this.getPeerConnection(peerId);
        return pc ? pc.connectionState : null;
    }

    /**
     * Get ICE connection state
     */
    getIceConnectionState(peerId) {
        const pc = this.getPeerConnection(peerId);
        return pc ? pc.iceConnectionState : null;
    }

    /**
     * Get all peer IDs
     */
    getPeerIds() {
        return Array.from(this.peerConnections.keys());
    }

    /**
     * Check if connection exists
     */
    hasConnection(peerId) {
        return this.peerConnections.has(peerId);
    }

    /**
     * Register callbacks
     */
    on(event, callback) {
        if (event === 'remoteStream') this.callbacks.onRemoteStream = callback;
        if (event === 'connectionStateChange') this.callbacks.onConnectionStateChange = callback;
        if (event === 'iceStateChange') this.callbacks.onIceStateChange = callback;
        if (event === 'iceCandidate') this.callbacks.onIceCandidate = callback;
        if (event === 'error') this.callbacks.onError = callback;
    }

    _configureSender(sender, track) {
        if (!sender || !track) return;

        if (track.kind === 'video') {
            track.contentHint = 'motion';
        }

        const params = sender.getParameters();
        if (!params || !Array.isArray(params.encodings)) return;

        if (params.encodings.length === 0) {
            params.encodings = [{}];
        }

        if (track.kind === 'video') {
            params.encodings[0].maxBitrate = 2500000;
            params.encodings[0].maxFramerate = 30;
            if (typeof params.degradationPreference !== 'undefined') {
                params.degradationPreference = 'maintain-resolution';
            }
        }

        if (track.kind === 'audio') {
            params.encodings[0].maxBitrate = 128000;
        }

        sender.setParameters(params).catch(error => {
            console.warn('⚠️ Failed to apply sender parameters:', error);
        });
    }
}

// Export for global use
window.peerConnectionManager = new PeerConnectionManager();
console.log('✅ Peer Connection Manager initialized');
