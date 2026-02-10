const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;

// Create HTTP server for static files
const server = http.createServer((req, res) => {
    let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
    
    // Security: prevent directory traversal
    if (!filePath.startsWith(__dirname)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    const ext = path.extname(filePath);
    const contentTypes = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.svg': 'image/svg+xml'
    };

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('Not Found');
            return;
        }
        res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/plain' });
        res.end(data);
    });
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Store active connections with room info
const connections = new Map();
const rooms = new Map();

wss.on('connection', (ws) => {
    const clientId = Math.random().toString(36).substring(7);
    console.log(`[${new Date().toISOString()}] Client connected: ${clientId}`);

    let currentRoom = null;

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log(`[${new Date().toISOString()}] Message from ${clientId}:`, data.type);

            switch (data.type) {
                case 'join-room':
                    handleJoinRoom(ws, clientId, data.roomId);
                    currentRoom = data.roomId;
                    break;

                case 'offer':
                    sendToUser(data.to, {
                        type: 'offer',
                        from: clientId,
                        offer: data.offer
                    });
                    console.log(`[${new Date().toISOString()}] Offer from ${clientId} to ${data.to}`);
                    break;

                case 'answer':
                    sendToUser(data.to, {
                        type: 'answer',
                        from: clientId,
                        answer: data.answer
                    });
                    console.log(`[${new Date().toISOString()}] Answer from ${clientId} to ${data.to}`);
                    break;

                case 'ice-candidate':
                    sendToUser(data.to, {
                        type: 'ice-candidate',
                        from: clientId,
                        candidate: data.candidate
                    });
                    break;

                case 'get-users':
                    handleGetUsers(ws, clientId, currentRoom);
                    break;

                default:
                    console.log('Unknown message type:', data.type);
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    ws.on('close', () => {
        console.log(`[${new Date().toISOString()}] Client disconnected: ${clientId}`);
        if (currentRoom) {
            const room = rooms.get(currentRoom);
            if (room) {
                room.delete(clientId);
                connections.delete(clientId);

                // Notify others in room
                broadcastToRoom(clientId, currentRoom, {
                    type: 'user-disconnected',
                    from: clientId
                });

                if (room.size === 0) {
                    rooms.delete(currentRoom);
                }
            }
        }
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });

    // Send connection confirmation
    ws.send(JSON.stringify({
        type: 'connected',
        clientId: clientId
    }));
});

function handleJoinRoom(ws, clientId, roomId) {
    if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set());
    }

    const room = rooms.get(roomId);
    const previousUsers = Array.from(room);
    room.add(clientId);
    connections.set(clientId, { ws, roomId });

    console.log(`[${new Date().toISOString()}] ${clientId} joined room ${roomId}. Users: ${room.size}`);

    // Notify all users in room about the new user
    broadcastToRoom(clientId, roomId, {
        type: 'user-joined',
        from: clientId,
        roomUsers: Array.from(room)
    });

    // Send list of existing users to the new user
    ws.send(JSON.stringify({
        type: 'room-users',
        users: previousUsers
    }));
}

function handleGetUsers(ws, clientId, roomId) {
    if (roomId && rooms.has(roomId)) {
        const users = Array.from(rooms.get(roomId)).filter(id => id !== clientId);
        ws.send(JSON.stringify({
            type: 'users-list',
            users: users
        }));
    }
}

function broadcastToRoom(fromId, roomId, message) {
    if (!rooms.has(roomId)) return;

    const room = rooms.get(roomId);
    room.forEach(clientId => {
        const connection = connections.get(clientId);
        if (connection && connection.ws.readyState === WebSocket.OPEN && clientId !== fromId) {
            connection.ws.send(JSON.stringify(message));
        }
    });
}

function sendToUser(toUserId, message) {
    const connection = connections.get(toUserId);
    if (connection && connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.send(JSON.stringify(message));
    } else {
        console.log(`[${new Date().toISOString()}] Cannot send message to ${toUserId}: user not found or disconnected`);
    }
}

server.listen(PORT, () => {
    console.log(`\n🎥 P2P Video Call Server Running!`);
    console.log(`📍 HTTP Server: http://localhost:${PORT}`);
    console.log(`🔌 WebSocket Server: ws://localhost:${PORT}`);
    console.log(`\n✅ Server ready for connections...\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down server...');
    wss.clients.forEach(client => {
        client.close();
    });
    server.close();
    process.exit(0);
});
