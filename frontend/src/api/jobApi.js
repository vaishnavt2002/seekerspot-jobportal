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
  searchSkills: async (query) => {
    try {
      const response = await axiosInstance.get(`/skills/search/?query=${query}`);
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to search skills');
    }
  },
  getJobPostsList: async () => {
    try {
      const response = await axiosInstance.get('/job-posts-list/');
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch job posts list');
    }
  },

  getJobPostDetails: async (id) => {
    try {
      const response = await axiosInstance.get(`/job-posts-list/${id}/`);
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch job post details');
    }
  },

  getJobPostApplicants: async (id) => {
    try {
      const response = await axiosInstance.get(`/job-posts-list/${id}/applicants/`);
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch job post applicants');
    }
  },

  updateApplicationStatus: async (applicationId, statusData) => {
    try {
      const response = await axiosInstance.patch(`/applications/${applicationId}/`, statusData);
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to update application status');
    }
  },
  getShortlistedApplicants: async (id) => {
    try {
      const response = await axiosInstance.get(`/job-posts-list/${id}/shortlisted/`);
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch shortlisted applicants');
    }
  },

  // Fixed interview API calls to match backend routes
  createInterviewSchedule: async (interviewData) => {
    try {
      const response = await axiosInstance.post('/interviews/', interviewData);
      return response;
    } catch (error) {
      console.error('Interview creation error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || error.message || 'Failed to create interview schedule');
    }
  },

  updateInterviewSchedule: async (interviewId, interviewData) => {
    try {
      const response = await axiosInstance.patch(`/interviews/${interviewId}/`, interviewData);
      return response;
    } catch (error) {
      console.error('Interview update error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || error.message || 'Failed to update interview schedule');
    }
  },

  cancelInterviewSchedule: async (interviewId) => {
    try {
      const response = await axiosInstance.post(`/interviews/${interviewId}/cancel/`);
      return response;
    } catch (error) {
      console.error('Interview cancellation error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || error.message || 'Failed to cancel interview schedule');
    }
  },

  completeInterviewSchedule: async (interviewId) => {
    try {
      const response = await axiosInstance.post(`/interviews/${interviewId}/complete/`);
      return response;
    } catch (error) {
      console.error('Interview completion error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || error.message || 'Failed to complete interview schedule');
    }
  },
};

export default jobApi;