/**
 * 🌐 Network Manager Module
 * 
 * Manages multiple network endpoints and configurations
 * - Support for different signaling servers
 * - Custom STUN/TURN server configuration
 * - Network diagnostics and selection
 * - Auto-fallback between networks
 */

class NetworkManager {
    constructor() {
        this.currentNetwork = null;
        this.networks = {
            'local': {
                name: 'Local Network',
                signalingUrl: `ws://${window.location.hostname}:3000`,
                description: 'Connect via local network',
                stunServers: [
                    'stun:stun.l.google.com:19302',
                    'stun:stun1.l.google.com:19302'
                ],
                turnServers: [],
                priority: 1
            },
            'cloud': {
                name: 'Cloud Network',
                signalingUrl: 'wss://videocall-server.herokuapp.com',
                description: 'Connect via cloud servers',
                stunServers: [
                    'stun:stun.l.google.com:19302',
                    'stun:stun1.l.google.com:19302',
                    'stun:stun2.l.google.com:19302',
                    'stun:stun3.l.google.com:19302'
                ],
                turnServers: [
                    {
                        urls: 'turn:videocall-turn.herokuapp.com',
                        username: 'user',
                        credential: 'pass123'
                    }
                ],
                priority: 2
            },
            'peer': {
                name: 'P2P Direct',
                signalingUrl: `ws://${window.location.hostname}:8000`,
                description: 'Direct P2P connection',
                stunServers: [
                    'stun:stun.l.google.com:19302',
                    'stun:stun.stunprotocol.org:3478'
                ],
                turnServers: [],
                priority: 3
            }
        };
        
        this.customNetworks = this.loadCustomNetworks();
        this.connectionStats = {
            latency: null,
            bandwidth: null,
            packetLoss: null,
            connectionType: null,
            selectedNetwork: null
        };
        
        this.callbacks = {
            onNetworkSelected: null,
            onNetworkConnected: null,
            onNetworkError: null,
            onDiagnosticsComplete: null
        };
    }

    /**
     * Get all available networks
     */
    getAllNetworks() {
        return { ...this.networks, ...this.customNetworks };
    }

    /**
     * Select a network to use
     */
    selectNetwork(networkId) {
        const allNetworks = this.getAllNetworks();
        
        if (!allNetworks[networkId]) {
            console.error(`❌ Network ${networkId} not found`);
            return false;
        }
        
        this.currentNetwork = networkId;
        const network = allNetworks[networkId];
        
        console.log(`📡 Selected network: ${network.name}`);
        this.connectionStats.selectedNetwork = networkId;
        
        if (this.callbacks.onNetworkSelected) {
            this.callbacks.onNetworkSelected(networkId, network);
        }
        
        return true;
    }

    /**
     * Get current network configuration
     */
    getCurrentNetwork() {
        if (!this.currentNetwork) {
            // Default to local network
            this.selectNetwork('local');
        }
        
        const allNetworks = this.getAllNetworks();
        return {
            id: this.currentNetwork,
            ...allNetworks[this.currentNetwork]
        };
    }

    /**
     * Test connection to a network
     */
    async testNetworkConnection(networkId) {
        const allNetworks = this.getAllNetworks();
        const network = allNetworks[networkId];
        
        if (!network) {
            console.error(`❌ Network ${networkId} not found`);
            return { success: false, error: 'Network not found' };
        }
        
        const startTime = performance.now();
        
        try {
            console.log(`🔍 Testing connection to ${network.name}...`);
            
            // Test WebSocket connectivity
            const result = await this.testWebSocketConnection(network.signalingUrl);
            const latency = performance.now() - startTime;
            
            console.log(`✅ ${network.name} - Latency: ${latency.toFixed(2)}ms`);
            
            return {
                success: true,
                networkId,
                networkName: network.name,
                latency: latency.toFixed(2),
                url: network.signalingUrl
            };
        } catch (error) {
            console.error(`❌ Connection test failed for ${network.name}:`, error);
            return {
                success: false,
                networkId,
                networkName: network.name,
                error: error.message
            };
        }
    }

    /**
     * Test WebSocket connection without establishing full connection
     */
    testWebSocketConnection(url, timeout = 5000) {
        return new Promise((resolve, reject) => {
            try {
                const ws = new WebSocket(url);
                const timer = setTimeout(() => {
                    ws.close();
                    reject(new Error('Connection timeout'));
                }, timeout);

                ws.onopen = () => {
                    clearTimeout(timer);
                    ws.close();
                    resolve(true);
                };

                ws.onerror = (error) => {
                    clearTimeout(timer);
                    reject(error);
                };

                ws.onclose = () => clearTimeout(timer);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Auto-select best network based on connectivity tests
     */
    async autoSelectBestNetwork() {
        console.log('🔄 Auto-selecting best network...');
        
        const allNetworks = this.getAllNetworks();
        const results = [];
        
        for (const [id, network] of Object.entries(allNetworks)) {
            const result = await this.testNetworkConnection(id);
            results.push(result);
        }
        
        // Sort by success and latency
        const successful = results
            .filter(r => r.success)
            .sort((a, b) => parseFloat(a.latency) - parseFloat(b.latency));
        
        if (successful.length > 0) {
            const best = successful[0];
            console.log(`✅ Best network selected: ${best.networkName} (${best.latency}ms)`);
            this.selectNetwork(best.networkId);
            return best.networkId;
        } else {
            console.warn('⚠️ No networks available, using default');
            this.selectNetwork('local');
            return 'local';
        }
    }

    /**
     * Add a custom network
     */
    addCustomNetwork(id, config) {
        if (this.networks[id] || this.customNetworks[id]) {
            console.error(`❌ Network ${id} already exists`);
            return false;
        }
        
        this.customNetworks[id] = {
            name: config.name || id,
            signalingUrl: config.signalingUrl,
            description: config.description || '',
            stunServers: config.stunServers || [],
            turnServers: config.turnServers || [],
            priority: config.priority || 10,
            custom: true
        };
        
        this.saveCustomNetworks();
        console.log(`✅ Custom network added: ${id}`);
        
        return true;
    }

    /**
     * Remove a custom network
     */
    removeCustomNetwork(id) {
        if (!this.customNetworks[id]) {
            console.error(`❌ Custom network ${id} not found`);
            return false;
        }
        
        delete this.customNetworks[id];
        this.saveCustomNetworks();
        console.log(`✅ Custom network removed: ${id}`);
        
        return true;
    }

    /**
     * Get ICE servers for current network
     */
    getIceServers() {
        const network = this.getCurrentNetwork();
        const iceServers = network.stunServers.map(url => ({ urls: url }));
        
        // Add TURN servers
        if (network.turnServers.length > 0) {
            iceServers.push(...network.turnServers);
        }
        
        return { iceServers };
    }

    /**
     * Get signaling URL for current network
     */
    getSignalingUrl() {
        const network = this.getCurrentNetwork();
        return network.signalingUrl;
    }

    /**
     * Perform comprehensive network diagnostics
     */
    async performDiagnostics() {
        console.log('🔧 Starting network diagnostics...');
        
        const diagnostics = {
            timestamp: new Date().toISOString(),
            networks: {},
            localNetwork: await this.detectLocalNetwork(),
            publicIp: await this.detectPublicIp(),
            connectionType: await this.detectConnectionType(),
            bandwidth: await this.estimateBandwidth()
        };
        
        // Test all networks
        for (const [id, network] of Object.entries(this.getAllNetworks())) {
            const result = await this.testNetworkConnection(id);
            diagnostics.networks[id] = result;
        }
        
        if (this.callbacks.onDiagnosticsComplete) {
            this.callbacks.onDiagnosticsComplete(diagnostics);
        }
        
        return diagnostics;
    }

    /**
     * Detect local network information
     */
    async detectLocalNetwork() {
        try {
            const pc = new RTCPeerConnection();
            const localIps = [];
            
            return new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    pc.close();
                    resolve(localIps);
                }, 3000);

                pc.onicecandidate = (event) => {
                    if (event.candidate) {
                        const candidate = event.candidate.candidate;
                        const ipMatch = candidate.match(/([0-9]{1,3}([.][0-9]{1,3}){3})/);
                        
                        if (ipMatch) {
                            const ip = ipMatch[1];
                            if (!localIps.includes(ip) && 
                                (ip.startsWith('192.') || ip.startsWith('10.') || ip.startsWith('172.'))) {
                                localIps.push(ip);
                            }
                        }
                    }
                };

                pc.createOffer().then(offer => pc.setLocalDescription(offer)).catch(() => {});
            });
        } catch (error) {
            console.warn('Could not detect local network:', error);
            return [];
        }
    }

    /**
     * Detect public IP
     */
    async detectPublicIp() {
        try {
            const response = await fetch('https://api.ipify.org?format=json', { 
                timeout: 5000 
            });
            const data = await response.json();
            return data.ip;
        } catch (error) {
            console.warn('Could not detect public IP:', error);
            return null;
        }
    }

    /**
     * Detect connection type (WiFi, 4G, etc.)
     */
    async detectConnectionType() {
        try {
            const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            
            if (connection) {
                return {
                    type: connection.effectiveType,
                    downlink: connection.downlinkMax,
                    rtt: connection.rtt,
                    saveData: connection.saveData
                };
            }
            
            return null;
        } catch (error) {
            console.warn('Could not detect connection type:', error);
            return null;
        }
    }

    /**
     * Estimate bandwidth using data transfer test
     */
    async estimateBandwidth() {
        try {
            console.log('📊 Estimating bandwidth...');
            const testSize = 1024 * 1024; // 1MB
            const testUrl = `data:application/octet-stream;base64,${btoa('x'.repeat(testSize))}`;
            
            const startTime = performance.now();
            await fetch(testUrl);
            const duration = performance.now() - startTime;
            
            const bandwidth = (testSize / (duration / 1000)) / (1024 * 1024);
            return bandwidth.toFixed(2) + ' Mbps';
        } catch (error) {
            console.warn('Could not estimate bandwidth:', error);
            return null;
        }
    }

    /**
     * Save custom networks to localStorage
     */
    saveCustomNetworks() {
        try {
            localStorage.setItem('customNetworks', JSON.stringify(this.customNetworks));
        } catch (error) {
            console.warn('Could not save custom networks:', error);
        }
    }

    /**
     * Load custom networks from localStorage
     */
    loadCustomNetworks() {
        try {
            const saved = localStorage.getItem('customNetworks');
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.warn('Could not load custom networks:', error);
            return {};
        }
    }

    /**
     * Get connection statistics
     */
    getConnectionStats() {
        return { ...this.connectionStats };
    }

    /**
     * Update connection statistics
     */
    updateConnectionStats(stats) {
        this.connectionStats = {
            ...this.connectionStats,
            ...stats,
            selectedNetwork: this.currentNetwork
        };
    }

    /**
     * Register callback
     */
    on(event, callback) {
        if (this.callbacks[`on${event.charAt(0).toUpperCase()}${event.slice(1)}`]) {
            this.callbacks[`on${event.charAt(0).toUpperCase()}${event.slice(1)}`] = callback;
        }
    }
}

// Create global instance
window.networkManager = new NetworkManager();
