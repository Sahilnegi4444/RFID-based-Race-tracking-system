/**
 * Mock WebSocket service for future real-time updates.
 */

export class SocketService {
  constructor(url) {
    this.url = url || 'ws://localhost:8000/ws';
    this.socket = null;
    this.listeners = new Map();
  }

  connect() {
    // Mock connection
    console.log(`[Socket] Connected to ${this.url}`);
    
    // In future:
    // this.socket = new WebSocket(this.url);
    // this.socket.onmessage = (event) => {
    //   const data = JSON.parse(event.data);
    //   this.notifyListeners(data.type, data.payload);
    // };
  }

  disconnect() {
    console.log('[Socket] Disconnected');
    // if (this.socket) this.socket.close();
  }

  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    return () => this.unsubscribe(event, callback);
  }

  unsubscribe(event, callback) {
    if (this.listeners.has(event)) {
      const filtered = this.listeners.get(event).filter(cb => cb !== callback);
      this.listeners.set(event, filtered);
    }
  }

  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(cb => cb(data));
    }
  }
}

export const socketService = new SocketService();
