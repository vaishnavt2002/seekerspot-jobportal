import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import NotificationPanel from './NotificationPanel';
import notificationSocketService from '../../services/notificationSocketService';

const NotificationIcon = () => {
  const [showPanel, setShowPanel] = useState(false);
  const { unreadCount, isSocketConnected } = useNotifications();

  console.log('NotificationIcon rendering with unreadCount:', unreadCount, 'isSocketConnected:', isSocketConnected);

  // Ensure socket reconnection when tab becomes active
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Tab became visible, checking notification connection...');
        if (notificationSocketService.getStatus() !== 'CONNECTED') {
          console.log('Reconnecting notification socket on tab focus');
          notificationSocketService.connect();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const togglePanel = () => {
    setShowPanel(prev => !prev);
  };

  const closePanel = () => {
    setShowPanel(false);
  };

  return (
    <div className="relative">
      <button
        onClick={togglePanel}
        className="relative p-2 text-gray-600 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded-md"
        aria-label="Notifications"
      >
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
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
          />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {/* Connection status indicator */}
        <span 
          className={`absolute bottom-0 right-0 h-2 w-2 rounded-full ${
            isSocketConnected ? 'bg-green-500' : 'bg-gray-500'
          }`}
          title={isSocketConnected ? 'Connected' : 'Disconnected'}
        ></span>
      </button>

      {showPanel && (
        <NotificationPanel onClose={closePanel} />
      )}
    </div>
  );
};

export default NotificationIcon;