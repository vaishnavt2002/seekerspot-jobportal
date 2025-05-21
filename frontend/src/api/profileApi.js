import axiosInstance from './axiosInstance';

const profileApi = {
  //work experience methods
  getWorkExperiences: async () => {
    try {
      const response = await axiosInstance.get('/profile/work-experiences/');
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch work experiences.');
    }
  },

  createWorkExperience: async (data) => {
    try {
      const response = await axiosInstance.post('/profile/work-experiences/', data);
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to add work experience.');
    }
  },

  updateWorkExperience: async (id, data) => {
    try {
      const response = await axiosInstance.put(`/profile/work-experiences/${id}/`, data);
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to update work experience.');
    }
  },

  deleteWorkExperience: async (id) => {
    try {
      const response = await axiosInstance.delete(`/profile/work-experiences/${id}/`);
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to delete work experience.');
    }
  },

  getEducations: async () => {
    try {
      const response = await axiosInstance.get('/profile/educations/');
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch educations.');
    }
  },

  createEducation: async (data) => {
    try {
      const response = await axiosInstance.post('/profile/educations/', data);
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to add education.');
    }
  },

  updateEducation: async (id, data) => {
    try {
      const response = await axiosInstance.put(`/profile/educations/${id}/`, data);
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to update education.');
    }
  },

  deleteEducation: async (id) => {
    try {
      const response = await axiosInstance.delete(`/profile/educations/${id}/`);
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to delete education.');
    }
  },
  // Personal Details Methods
  getPersonalDetails: async () => {
    try {
      const response = await axiosInstance.get('/profile/personal-details/');
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch personal details.');
    }
  },

  updatePersonalDetails: async (data) => {
    try {
      const response = await axiosInstance.put('/profile/personal-details/', data);
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to update personal details.');
    }
  },
  // Profile Picture Methods
  updateProfilePicture: async (file) => {
    try {
      const formData = new FormData();
      formData.append('profile_picture', file);
      const response = await axiosInstance.put('/profile/profile-picture/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response;
    } catch (error) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to upload profile picture.');
    }
  },

  deleteProfilePicture: async () => {
    try {
      const response = await axiosInstance.delete('/profile/profile-picture/');
      return response;
    } catch (error) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to remove profile picture.');
    }
  },

  //Job Provider Profile
  getJobProviderProfile: async () => {
    try {
      const response = await axiosInstance.get('/profile/job-provider-profile/');
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch job provider profile.');
    }
  },

  updateJobProviderProfile: async (data) => {
  try {
    const response = await axiosInstance.put('/profile/job-provider-profile/', data, {
      headers: { 'Content-Type': 'multipart/form-data' }, // Add this line
    });
    return response;
  } catch (error) {
    throw new Error(error.message || 'Failed to update job provider profile.');
  }
},
  getJobSeekerSkills: async () => {
    try {
      const response = await axiosInstance.get('/profile/skills/');
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch skills');
    }
  },

  // Renamed to indicate single skill addition
  addJobSeekerSkill: async (data) => {
    try {
      const response = await axiosInstance.post('/profile/skills/', { skill_id: data.skill_id });
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to add skill');
    }
  },

  // New method for adding multiple skills at once
  addJobSeekerSkills: async (data) => {
    try {
      const response = await axiosInstance.post('/profile/skills/', data);
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to add skills');
    }
  },

  deleteJobSeekerSkill: async (skillId) => {
    try {
      const response = await axiosInstance.delete(`/profile/skills/${skillId}/`);
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to delete skill');
    }
  },

  searchSkills: async (query) => {
    try {
      const response = await axiosInstance.get('/profile/skills/search/', {params: { query }});
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to search skills');
    }
  },
  getSavedJobs: async () => {
    try {
      const response = await axiosInstance.get('profile/saved-jobs/');
      return response;
    }catch (error){
      throw new Error(error.message || 'Failed to fetch saved jobs');
    }
  },
  deleteSavedJob: async (jobId) => {
    try {
      const response = await axiosInstance.delete(`profile/saved-jobs/${jobId}/`);
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to delete saved job');
    }
  },
  getResume: async () => {
  try {
    const response = await axiosInstance.get('/profile/resume/');
    return response;
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch resume.');
  }
},

uploadResume: async (file) => {
  try {
    const formData = new FormData();
    formData.append('resume', file);
    const response = await axiosInstance.put('/profile/resume/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.error || error.message || 'Failed to upload resume.');
  }
},

deleteResume: async () => {
  try {
    const response = await axiosInstance.delete('/profile/resume/');
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.error || error.message || 'Failed to delete resume.');
  }
},
};

export default profileApi;