/**
 * 🎯 Room Management Module
 * 
 * Manages video meetings/rooms
 * - Generate random meeting IDs
 * - Join room via link or code
 * - Notify when users join/leave
 * - Track active users in room
 */

class RoomManager {
    constructor() {
        this.currentRoomId = null;
        this.users = new Set();
        this.callbacks = {
            onUserJoined: null,
            onUserLeft: null,
            onRoomJoined: null,
            onRoomLeft: null
        };
    }

    /**
     * Generate a random meeting ID
     * Format: 4 random chars - 4 random chars - 4 random chars
     * Example: ABCD-1234-WXYZ
     */
    generateMeetingId() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let id = '';
        
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 4; j++) {
                id += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            if (i < 2) id += '-';
        }
        
        return id;
    }

    /**
     * Join a room by meeting ID
     * @param {string} meetingId - The meeting ID to join
     */
    joinRoom(meetingId) {
        this.currentRoomId = meetingId;
        this.users.clear();
        
        console.log(`📍 Joined room: ${meetingId}`);
        
        if (this.callbacks.onRoomJoined) {
            this.callbacks.onRoomJoined(meetingId);
        }
    }

    /**
     * Leave the current room
     */
    leaveRoom() {
        if (this.currentRoomId) {
            console.log(`🚪 Left room: ${this.currentRoomId}`);
            
            if (this.callbacks.onRoomLeft) {
                this.callbacks.onRoomLeft(this.currentRoomId);
            }
            
            this.currentRoomId = null;
            this.users.clear();
        }
    }

    /**
     * Add user to room
     * @param {string} userId - User ID to add
     */
    addUser(userId) {
        if (!this.users.has(userId)) {
            this.users.add(userId);
            console.log(`👤 User joined: ${userId}`);
            
            if (this.callbacks.onUserJoined) {
                this.callbacks.onUserJoined(userId, Array.from(this.users));
            }
        }
    }

    /**
     * Remove user from room
     * @param {string} userId - User ID to remove
     */
    removeUser(userId) {
        if (this.users.has(userId)) {
            this.users.delete(userId);
            console.log(`👤 User left: ${userId}`);
            
            if (this.callbacks.onUserLeft) {
                this.callbacks.onUserLeft(userId, Array.from(this.users));
            }
        }
    }

    /**
     * Get current room ID
     */
    getRoomId() {
        return this.currentRoomId;
    }

    /**
     * Get all users in room
     */
    getUsers() {
        return Array.from(this.users);
    }

    /**
     * Get user count in room
     */
    getUserCount() {
        return this.users.size;
    }

    /**
     * Check if user is in room
     */
    hasUser(userId) {
        return this.users.has(userId);
    }

    /**
     * Get meeting link (for sharing)
     * @param {string} baseUrl - Base URL of the app
     */
    getMeetingLink(baseUrl = window.location.origin) {
        if (!this.currentRoomId) return null;
        return `${baseUrl}?room=${this.currentRoomId}`;
    }

    /**
     * Get meeting info
     */
    getMeetingInfo() {
        return {
            roomId: this.currentRoomId,
            users: this.getUsers(),
            userCount: this.getUserCount(),
            meetingLink: this.getMeetingLink()
        };
    }

    /**
     * Register callbacks
     */
    on(event, callback) {
        if (event === 'userJoined') this.callbacks.onUserJoined = callback;
        if (event === 'userLeft') this.callbacks.onUserLeft = callback;
        if (event === 'roomJoined') this.callbacks.onRoomJoined = callback;
        if (event === 'roomLeft') this.callbacks.onRoomLeft = callback;
    }
}

// Export for global use
window.roomManager = new RoomManager();
console.log('✅ Room Manager initialized');
