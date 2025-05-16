import axiosInstance from './axiosInstance';

const userManagementApi = {
  //Job Seeker Management Api
  getJobSeekers: async (params = {}) => {
    try {
      const response = await axiosInstance.get('/admin/job-seekers/', { params });
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch job seekers');
    }
  },

  getJobSeeker: async (id) => {
    try {
      const response = await axiosInstance.get(`/admin/job-seekers/${id}/`);
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch job seeker');
    }
  },

  blockJobSeeker: async (id, isBlocked) => {
    try {
      const response = await axiosInstance.patch(`/admin/job-seekers/${id}/block/`, { is_active: !isBlocked });
      return response;
    } catch (error) {
      throw new Error(error.message || `Failed to ${isBlocked ? 'unblock' : 'block'} job seeker`);
    }
  },
  //Job Provider Management Api
  getJobProviders: async (params = {}) => {
    try {
      const response = await axiosInstance.get('/admin/job-providers/', { params });
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch job providers');
    }
  },

  getJobProvider: async (id) => {
    try {
      const response = await axiosInstance.get(`/admin/job-providers/${id}/`);
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch job provider');
    }
  },

  blockJobProvider: async (id, isBlocked) => {
    try {
      const response = await axiosInstance.patch(`/admin/job-providers/${id}/block/`, { is_active: !isBlocked });
      return response;
    } catch (error) {
      throw new Error(error.message || `Failed to ${isBlocked ? 'unblock' : 'block'} job provider`);
    }
  },
  verifyJobProvider: async (id) => {
    try {
      const response = await axiosInstance.patch(`/admin/job-providers/${id}/verify/`);
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to verify job provider');
    }
  },
};

export default userManagementApi;