import axios from 'axios';

// Get the API base URL from environment variables or use empty string
const API_URL = import.meta.env.VITE_API_URL || '';

const notificationApi = {
  /**
   * Get notifications for the current user
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - Paginated notifications
   */
  async getNotifications(params = {}) {
    try {
      console.log('Fetching notifications with params:', params);
      const response = await axios.get(`${API_URL}/notifications/`, {
        params,
        withCredentials: true,
      });
      console.log('Notifications response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      if (error.response && error.response.status === 401) {
        console.error('Authentication failed when fetching notifications');
      }
      throw error;
    }
  },

  /**
   * Mark a notification as read
   * @param {string} notificationId - ID of notification to mark as read
   * @returns {Promise<Object>} - Updated notification
   */
  async markAsRead(notificationId) {
    try {
      console.log('Marking notification as read:', notificationId);
      const response = await axios.post(
        `${API_URL}/notifications/mark-read/${notificationId}/`,
        {},
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      console.error(`Error marking notification ${notificationId} as read:`, error);
      throw error;
    }
  },

  /**
   * Mark all notifications as read for the current user
   * @returns {Promise<Object>} - Response message
   */
  async markAllAsRead() {
    try {
      console.log('Marking all notifications as read');
      const response = await axios.post(
        `${API_URL}/notifications/mark-all-read/`,
        {},
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  /**
   * Get count of unread notifications
   * @returns {Promise<Object>} - Response with unread_count
   */
  async getUnreadCount() {
    try {
      console.log('Fetching unread notification count');
      const response = await axios.get(`${API_URL}/notifications/count/`, {
        withCredentials: true,
      });
      console.log('Unread count response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching unread notification count:', error);
      // Return 0 as the count on error to avoid UI issues
      return { unread_count: 0 };
    }
  },
};

export default notificationApi;