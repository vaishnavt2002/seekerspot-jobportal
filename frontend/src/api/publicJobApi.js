import axiosInstance from "./axiosInstance";

const publicJobApi = {
  getPublicJobPosts: async (params = {}) => {
    try {
      return await axiosInstance.get("/public/job-posts/", { params });
    } catch (error) {
      throw error; 
    }
  },
  getPublicJobPostById: async (jobId) => {
    const response = await axiosInstance.get(`/public/jobs/${jobId}/`);
    return response;
  },
};

export default publicJobApi;