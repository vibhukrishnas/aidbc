import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.listeners = new Map();
  }

  connect(userId) {
    if (this.socket) return;

    const wsUrl = process.env.REACT_APP_WS_URL || 'http://localhost:3001';
    
    this.socket = io(wsUrl, {
      auth: {
        userId
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      this.connected = true;
      console.log('WebSocket connected');
      this.emit('user:online', { userId });
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
      console.log('WebSocket disconnected');
    });

    // Handle real-time events
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    // Real-time notifications
    this.socket.on('notification', (data) => {
      this.trigger('notification', data);
    });

    // Live debate updates
    this.socket.on('debate:update', (data) => {
      this.trigger('debateUpdate', data);
    });

    // Leaderboard changes
    this.socket.on('leaderboard:update', (data) => {
      this.trigger('leaderboardUpdate', data);
    });

    // Achievement unlocked
    this.socket.on('achievement:unlocked', (data) => {
      this.trigger('achievementUnlocked', data);
    });
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  trigger(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }

  emit(event, data) {
    if (this.socket && this.connected) {
      this.socket.emit(event, data);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }
}

export const websocket = new WebSocketService();
