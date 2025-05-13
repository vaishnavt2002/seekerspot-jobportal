import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import notificationApi from '../api/notificationApi';
import notificationSocketService from '../services/notificationSocketService';

// Create context
const NotificationContext = createContext({
  notifications: [],
  unreadCount: 0,
  loading: false,
  isSocketConnected: false,
  markAsRead: () => {},
  markAllAsRead: () => {},
  loadMoreNotifications: () => {}
});

// Hook to use the context
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const prevNotificationsRef = useRef([]); // For backup in case of errors
  const prevUnreadCountRef = useRef(0);

  // Initialize notifications and socket connection
  useEffect(() => {
    console.log('NotificationProvider initializing...');
    let isMounted = true;
    
    // Initial data fetch
    const fetchInitialData = async () => {
      if (!isMounted) return;
      
      try {
        console.log('Fetching initial notification data...');
        setLoading(true);
        
        // Get unread count
        const countResponse = await notificationApi.getUnreadCount();
        console.log('Unread count:', countResponse);
        if (isMounted) {
          const count = countResponse.unread_count || 0;
          setUnreadCount(count);
          prevUnreadCountRef.current = count;
        }
        
        // Get recent notifications
        const notificationsResponse = await notificationApi.getNotifications({ 
          page: 1, 
          page_size: 10 
        });
        
        console.log('Recent notifications:', notificationsResponse);
        if (isMounted) {
          const notificationData = notificationsResponse.results || [];
          console.log('Setting initial notifications:', notificationData);
          setNotifications(notificationData);
          prevNotificationsRef.current = notificationData;
        }
      } catch (error) {
        console.error('Error fetching initial notification data:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchInitialData();

    // Set up WebSocket connection status handler
    const connectionHandler = (status) => {
      if (!isMounted) return;
      console.log('WebSocket connection status changed:', status);
      setIsSocketConnected(status === 'CONNECTED');
      
      // If we just connected, refresh data
      if (status === 'CONNECTED') {
        fetchInitialData();
      }
    };

    // Set up notification handlers
    const handleNewNotification = (notification) => {
      if (!isMounted) return;
      
      console.log('New notification received in context handler:', notification);
      
      // Add new notification to the state
      setNotifications(prevNotifications => {
        // Check if notification already exists
        const exists = prevNotifications.some(n => n.id === notification.id);
        if (exists) return prevNotifications;
        
        // Add new notification at the beginning
        const updatedNotifications = [notification, ...prevNotifications];
        console.log('Updated notifications after new notification:', updatedNotifications);
        prevNotificationsRef.current = updatedNotifications;
        return updatedNotifications;
      });
      
      // Increment unread count if notification is not read
      if (!notification.is_read) {
        setUnreadCount(prevCount => {
          const newCount = prevCount + 1;
          console.log('Updated unread count:', newCount);
          prevUnreadCountRef.current = newCount;
          return newCount;
        });
      }
    };

    const handleUnreadNotifications = (unreadNotifications) => {
      if (!isMounted) return;
      
      console.log('Unread notifications received in context handler:', unreadNotifications);
      
      if (Array.isArray(unreadNotifications)) {
        // Update notifications state with unread ones
        setNotifications(prevNotifications => {
          // Create a map of existing notifications for quick lookup
          const existingMap = new Map(prevNotifications.map(n => [n.id, n]));
          
          // Add unread notifications to the map
          unreadNotifications.forEach(notification => {
            existingMap.set(notification.id, notification);
          });
          
          // Convert back to array and sort by creation date
          const mergedNotifications = Array.from(existingMap.values())
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          
          console.log('Merged notifications after unread update:', mergedNotifications);
          prevNotificationsRef.current = mergedNotifications;
          return mergedNotifications;
        });
        
        // Update unread count to match the number of unread notifications
        const unreadCount = unreadNotifications.length;
        setUnreadCount(unreadCount);
        prevUnreadCountRef.current = unreadCount;
        console.log('Updated unread count from WebSocket:', unreadCount);
      }
    };

    // Register the handlers
    const connectionChangeCleanup = notificationSocketService.onConnectionChange(connectionHandler);
    const newNotificationCleanup = notificationSocketService.onNotification(handleNewNotification);
    const unreadNotificationsCleanup = notificationSocketService.onUnreadNotifications(handleUnreadNotifications);

    // Connect to WebSocket
    notificationSocketService.connect();

    // Reconnect WebSocket when window gets focus
    const handleFocus = () => {
      console.log('Window focused, checking notification connection...');
      if (notificationSocketService.getStatus() !== 'CONNECTED') {
        console.log('Reconnecting notification socket on window focus');
        notificationSocketService.connect();
      }
    };

    window.addEventListener('focus', handleFocus);

    // Cleanup on unmount
    return () => {
      console.log('NotificationProvider cleaning up...');
      isMounted = false;
      
      // Clean up the event handlers
      if (connectionChangeCleanup) connectionChangeCleanup();
      if (newNotificationCleanup) newNotificationCleanup();
      if (unreadNotificationsCleanup) unreadNotificationsCleanup();
      
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Debug effect to monitor state changes
  useEffect(() => {
    console.log('Notifications state changed:', notifications);
    console.log('Unread count state changed:', unreadCount);
    console.log('Socket connection state changed:', isSocketConnected);
  }, [notifications, unreadCount, isSocketConnected]);

  // Mark a notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      console.log('Marking notification as read:', notificationId);
      
      // Update UI immediately for a smoother experience
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true } 
            : notification
        )
      );
      
      // Update unread count
      const unreadNotification = notifications.find(n => n.id === notificationId && !n.is_read);
      if (unreadNotification) {
        setUnreadCount(prevCount => Math.max(0, prevCount - 1));
      }
      
      // Send to server - try both WebSocket and REST API
      let success = false;
      
      // Try WebSocket first
      if (isSocketConnected) {
        success = notificationSocketService.markAsRead(notificationId);
      }
      
      // Fall back to REST API if WebSocket fails
      if (!success) {
        console.log('WebSocket unavailable, using REST API instead');
        await notificationApi.markAsRead(notificationId);
      }
    } catch (error) {
      console.error(`Error marking notification ${notificationId} as read:`, error);
      
      // Revert UI changes if there was an error
      setNotifications(prevNotificationsRef.current);
      setUnreadCount(prevUnreadCountRef.current);
    }
  }, [notifications, isSocketConnected]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      console.log('Marking all notifications as read');
      
      // Store previous state for potential rollback
      prevNotificationsRef.current = [...notifications];
      prevUnreadCountRef.current = unreadCount;
      
      // Update UI immediately
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => ({ ...notification, is_read: true }))
      );
      setUnreadCount(0);
      
      // Send to server - try both WebSocket and REST API
      let success = false;
      
      // Try WebSocket first
      if (isSocketConnected) {
        success = notificationSocketService.markAllAsRead();
      }
      
      // Fall back to REST API if WebSocket fails
      if (!success) {
        console.log('WebSocket unavailable, using REST API instead');
        await notificationApi.markAllAsRead();
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      
      // Restore previous state on error
      setNotifications(prevNotificationsRef.current);
      setUnreadCount(prevUnreadCountRef.current);
    }
  }, [notifications, unreadCount, isSocketConnected]);

  // Load more notifications
  const loadMoreNotifications = useCallback(async (page = 2) => {
    try {
      console.log(`Loading more notifications (page ${page})`);
      setLoading(true);
      
      const response = await notificationApi.getNotifications({ 
        page, 
        page_size: 10 
      });
      
      console.log('Additional notifications loaded:', response);
      
      // Merge with existing notifications
      const newNotifications = response.results || [];
      
      setNotifications(prevNotifications => {
        // Create a map of existing notifications for quick lookup
        const notificationMap = new Map(prevNotifications.map(n => [n.id, n]));
        
        // Add new notifications to the map (prevents duplicates)
        newNotifications.forEach(notification => {
          notificationMap.set(notification.id, notification);
        });
        
        // Convert back to array and sort by creation date
        const mergedNotifications = Array.from(notificationMap.values())
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        console.log('Merged notifications:', mergedNotifications);
        prevNotificationsRef.current = mergedNotifications;
        return mergedNotifications;
      });
      
      return response;
    } catch (error) {
      console.error('Error loading more notifications:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Context value
  const value = {
    notifications,
    unreadCount,
    loading,
    isSocketConnected,
    markAsRead,
    markAllAsRead,
    loadMoreNotifications,
  };

  console.log('NotificationProvider rendering with value:', value);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;