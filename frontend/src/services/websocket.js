import axios from 'axios';

class WebSocketService {
    constructor() {
      this.socket = null;
      this.onMessageCallback = null;
      this.reconnectAttempts = 0;
      this.maxReconnectAttempts = 5;
      this.reconnectDelay = 2000;
    }
  
    async connect(communityId) {
      console.log('Attempting to connect WebSocket for community:', communityId);
      if (!communityId) {
        console.error('Cannot connect: Community ID is required');
        return;
      }
      
      this.disconnect();
      
      try {
        // Make a request to a simple endpoint to ensure cookies are set
        // This helps maintain session authentication
        await axios.get(`${import.meta.env.VITE_API_URL}/community/communities/${communityId}/`, {
          withCredentials: true
        });
        
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = import.meta.env.VITE_WS_HOST || window.location.host;
        
        // Ensure communityId is treated as string
        const wsUrl = `${protocol}//${host}/ws/community/${communityId}/`;
        
        console.log('WebSocket URL:', wsUrl);
        
        // Using cookie credentials with WebSocket
        this.socket = new WebSocket(wsUrl);
    
        this.socket.onopen = () => {
          console.log(`WebSocket connected to community: ${communityId}`);
          this.reconnectAttempts = 0;
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
          console.error(`WebSocket disconnected: ${event.code} - ${event.reason}`);
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * this.reconnectAttempts;
            console.log(`Attempting to reconnect in ${delay/1000} seconds...`);
            setTimeout(() => this.connect(communityId), delay);
          }
        };
    
        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
        };
      } catch (error) {
        console.error('Failed to prepare WebSocket connection:', error);
      }
    }
  
    sendMessage(message, attachment = null) {
      console.log('Sending message:', message, 'Attachment:', attachment);
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        console.error('Cannot send message: WebSocket not connected');
        return false;
      }
  
      try {
        this.socket.send(JSON.stringify({
          message: message,
          attachment: attachment
        }));
        return true;
      } catch (error) {
        console.error('Error sending message:', error);
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
          this.socket.close(1000, 'Normal closure');
        }
        this.socket = null;
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