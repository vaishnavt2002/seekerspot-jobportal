import axiosInstance from './axiosInstance';

const reportApi = {
  getJobPostReport: async (params = {}) => {
    try {
      const response = await axiosInstance.get('/reports/job-posts/', { params });
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch job post report');
    }
  },

  getUserReport: async (params = {}) => {
    try {
      const response = await axiosInstance.get('/reports/users/', { params });
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch user report');
    }
  },

  getApplicationReport: async (params = {}) => {
    try {
      const response = await axiosInstance.get('/reports/applications/', { params });
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch application report');
    }
  },

  getInterviewReport: async (params = {}) => {
    try {
      const response = await axiosInstance.get('/reports/interviews/', { params });
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch interview report');
    }
  },
};

export default reportApi;