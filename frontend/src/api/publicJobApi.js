import axiosInstance from "./axiosInstance";

const publicJobApi = {
  getPublicJobPosts: async (params = {}) => {
    try {
      return await axiosInstance.get("/public/job-posts/", { params });
    } catch (error) {
      throw error; // Let the component handle the error
    }
  },
};

export default publicJobApi;