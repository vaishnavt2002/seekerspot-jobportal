// services/notificationSocketService.js
const SOCKET_STATES = {
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED',
  DISCONNECTED: 'DISCONNECTED',
  RECONNECTING: 'RECONNECTING'
};

class NotificationSocketService {
  constructor() {
    this.socket = null;
    this.status = SOCKET_STATES.DISCONNECTED;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000;
    this.reconnectTimer = null;
    this.url = '';
    this.handlers = {
      notification: [],
      unreadNotifications: [],
      connectionChange: []
    };
  }

  initialize() {
    // Set WebSocket URL based on the current environment
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    this.url = `${protocol}://${import.meta.env.VITE_WS_HOST}/ws/notifications/`;
    
    console.log('WebSocket service initialized with URL:', this.url);
    return this;
  }

  async connect() {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      console.log('WebSocket already connected or connecting');
      return;
    }

    this._updateStatus(SOCKET_STATES.CONNECTING);

    try {
      console.log('Connecting to WebSocket URL:', this.url);
      this.socket = new WebSocket(this.url);

      this.socket.onopen = () => {
        console.log('WebSocket connected successfully!');
        this.reconnectAttempts = 0;
        this._updateStatus(SOCKET_STATES.CONNECTED);
      };

      this.socket.onclose = (event) => {
        console.log(`WebSocket disconnected with code ${event.code}`);
        this._updateStatus(SOCKET_STATES.DISCONNECTED);
        this._scheduleReconnect();
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        // Don't update status here - onclose will be called
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);

          if (data.type === 'notification_message' && data.notification) {
            this._notifyHandlers('notification', data.notification);
          } else if (data.type === 'unread_notifications' && data.notifications) {
            console.log('Unread notifications received:', data.notifications);
            this._notifyHandlers('unreadNotifications', data.notifications);
          }
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      this._updateStatus(SOCKET_STATES.DISCONNECTED);
      this._scheduleReconnect();
    }
  }

  _updateStatus(newStatus) {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this._notifyHandlers('connectionChange', newStatus);
    }
  }

  _scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1);
      
      console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
      this._updateStatus(SOCKET_STATES.RECONNECTING);
      
      this.reconnectTimer = setTimeout(() => {
        this.connect();
      }, delay);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this._updateStatus(SOCKET_STATES.DISCONNECTED);
  }

  getStatus() {
    return this.status;
  }

  // Event handlers
  onNotification(callback) {
    this.handlers.notification.push(callback);
    return () => {
      this.handlers.notification = this.handlers.notification.filter(cb => cb !== callback);
    };
  }

  onUnreadNotifications(callback) {
    this.handlers.unreadNotifications.push(callback);
    return () => {
      this.handlers.unreadNotifications = this.handlers.unreadNotifications.filter(cb => cb !== callback);
    };
  }

  onConnectionChange(callback) {
    this.handlers.connectionChange.push(callback);
    return () => {
      this.handlers.connectionChange = this.handlers.connectionChange.filter(cb => cb !== callback);
    };
  }

  _notifyHandlers(type, data) {
    if (this.handlers[type]) {
      this.handlers[type].forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in ${type} handler:`, error);
        }
      });
    }
  }

  // Send a message to mark a notification as read
  markAsRead(notificationId) {
    if (this.status !== SOCKET_STATES.CONNECTED) {
      console.warn('Cannot mark notification as read: WebSocket not connected');
      return false;
    }

    try {
      this.socket.send(JSON.stringify({
        type: 'mark_read',
        notification_id: notificationId
      }));
      return true;
    } catch (error) {
      console.error('Error sending mark as read message:', error);
      return false;
    }
  }

  // Send a message to mark all notifications as read
  markAllAsRead() {
    if (this.status !== SOCKET_STATES.CONNECTED) {
      console.warn('Cannot mark all as read: WebSocket not connected');
      return false;
    }

    try {
      this.socket.send(JSON.stringify({
        type: 'mark_read',
        all: true
      }));
      return true;
    } catch (error) {
      console.error('Error sending mark all as read message:', error);
      return false;
    }
  }
}

// Create a singleton instance
const notificationSocketService = new NotificationSocketService().initialize();

export default notificationSocketService;