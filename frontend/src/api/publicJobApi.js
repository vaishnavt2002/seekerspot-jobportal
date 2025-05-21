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
    try {
      const response = await axiosInstance.get(`/public/jobs/${jobId}/`);
      return response;
    } catch (error) {
      console.error("Error getting job details:", error);
      throw error;
    }
  },
  
  // Get skills of the logged-in user
  getUserSkills: async () => {
    try {
      const response = await axiosInstance.get('/jobseeker/skills/');
      console.log("Skills API response:", response);
      return response || [];
    } catch (error) {
      console.error("Error in getUserSkills:", error);
      return [];
    }
  },
  
  // Add skills to user profile
  addSkillsToProfile: async (skillIds) => {
    try {
      if (!skillIds || skillIds.length === 0) {
        return await publicJobApi.getUserSkills();
      }
      
      const response = await axiosInstance.post('/jobseeker/skills/add/', { 
        skill_ids: skillIds 
      });
      
      return response;
    } catch (error) {
      console.error("Error adding skills:", error);
      throw error;
    }
  },
  
  // Apply for a job with question answers
  applyForJob: async (jobId, answers = []) => {
    try {
      const response = await axiosInstance.post('/jobseeker/apply/', {
        jobpost_id: jobId,
        answers: answers
      });
      return response;
    } catch (error) {
      // Better error handling with specific messages
      if (error.fieldErrors && error.fieldErrors.error) {
        throw new Error(error.fieldErrors.error);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error("Failed to apply for the job. Please try again.");
      }
    }
  },
  
  // Check application status
  checkApplicationStatus: async (jobId) => {
    try {
      const response = await axiosInstance.get(`/jobseeker/application-status/${jobId}/`);
      return response;
    } catch (error) {
      console.error("Error checking application status:", error);
      // Default status if error occurs
      return { status: "NOT_APPLIED" }; 
    }
  },
  
  // Save a job
  saveJob: async (jobId) => {
    try {
      const response = await axiosInstance.post('/jobseeker/saved-jobs/save/', {
        jobpost_id: jobId
      });
      return response;
    } catch (error) {
      console.error("Error saving job:", error);
      throw error;
    }
  },
  
  // Unsave a job
  unsaveJob: async (jobId) => {
    try {
      const response = await axiosInstance.delete(`/jobseeker/saved-jobs/${jobId}/`);
      return response;
    } catch (error) {
      console.error("Error unsaving job:", error);
      throw error;
    }
  },
  
  // Check if a job is saved
  checkSavedStatus: async (jobId) => {
    try {
      const response = await axiosInstance.get(`/jobseeker/saved-jobs/status/${jobId}/`);
      return response;
    } catch (error) {
      console.error("Error checking saved status:", error);
      // Default not saved if error occurs
      return { is_saved: false };
    }
  }
};

export default publicJobApi;