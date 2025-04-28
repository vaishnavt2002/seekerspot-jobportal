import axios from 'axios';

class WebSocketService {
    constructor() {
      this.socket = null;
      this.onMessageCallback = null;
      this.reconnectAttempts = 0;
      this.maxReconnectAttempts = 5;
      this.reconnectDelay = 5000; // 5 seconds
      this.isConnecting = false; // Prevent duplicate connections
      this.pendingMessages = []; // Store messages that failed to send
    }
  
    async connect() {
      if (this.isConnecting || (this.socket && this.socket.readyState === WebSocket.OPEN)) {
        console.log('WebSocket already connecting or connected, skipping connect');
        return;
      }
      
      this.isConnecting = true;
      console.log('Attempting to connect WebSocket');
      
      this.disconnect();
      
      try {
        // Make a request to ensure cookies are set
        await axios.get(`${import.meta.env.VITE_API_URL}/community/communities/`, {
          withCredentials: true
        });
        
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = import.meta.env.VITE_WS_HOST || window.location.host;
        const wsUrl = `${protocol}//${host}/ws/community/`;
        
        console.log('WebSocket URL:', wsUrl);
        
        this.socket = new WebSocket(wsUrl);
    
        this.socket.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          this.isConnecting = false;
          
          // Try to send any pending messages
          if (this.pendingMessages.length > 0) {
            console.log(`Attempting to send ${this.pendingMessages.length} pending messages`);
            [...this.pendingMessages].forEach(message => {
              if (this.sendMessage(message)) {
                // Remove from pending if sent successfully
                this.pendingMessages = this.pendingMessages.filter(m => m !== message);
              }
            });
          }
        };
    
        this.socket.onmessage = (event) => {
          console.log('WebSocket message received:', event.data);
          try {
            const data = JSON.parse(event.data);
            if (this.onMessageCallback) {
              this.onMessageCallback(data);
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
    
        this.socket.onclose = (event) => {
          console.error(`WebSocket disconnected: code=${event.code}, reason=${event.reason}`);
          this.isConnecting = false;
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * this.reconnectAttempts;
            console.log(`Attempting to reconnect in ${delay/1000} seconds...`);
            setTimeout(() => this.connect(), delay);
          } else {
            console.log('Max reconnection attempts reached or normal closure');
          }
        };
    
        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;
        };
      } catch (error) {
        console.error('Failed to prepare WebSocket connection:', error);
        this.isConnecting = false;
      }
    }
  
    sendMessage(data) {
      console.log('Sending message:', data);
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        console.error('Cannot send message: WebSocket not connected');
        // Store message to send later
        this.pendingMessages.push(data);
        return false;
      }
  
      try {
        this.socket.send(JSON.stringify(data));
        return true;
      } catch (error) {
        console.error('Error sending message:', error);
        // Store message to try again
        this.pendingMessages.push(data);
        return false;
      }
    }
  
    onMessage(callback) {
      if (typeof callback === 'function') {
        this.onMessageCallback = callback;
      }
    }
  
    disconnect() {
      if (this.socket) {
        if (this.socket.readyState === WebSocket.OPEN ||
            this.socket.readyState === WebSocket.CONNECTING) {
          console.log('Disconnecting WebSocket');
          this.socket.close(1000, 'Normal closure');
        }
        this.socket = null;
        this.isConnecting = false;
      }
    }
  
    getStatus() {
      if (!this.socket) return 'DISCONNECTED';
      switch (this.socket.readyState) {
        case WebSocket.CONNECTING: return 'CONNECTING';
        case WebSocket.OPEN: return 'CONNECTED';
        case WebSocket.CLOSING: return 'CLOSING';
        case WebSocket.CLOSED: return 'CLOSED';
        default: return 'UNKNOWN';
      }
    }
}
  
export default new WebSocketService();