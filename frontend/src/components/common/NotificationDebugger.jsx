// components/common/NotificationDebugger.jsx
import React, { useEffect, useState } from 'react';
import notificationSocketService from '../../services/notificationSocketService';
import { useNotifications } from '../../context/NotificationContext';

const NotificationDebugger = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [status, setStatus] = useState('');
  const [logs, setLogs] = useState([]);
  const { isSocketConnected, unreadCount } = useNotifications();

  useEffect(() => {
    const checkStatus = () => {
      setStatus(notificationSocketService.getStatus());
    };
    
    const timer = setInterval(checkStatus, 1000);
    checkStatus();
    
    return () => clearInterval(timer);
  }, []);

  const addLog = (message) => {
    const timestamp = new Date().toISOString().substr(11, 8);
    setLogs(prevLogs => [`[${timestamp}] ${message}`, ...prevLogs.slice(0, 19)]);
  };

  const handleForceReconnect = () => {
    addLog('Forcing reconnection...');
    notificationSocketService.disconnect();
    setTimeout(() => {
      notificationSocketService.connect();
    }, 500);
  };

  const handleSendTestMessage = () => {
    addLog('Sending test message...');
    const success = notificationSocketService.sendMessage({
      type: 'test',
      message: 'Test message from debugger'
    });
    addLog(`Test message sent: ${success ? 'success' : 'failed'}`);
  };

  if (!isVisible) {
    return (
      <button 
        onClick={() => setIsVisible(true)} 
        className="fixed bottom-2 right-2 bg-gray-200 text-gray-700 p-1 text-xs rounded-md opacity-50 hover:opacity-100"
      >
        Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-2 right-2 w-80 bg-white shadow-lg rounded-md border border-gray-300 p-2 text-xs z-50">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-sm">Notification Debugger</h3>
        <button 
          onClick={() => setIsVisible(false)} 
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      
      <div className="mb-2 border-b pb-1">
        <div className="flex justify-between">
          <span>Status:</span>
          <span className={status === 'CONNECTED' ? 'text-green-600' : 'text-red-600'}>
            {status}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Context Connected:</span>
          <span className={isSocketConnected ? 'text-green-600' : 'text-red-600'}>
            {isSocketConnected ? 'Yes' : 'No'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Unread Count:</span>
          <span>{unreadCount}</span>
        </div>
      </div>
      
      <div className="mb-2 flex space-x-2">
        <button
          onClick={handleForceReconnect}
          className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs flex-1"
        >
          Force Reconnect
        </button>
        <button
          onClick={handleSendTestMessage}
          className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs flex-1"
        >
          Send Test Message
        </button>
      </div>
      
      <div className="h-40 overflow-y-auto bg-gray-100 p-1 rounded">
        {logs.length === 0 ? (
          <div className="text-gray-500 text-center italic">No logs yet</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="text-gray-700 whitespace-pre-wrap">{log}</div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationDebugger;