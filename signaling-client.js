// WebSocket Signaling Client
class SignalingClient {
    constructor() {
        this.ws = null;
        this.clientId = null;
        this.roomId = null;
        this.callbacks = {
            onConnected: null,
            onUserJoined: null,
            onUserDisconnected: null,
            onOffer: null,
            onAnswer: null,
            onIceCandidate: null,
            onError: null
        };
    }

    connect(url = null) {
        return new Promise((resolve, reject) => {
            try {
                const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                let wsUrl = url || `${protocol}//${window.location.host}`;
                if (window.location.protocol === 'https:' && wsUrl.startsWith('ws://')) {
                    wsUrl = wsUrl.replace(/^ws:/, 'wss:');
                }
                console.log(`🔌 Connecting to signaling server: ${wsUrl}`);
                this.ws = new WebSocket(wsUrl);

                // Add connection timeout
                const timeout = setTimeout(() => {
                    if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
                        this.ws.close();
                        reject(new Error('WebSocket connection timeout (10s)'));
                    }
                }, 10000);

                this.ws.onopen = () => {
                    clearTimeout(timeout);
                    console.log('✅ WebSocket connected');
                    if (this.callbacks.onConnected) {
                        this.callbacks.onConnected();
                    }
                    resolve();
                };

                this.ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        this.handleMessage(data);
                    } catch (error) {
                        console.error('Error parsing message:', error);
                    }
                };

                this.ws.onerror = (error) => {
                    clearTimeout(timeout);
                    console.error('❌ WebSocket error:', error);
                    if (this.callbacks.onError) {
                        this.callbacks.onError(error);
                    }
                    reject(error);
                };

                this.ws.onclose = () => {
                    clearTimeout(timeout);
                    console.log('⚠️ WebSocket closed');
                };
            } catch (error) {
                reject(error);
            }
        });
    }

    handleMessage(data) {
        console.log('📨 Received message:', data.type);

        switch (data.type) {
            case 'connected':
                this.clientId = data.clientId;
                console.log('Client ID:', this.clientId);
                break;

            case 'room-users':
                console.log('Room users:', data.users);
                break;

            case 'user-joined':
                if (this.callbacks.onUserJoined) {
                    this.callbacks.onUserJoined(data.from, data.roomUsers);
                }
                break;

            case 'user-disconnected':
                if (this.callbacks.onUserDisconnected) {
                    this.callbacks.onUserDisconnected(data.from);
                }
                break;

            case 'offer':
                if (this.callbacks.onOffer) {
                    this.callbacks.onOffer(data.from, data.offer);
                }
                break;

            case 'answer':
                if (this.callbacks.onAnswer) {
                    this.callbacks.onAnswer(data.from, data.answer);
                }
                break;

            case 'ice-candidate':
                if (this.callbacks.onIceCandidate) {
                    this.callbacks.onIceCandidate(data.from, data.candidate);
                }
                break;

            default:
                console.log('Unknown message type:', data.type);
        }
    }

    joinRoom(roomId) {
        console.log(`📨 Sending join-room message for: ${roomId}`);
        this.roomId = roomId;
        this.send({
            type: 'join-room',
            roomId: roomId
        });
        console.log(`✅ Join-room message sent`);
    }

    sendOffer(toUserId, offer) {
        console.log(`📤 Sending offer to ${toUserId}`);
        this.send({
            type: 'offer',
            to: toUserId,
            offer: offer
        });
    }

    sendAnswer(toUserId, answer) {
        console.log(`📤 Sending answer to ${toUserId}`);
        this.send({
            type: 'answer',
            to: toUserId,
            answer: answer
        });
    }

    sendIceCandidate(toUserId, candidate) {
        this.send({
            type: 'ice-candidate',
            to: toUserId,
            candidate: candidate
        });
    }

    getUsers() {
        this.send({
            type: 'get-users'
        });
    }

    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.log(`📤 Sending message type: ${data.type}`);
            this.ws.send(JSON.stringify(data));
        } else {
            console.error(`❌ Cannot send message: WebSocket not open (state: ${this.ws?.readyState})`);
        }
    }

    on(event, callback) {
        if (this.callbacks.hasOwnProperty(`on${event.charAt(0).toUpperCase()}${event.slice(1)}`)) {
            this.callbacks[`on${event.charAt(0).toUpperCase()}${event.slice(1)}`] = callback;
        }
    }

    close() {
        if (this.ws) {
            this.ws.close();
        }
    }
}

// Create global signaling client
window.signalingClient = new SignalingClient();
