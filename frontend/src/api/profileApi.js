import axiosInstance from './axiosInstance';

const profileApi = {
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
};

export default profileApi;