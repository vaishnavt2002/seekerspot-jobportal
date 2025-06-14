// src/services/InterviewWebSocketService.js
import axios from 'axios';

class InterviewWebSocketService {
    constructor() {
      this.socket = null;
      this.onMessageCallback = null;
      this.reconnectAttempts = 0;
      this.maxReconnectAttempts = 5;
      this.reconnectDelay = 5000; 
      this.isConnecting = false; 
      this.pendingMessages = []; 
      this.retryInterval = null;
      this.connectionTimeout = null;
      
      // Debug mode
      this.DEBUG = true;
    }
    
    debug(...args) {
      if (this.DEBUG) {
        console.log('[WebSocket]', ...args);
      }
    }
  
    async connect() {
      if (this.isConnecting) {
        this.debug('Already connecting, skipping connect');
        return;
      }
      
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.debug('Already connected, skipping connect');
        return;
      }
      
      this.isConnecting = true;
      this.debug('Attempting to connect WebSocket');
      
      this.disconnect();
      
      try {
        this.debug('Making auth request to ensure cookies are set');
        await axios.get(`${import.meta.env.VITE_API_URL}/auth/user/`, {
          withCredentials: true
        });
        
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${import.meta.env.VITE_WS_HOST}/ws/interview/`;
        this.debug('WebSocket URL:', wsUrl);
        
        this.socket = new WebSocket(wsUrl);
        
        this.socket.onopen = this.handleOpen.bind(this);
        this.socket.onmessage = this.handleMessage.bind(this);
        this.socket.onclose = this.handleClose.bind(this);
        this.socket.onerror = this.handleError.bind(this);
        
        this.connectionTimeout = setTimeout(() => {
          if (this.socket && this.socket.readyState !== WebSocket.OPEN) {
            this.debug('Connection timeout - closing socket');
            this.socket.close();
            this.isConnecting = false;
            
            this.scheduleReconnect();
          }
        }, 10000); 
      } catch (error) {
        console.error('Failed to prepare WebSocket connection:', error);
        this.isConnecting = false;
        
        this.scheduleReconnect();
      }
    }
    
    scheduleReconnect() {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.min(this.reconnectAttempts, 3);
        this.debug(`Scheduling reconnect in ${delay/1000} seconds... (Attempt ${this.reconnectAttempts})`);
        setTimeout(() => this.connect(), delay);
      } else {
        this.debug('Max reconnection attempts reached - giving up');
      }
    }
    
    handleOpen(event) {
      this.debug('WebSocket connected!', event);
      this.reconnectAttempts = 0;
      this.isConnecting = false;
      
      // Clear connection timeout
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }
      
      this.processPendingMessages();
    }
    
    handleMessage(event) {
      this.debug('Message received:', event.data);
      try {
        const data = JSON.parse(event.data);
        if (this.onMessageCallback) {
          this.onMessageCallback(data);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    }
    
    handleClose(event) {
      const reason = event.reason || 'No reason provided';
      const code = event.code || 'No code provided';
      this.debug(`WebSocket closed: code=${code}, reason=${reason}`);
      this.isConnecting = false;
      
      // Clear connection timeout if it exists
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }
      
      // Don't attempt to reconnect on normal closure
      if (event.code !== 1000 && this.socket) {
        this.scheduleReconnect();
      } else if (event.code === 1000) {
        this.debug('Normal closure - not attempting to reconnect');
      }
    }
    
    handleError(error) {
      console.error('WebSocket error:', error);
      this.debug('WebSocket error occurred', error);
      this.isConnecting = false;
      
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }
    }
    
    processPendingMessages() {
      if (this.pendingMessages.length > 0) {
        this.debug(`Attempting to send ${this.pendingMessages.length} pending messages`);
        
        const messagesToSend = [...this.pendingMessages];
        this.pendingMessages = [];
        
        messagesToSend.forEach(message => {
          this.sendMessage(message);
        });
      }
    }
  
sendMessage(data) {
  this.debug('Sending message:', data);
  
  if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
    console.warn('Cannot send message: WebSocket not connected', this.getStatus());
    
    this.pendingMessages.push(data);
    
    if (!this.isConnecting && (!this.socket || this.socket.readyState === WebSocket.CLOSED)) {
      this.connect();
    }
    return false;
  }

  try {
    if (data.userId && !data.targetUserId && 
        (data.type === 'offer' || data.type === 'answer' || data.type === 'ice_candidate')) {
      this.debug('Warning: Message missing targetUserId field');
    }
    
    this.socket.send(JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error sending message:', error);
    this.pendingMessages.push(data);
    return false;
  }
}
  
    onMessage(callback) {
      if (typeof callback === 'function') {
        this.onMessageCallback = callback;
      } else {
        this.onMessageCallback = null;
      }
    }
  
    disconnect() {
      if (this.retryInterval) {
        clearInterval(this.retryInterval);
        this.retryInterval = null;
      }
      
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }
      
      if (this.socket) {
        try {
          this.debug('Current socket state:', this.getStatus());
          if (this.socket.readyState === WebSocket.OPEN ||
              this.socket.readyState === WebSocket.CONNECTING) {
            this.debug('Disconnecting WebSocket');
            this.socket.close(1000, 'Normal closure');
          }
        } catch (error) {
          console.error('Error closing WebSocket connection:', error);
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
  
export default new InterviewWebSocketService();