import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import notificationApi from '../../api/notificationApi';
import notificationSocketService from '../../services/notificationSocketService';

const NotificationsPage = () => {
  const { markAsRead, markAllAsRead } = useNotifications();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();

  // Setup WebSocket handler for new notifications
  useEffect(() => {
    console.log('Setting up WebSocket handlers for NotificationsPage');
    
    // Function to handle new notifications from WebSocket
    const handleNewNotification = (notification) => {
      console.log('New notification received in NotificationsPage:', notification);
      
      // Only update if notification belongs in the current view
      if (activeTab === 'all' || (activeTab === 'unread' && !notification.is_read)) {
        setNotifications(prevNotifications => {
          // Check if notification already exists
          const exists = prevNotifications.some(n => n.id === notification.id);
          if (exists) return prevNotifications;
          
          // Add new notification at the beginning
          const updatedNotifications = [notification, ...prevNotifications];
          console.log('Updated notifications list in NotificationsPage:', updatedNotifications);
          return updatedNotifications;
        });
      }
    };

    // Function to handle bulk updates of unread notifications
    const handleUnreadNotifications = (unreadNotifications) => {
      console.log('Unread notifications update received in NotificationsPage:', unreadNotifications);
      
      if (Array.isArray(unreadNotifications)) {
        if (activeTab === 'unread') {
          // Replace entire list for unread tab
          setNotifications(unreadNotifications.sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at)
          ));
        } else if (activeTab === 'all') {
          // Update read status for existing notifications
          setNotifications(prevNotifications => {
            // Create a map of received unread notifications
            const unreadMap = new Map(unreadNotifications.map(n => [n.id, n]));
            
            // Update existing notifications and add new ones
            const existingIds = new Set(prevNotifications.map(n => n.id));
            const updatedNotifications = [...prevNotifications];
            
            // Add new notifications that don't exist in our current list
            unreadNotifications.forEach(notification => {
              if (!existingIds.has(notification.id)) {
                updatedNotifications.unshift(notification);
              }
            });
            
            return updatedNotifications.sort(
              (a, b) => new Date(b.created_at) - new Date(a.created_at)
            );
          });
        }
      }
    };

    // Register WebSocket handlers
    const newNotificationCleanup = notificationSocketService.onNotification(handleNewNotification);
    const unreadNotificationsCleanup = notificationSocketService.onUnreadNotifications(handleUnreadNotifications);
    
    // Additional handler for when notifications are marked as read
    const connectionChangeCleanup = notificationSocketService.onConnectionChange(status => {
      console.log('WebSocket connection status changed in NotificationsPage:', status);
      if (status === 'CONNECTED') {
        // Refresh data when socket reconnects
        fetchNotifications(1);
      }
    });

    // Cleanup handlers on unmount
    return () => {
      console.log('Cleaning up WebSocket handlers in NotificationsPage');
      if (newNotificationCleanup) newNotificationCleanup();
      if (unreadNotificationsCleanup) unreadNotificationsCleanup();
      if (connectionChangeCleanup) connectionChangeCleanup();
    };
  }, [activeTab]);

  // Fetch notifications
  const fetchNotifications = async (currentPage = 1) => {
    try {
      console.log(`Fetching ${activeTab} notifications, page ${currentPage}`);
      setLoading(true);
      const params = { page: currentPage, page_size: 20 };
      
      if (activeTab === 'unread') {
        params.is_read = false;
      }
      
      const response = await notificationApi.getNotifications(params);
      console.log('Notifications API response:', response);
      
      // Update state
      setNotifications(prevNotifications => 
        currentPage === 1
          ? response.results || []
          : [...prevNotifications, ...(response.results || [])]
      );
      
      // Check if we have more pages
      setHasMore(!!response.next);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch notifications when tab changes
  useEffect(() => {
    console.log('Tab changed, fetching notifications');
    setPage(1);
    fetchNotifications(1);
  }, [activeTab]);

  // Handle pagination
  useEffect(() => {
    if (page > 1) {
      fetchNotifications(page);
    }
  }, [page]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      console.log('Loading more notifications');
      setPage(prevPage => prevPage + 1);
    }
  };

  const handleTabChange = (tab) => {
    console.log('Changing tab to:', tab);
    if (tab !== activeTab) {
      setActiveTab(tab);
      setNotifications([]);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      console.log('Marking all notifications as read');
      await markAllAsRead();
      
      // Update notifications in the current list
      if (activeTab === 'unread') {
        // Clear unread tab
        setNotifications([]);
      } else {
        // Mark all as read in the all tab
        setNotifications(prevNotifications => 
          prevNotifications.map(n => ({ ...n, is_read: true }))
        );
      }
    } catch (err) {
      console.error('Error marking all as read:', err);
      setError('Failed to mark notifications as read. Please try again.');
    }
  };

  // Function to determine navigation path based on notification type
  const getNavigationPath = (notification) => {
    const { notification_type, source_id, source_type } = notification;
    
    switch (notification_type) {
      case 'application_update':
      case 'interview_scheduled':
      case 'interview_updated':
      case 'interview_cancelled':
        // Navigate to applied jobs page for all application/interview related notifications
        return '/my-jobs';
      
      case 'job_applied':
        // This is typically for job providers, but if it's for job seekers, 
        // navigate to applied jobs page
        return '/jobprovider/job-posts';
      
      default:
        // For unknown notification types, stay on notifications page
        return null;
    }
  };

  // Updated to mark as read and navigate
  const handleNotificationClick = async (notification) => {
    try {
      console.log('Notification clicked:', notification);
      
      // Mark as read if needed
      if (!notification.is_read) {
        await markAsRead(notification.id);
        
        // Update the list
        setNotifications(prevNotifications => {
          if (activeTab === 'unread') {
            // Remove from unread tab
            return prevNotifications.filter(n => n.id !== notification.id);
          } else {
            // Mark as read in all tab
            return prevNotifications.map(n => 
              n.id === notification.id ? { ...n, is_read: true } : n
            );
          }
        });
      }
      
      // Navigate to appropriate page
      const navigationPath = getNavigationPath(notification);
      if (navigationPath) {
        console.log('Navigating to:', navigationPath);
        navigate(navigationPath);
      } else {
        console.log('No navigation path defined for notification type:', notification.notification_type);
      }
      
    } catch (err) {
      console.error('Error handling notification click:', err);
    }
  };

  // Render notification icon based on type
  const renderNotificationIcon = (type) => {
    switch (type) {
      case 'application_update':
        return (
          <div className="flex-shrink-0 rounded-full p-3 bg-blue-100 text-blue-600">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          </div>
        );
      
      case 'interview_scheduled':
        return (
          <div className="flex-shrink-0 rounded-full p-3 bg-green-100 text-green-600">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
              />
            </svg>
          </div>
        );
      
      case 'interview_updated':
        return (
          <div className="flex-shrink-0 rounded-full p-3 bg-yellow-100 text-yellow-600">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          </div>
        );
      
      case 'interview_cancelled':
        return (
          <div className="flex-shrink-0 rounded-full p-3 bg-red-100 text-red-600">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          </div>
        );
      
      case 'job_applied':
        return (
          <div className="flex-shrink-0 rounded-full p-3 bg-purple-100 text-purple-600">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" 
              />
            </svg>
          </div>
        );
      
      default:
        return (
          <div className="flex-shrink-0 rounded-full p-3 bg-gray-100 text-gray-600">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-5 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
        <p className="text-gray-600">
          Stay updated on your job applications and interviews
        </p>
      </div>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => handleTabChange('all')}
            className={`flex-1 py-3 px-4 text-center font-medium text-sm transition-colors duration-200 focus:outline-none ${
              activeTab === 'all'
                ? 'text-blue-600 border-b-2 border-blue-500'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            All Notifications
          </button>
          <button
            onClick={() => handleTabChange('unread')}
            className={`flex-1 py-3 px-4 text-center font-medium text-sm transition-colors duration-200 focus:outline-none ${
              activeTab === 'unread'
                ? 'text-blue-600 border-b-2 border-blue-500'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Unread
          </button>
        </div>
        
        {/* Actions */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <div>
            <span className="text-sm text-gray-600">
              {activeTab === 'all' ? 'All notifications' : 'Unread notifications'}
            </span>
          </div>
          <div>
            {notifications.some(n => !n.is_read) && (
              <button
                onClick={handleMarkAllAsRead}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
              >
                Mark all as read
              </button>
            )}
          </div>
        </div>
        
        {/* Notifications List */}
        <div>
          {loading && page === 1 ? (
            <div className="p-8 text-center text-gray-500">
              <svg 
                className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-2" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24"
              >
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                ></circle>
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <p>Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <svg 
                className="h-12 w-12 text-gray-400 mx-auto mb-3" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
                />
              </svg>
              <p className="text-lg font-medium">No notifications</p>
              <p className="mt-1">
                {activeTab === 'all' 
                  ? "You don't have any notifications yet" 
                  : "You've read all your notifications"}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {notifications.map(notification => (
                <li 
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 flex items-start space-x-4 cursor-pointer transition-colors duration-200 ${
                    notification.is_read ? 'bg-white' : 'bg-blue-50'
                  } hover:bg-gray-50`}
                >
                  {renderNotificationIcon(notification.notification_type)}
                  
                  <div className="flex-1 min-w-0">
                    <p className={`text-base font-medium ${notification.is_read ? 'text-gray-800' : 'text-blue-800'}`}>
                      {notification.title}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                  
                  {!notification.is_read && (
                    <span className="flex-shrink-0 h-3 w-3 bg-blue-600 rounded-full"></span>
                  )}
                </li>
              ))}
            </ul>
          )}
          
          {/* Load More */}
          {hasMore && notifications.length > 0 && (
            <div className="p-4 flex justify-center">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
              >
                {loading && page > 1 ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;