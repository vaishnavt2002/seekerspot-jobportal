import axiosInstance from './axiosInstance';

const jobProviderApi = {
  // Get dashboard overview statistics
  getDashboardStats: async (period = 30) => {
    try {
      const response = await axiosInstance.get('/analytics/provider/dashboard-stats/', { 
        params: { period }
      });
      return response;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch dashboard statistics');
    }
  },

  // Get job post activity data over time
  getJobActivity: async (interval = 'month', months = 12) => {
    try {
      const response = await axiosInstance.get('/analytics/provider/job-activity/', { 
        params: { interval, months }
      });
      return response;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch job activity data');
    }
  },

  // Get application analytics
  getApplicationAnalytics: async () => {
    try {
      const response = await axiosInstance.get('/analytics/provider/application-analytics/');
      return response;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch application analytics');
    }
  },

  // Get upcoming interviews
  getUpcomingInterviews: async () => {
    try {
      const response = await axiosInstance.get('/analytics/provider/upcoming-interviews/');
      return response;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch upcoming interviews');
    }
  },
};

export default jobProviderApi;