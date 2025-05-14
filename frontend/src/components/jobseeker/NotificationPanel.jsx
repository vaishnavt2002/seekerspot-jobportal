import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import NotificationItem from './NotificatonItem';

const NotificationPanel = ({ onClose }) => {
  const { notifications, unreadCount, loading, markAllAsRead, loadMoreNotifications } = useNotifications();
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const panelRef = useRef(null);
  const navigate = useNavigate();
  
  console.log('NotificationPanel rendering with:', { notifications, unreadCount, loading });
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    
    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const response = await loadMoreNotifications(nextPage);
      
      // Check if we have more pages
      if (!response.next) {
        setHasMore(false);
      }
      
      setPage(nextPage);
    } catch (error) {
      console.error('Error loading more notifications:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleViewAll = () => {
    navigate('/notifications');
    onClose();
  };

  // Modified to always navigate to notifications page
  const handleNotificationAction = (notification) => {
    // Always navigate to the notifications page when clicking any notification
    navigate('/notifications');
    onClose();
  };

  return (
    <div 
      ref={panelRef}
      className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
      style={{ maxHeight: 'calc(100vh - 100px)' }}
    >
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
        <div className="flex space-x-2">
          {unreadCount > 0 && (
            <button 
              onClick={handleMarkAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Mark all read
            </button>
          )}
          <button 
            onClick={handleViewAll}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            View all
          </button>
        </div>
      </div>
      
      <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
        {loading && notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No notifications yet
          </div>
        ) : (
          <>
            {notifications.map(notification => (
              <NotificationItem 
                key={notification.id} 
                notification={notification}
                onAction={() => handleNotificationAction(notification)}
              />
            ))}
            
            {hasMore && (
              <div className="p-2 text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                >
                  {loadingMore ? 'Loading...' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;