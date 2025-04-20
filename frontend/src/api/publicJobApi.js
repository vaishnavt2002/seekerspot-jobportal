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
   // Get skills of the logged-in user
   getUserSkills: async () => {
    try {
      const response = await axiosInstance.get('/jobseeker/skills/');
      // Check if the response is valid
      if (response && response.data) {
        console.log("Skills API response:", response.data);
        return response.data;
      }
      return [];
    } catch (error) {
      console.error("Error in getUserSkills:", error);
      // If there's an error, return an empty array
      return [];
    }
  },
  
  // Add skills to user profile
  addSkillsToProfile: async (skillIds) => {
    try {
      const response = await axiosInstance.post('/jobseeker/skills/add/', { 
        skill_ids: skillIds 
      });
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  // Apply for a job
  applyForJob: async (jobId) => {
    try {
      const response = await axiosInstance.post('/jobseeker/apply/', {
        jobpost_id: jobId  // Using jobpost_id to match backend
      });
      return response;
    } catch (error) {
      console.error("Error applying for job:", error);
      throw error;
    }
  },
  
  // Check application status
  checkApplicationStatus: async (jobId) => {
    try {
      const response = await axiosInstance.get(`/jobseeker/application-status/${jobId}/`);
      return response;
    } catch (error) {
      console.error("Error checking application status:", error);
      return { status: "NOT_APPLIED" }; 
    }
  }
};

export default publicJobApi;