import axiosInstance from './axiosInstance';

const jobApi = {
  getJobPosts: async () => {
    try {
      return await axiosInstance.get('/job-posts/');
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch job posts');
    }
  },

  getJobPost: async (id) => {
    try {
      return await axiosInstance.get(`/job-posts/${id}/`);
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch job post');
    }
  },

  createJobPost: async (jobData) => {
    try {
      return await axiosInstance.post('/job-posts/', jobData);
    } catch (error) {
      throw new Error(error.message || 'Failed to create job post');
    }
  },

  updateJobPost: async (id, jobData) => {
    try {
      return await axiosInstance.put(`/job-posts/${id}/`, jobData);
    } catch (error) {
      throw new Error(error.message || 'Failed to update job post');
    }
  },

  deleteJobPost: async (id) => {
    try {
      return await axiosInstance.delete(`/job-posts/${id}/`);
    } catch (error) {
      throw new Error(error.message || 'Failed to delete job post');
    }
  },
};

export default jobApi;
