/**
 * 🌐 Network Traversal Module
 * 
 * Handles NAT/firewall traversal for cross-network communication
 * - Discover public IP using STUN
 * - Provide TURN server fallback
 * - Detect network type
 * - Diagnose connectivity issues
 */

class NetworkTraversal {
    constructor() {
        this.publicIp = null;
        this.localIps = new Set();
        this.networkType = null;
        this.stunServers = [
            'stun:stun.l.google.com:19302',
            'stun:stun1.l.google.com:19302',
            'stun:stun2.l.google.com:19302',
            'stun:stun3.l.google.com:19302',
            'stun:stun4.l.google.com:19302',
            'stun:stun.stunprotocol.org:3478',
            'stun:stun.services.mozilla.com:3478'
        ];
        
        this.turnServers = [
            // Add public TURN servers if needed
            // { urls: 'turn:your-turn-server.com', username: 'user', credential: 'pass' }
        ];
        
        this.callbacks = {
            onNetworkDetected: null,
            onIpDiscovered: null,
            onConnectivityCheck: null,
            onError: null
        };
    }

    /**
     * Get ICE servers configuration
     */
    getIceServers() {
        const iceServers = this.stunServers.map(url => ({ urls: url }));
        
        // Add TURN servers if configured
        if (this.turnServers.length > 0) {
            iceServers.push(...this.turnServers);
        }
        
        return { iceServers };
    }

    /**
     * Discover public IP using STUN
     */
    async discoverPublicIp() {
        try {
            console.log('🔍 Discovering public IP via STUN...');
            
            const pc = new RTCPeerConnection(this.getIceServers());
            
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    pc.close();
                    // Don't reject - just resolve with null if timeout
                    console.warn('⚠️ STUN discovery timeout (this is OK - may be on local network)');
                    resolve(null);
                }, 10000);  // Increased from 5000 to 10000ms for slower networks

                pc.onicecandidate = (event) => {
                    if (event.candidate) {
                        const candidate = event.candidate.candidate;
                        const ipMatch = candidate.match(/([0-9]{1,3}([.][0-9]{1,3}){3})/);
                        
                        if (ipMatch) {
                            const ip = ipMatch[1];
                            
                            // Filter out local IPs
                            if (!ip.startsWith('127.') && !ip.endsWith('.255')) {
                                if (this.isPublicIp(ip)) {
                                    clearTimeout(timeout);
                                    this.publicIp = ip;
                                    pc.close();
                                    console.log(`✅ Public IP discovered: ${ip}`);
                                    if (this.callbacks.onIpDiscovered) {
                                        this.callbacks.onIpDiscovered(ip);
                                    }
                                    resolve(ip);
                                } else if (ip.startsWith('192.') || ip.startsWith('10.') || ip.startsWith('172.')) {
                                    this.localIps.add(ip);
                                }
                            }
                        }
                    }
                };

                pc.createOffer()
                    .then(offer => pc.setLocalDescription(offer))
                    .catch(error => {
                        clearTimeout(timeout);
                        console.warn('⚠️ STUN discovery error (will continue without public IP):', error);
                        resolve(null);  // Don't reject - allow app to continue
                    });
            });

        } catch (error) {
            console.warn('⚠️ Could not discover public IP:', error.message);
            if (this.callbacks.onError) {
                this.callbacks.onError('IP Discovery', error);
            }
            return null;
        }
    }

    /**
     * Get local IP addresses
     */
    async getLocalIps() {
        try {
            console.log('🔍 Discovering local IPs...');
            
            await this.discoverPublicIp(); // This also discovers local IPs
            return Array.from(this.localIps);

        } catch (error) {
            console.warn('⚠️ Could not discover local IPs:', error.message);
            return [];
        }
    }

    /**
     * Check if IP is public
     */
    isPublicIp(ip) {
        const parts = ip.split('.');
        if (parts.length !== 4) return false;
        
        const firstOctet = parseInt(parts[0]);
        const secondOctet = parseInt(parts[1]);
        
        // Private ranges: 10.x.x.x, 172.16-31.x.x, 192.168.x.x
        if (firstOctet === 10) return false;
        if (firstOctet === 172 && secondOctet >= 16 && secondOctet <= 31) return false;
        if (firstOctet === 192 && secondOctet === 168) return false;
        if (firstOctet === 127) return false; // Loopback
        if (firstOctet === 169) return false; // Link-local
        
        return true;
    }

    /**
     * Detect network type
     */
    async detectNetworkType() {
        try {
            const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            
            if (!connection) {
                console.warn('⚠️ Network Information API not available');
                this.networkType = 'unknown';
                return 'unknown';
            }
            
            const type = connection.effectiveType; // '4g', '3g', '2g', 'slow-2g'
            this.networkType = type;
            
            console.log(`📡 Network type: ${type}`);
            if (this.callbacks.onNetworkDetected) {
                this.callbacks.onNetworkDetected(type);
            }
            
            return type;

        } catch (error) {
            console.warn('⚠️ Could not detect network type:', error.message);
            return 'unknown';
        }
    }

    /**
     * Check internet connectivity
     */
    async checkConnectivity() {
        try {
            console.log('🔌 Checking connectivity...');
            
            // Try to fetch a small resource
            const response = await fetch('https://www.google.com/favicon.ico', {
                method: 'HEAD',
                mode: 'no-cors'
            });
            
            const isOnline = response.status === 200 || response.status === 0;
            console.log(`✅ Connectivity: ${isOnline ? 'Online' : 'Offline'}`);
            
            if (this.callbacks.onConnectivityCheck) {
                this.callbacks.onConnectivityCheck(isOnline);
            }
            
            return isOnline;

        } catch (error) {
            console.warn('⚠️ Connectivity check failed:', error.message);
            return navigator.onLine;
        }
    }

    /**
     * Get network diagnostics
     */
    async getDiagnostics() {
        try {
            console.log('🔧 Running network diagnostics...');
            
            // Try to get public IP, but don't fail if it times out
            let publicIp = this.publicIp;
            if (!publicIp) {
                try {
                    publicIp = await this.discoverPublicIp();
                } catch (error) {
                    console.warn('⚠️ Could not discover public IP (may be on local network):', error.message);
                    publicIp = null;
                }
            }
            
            const diagnostics = {
                onLine: navigator.onLine,
                publicIp: publicIp,
                localIps: this.localIps.size > 0 ? Array.from(this.localIps) : await this.getLocalIps(),
                networkType: this.networkType || await this.detectNetworkType(),
                isConnected: await this.checkConnectivity(),
                timestamp: new Date().toISOString()
            };
            
            console.log('📊 Network Diagnostics:', diagnostics);
            return diagnostics;

        } catch (error) {
            console.error('❌ Diagnostics failed:', error);
            // Return partial diagnostics instead of null
            const fallback = {
                onLine: navigator.onLine,
                publicIp: null,
                localIps: Array.from(this.localIps),
                networkType: this.networkType || 'unknown',
                isConnected: navigator.onLine,
                timestamp: new Date().toISOString()
            };
            if (this.callbacks.onError) {
                this.callbacks.onError('Diagnostics', error);
            }
            return fallback;
        }
    }

    /**
     * Get network quality estimate
     */
    getNetworkQuality() {
        const type = this.networkType || 'unknown';
        
        const quality = {
            '4g': { level: 'excellent', bitrate: 5000 },
            '3g': { level: 'good', bitrate: 2000 },
            '2g': { level: 'poor', bitrate: 500 },
            'slow-2g': { level: 'very poor', bitrate: 200 },
            'unknown': { level: 'unknown', bitrate: 2000 }
        };
        
        return quality[type] || quality['unknown'];
    }

    /**
     * Add TURN server configuration
     */
    addTurnServer(urls, username = null, credential = null) {
        const config = { urls };
        if (username) config.username = username;
        if (credential) config.credential = credential;
        
        this.turnServers.push(config);
        console.log('✅ TURN server added');
    }

    /**
     * Get all STUN servers
     */
    getStunServers() {
        return [...this.stunServers];
    }

    /**
     * Get all TURN servers
     */
    getTurnServers() {
        return [...this.turnServers];
    }

    /**
     * Register callbacks
     */
    on(event, callback) {
        if (event === 'networkDetected') this.callbacks.onNetworkDetected = callback;
        if (event === 'ipDiscovered') this.callbacks.onIpDiscovered = callback;
        if (event === 'connectivityCheck') this.callbacks.onConnectivityCheck = callback;
        if (event === 'error') this.callbacks.onError = callback;
    }
}

// Export for global use
window.networkTraversal = new NetworkTraversal();
console.log('✅ Network Traversal module initialized');
