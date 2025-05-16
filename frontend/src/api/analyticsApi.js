import axiosInstance from './axiosInstance';

const analyticsApi = {
  // Get dashboard overview statistics
  getDashboardStats: async (period = 30) => {
    try {
      const response = await axiosInstance.get('/analytics/dashboard-stats/', { 
        params: { period }
      });
      return response;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch dashboard statistics');
    }
  },

  // Get user growth data over time
  getUserGrowth: async (interval = 'month', months = 12) => {
    try {
      const response = await axiosInstance.get('/analytics/user-growth/', { 
        params: { interval, months }
      });
      return response;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch user growth data');
    }
  },

  // Get job post analytics
  getJobPostAnalytics: async (months = 12) => {
    try {
      const response = await axiosInstance.get('/analytics/job-post-analytics/', { 
        params: { months }
      });
      return response;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch job post analytics');
    }
  },

  // Get application analytics
  getApplicationAnalytics: async (months = 12) => {
    try {
      const response = await axiosInstance.get('/analytics/application-analytics/', { 
        params: { months }
      });
      return response;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch application analytics');
    }
  },
 
};

export default analyticsApi;