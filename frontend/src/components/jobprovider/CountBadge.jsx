import React from 'react';
import { useNotifications } from '../../context/NotificationContext';

const NotificationBadge = () => {
  const { unreadCount } = useNotifications();
  
  if (unreadCount <= 0) return null;
  
  return (
    <span className="bg-red-500 ml-3 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  );
};

export default NotificationBadge;