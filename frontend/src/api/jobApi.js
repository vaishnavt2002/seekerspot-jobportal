import axiosInstance from './axiosInstance';

const jobApi = {
  getJobPosts: async (params = {}) => {
    try {
      const response = await axiosInstance.get('/job-posts/', { params });
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch job posts');
    }
  },

  getJobPost: async (id) => {
    try {
      const response = await axiosInstance.get(`/job-posts/${id}/`);
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch job post');
    }
  },

  createJobPost: async (jobData) => {
    try {
      const response = await axiosInstance.post('/job-posts/', jobData);
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to create job post');
    }
  },

  updateJobPost: async (id, jobData) => {
    try {
      const response = await axiosInstance.put(`/job-posts/${id}/`, jobData);
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to update job post');
    }
  },

  deleteJobPost: async (id) => {
    try {
      const response = await axiosInstance.delete(`/job-posts/${id}/`);
      return response;
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
  getJobSeekerInterviews: async () => {
    try {
      const response = await axiosInstance.get('/job-seeker/interviews/');
      return response;
    } catch (error) {
      console.error('Job seeker interviews fetch error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || error.message || 'Failed to fetch job seeker interviews');
    }
  },
  getJobSeekerApplications: async () => {
    try {
      const response = await axiosInstance.get('/job-seeker/applications/');
      return response;
    } catch (error) {
      console.error('Job seeker applications fetch error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || error.message || 'Failed to fetch job seeker applications');
    }
  },
  // Add to the existing jobApi object
getJobQuestions: async (jobId) => {
  try {
    const response = await axiosInstance.get(`/job-posts/${jobId}/questions/`);
    return response;
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch job questions');
  }
},

submitQuestionAnswers: async (applicationId, answersData) => {
  try {
    const response = await axiosInstance.post(`/applications/${applicationId}/answers/`, answersData);
    return response;
  } catch (error) {
    throw new Error(error.message || 'Failed to submit answers');
  }
},
};

export default jobApi;