import React, { useState, useEffect } from 'react';
import profileApi from '../../api/profileApi';

const Experience = () => {
  const [experiences, setExperiences] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentExperience, setCurrentExperience] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    start_date: '',
    end_date: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  
  useEffect(() => {
    fetchExperiences();
  }, []);
  
  const fetchExperiences = async () => {
    setLoading(true);
    try {
      const data = await profileApi.getWorkExperiences();
      setExperiences(data);
      setError(null);
    } catch (err) {
      if (err.message.includes('Job seeker profile not found')) {
        setError('Please complete your job seeker profile to view experiences.');
      } else {
        setError(err.message);
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear validation error when user types
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };
  
  const resetForm = () => {
    setFormData({
      title: '',
      company: '',
      location: '',
      start_date: '',
      end_date: '',
      description: '',
    });
    setCurrentExperience(null);
    setValidationErrors({});
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.title || formData.title.length < 3) {
      errors.title = 'Job title must be at least 3 characters';
    }
    
    if (!formData.company || formData.company.length < 3) {
      errors.company = 'Company name must be at least 3 characters';
    }
    
    if (!formData.location || formData.location.length < 2) {
      errors.location = 'Location must be at least 2 characters';
    }
    
    if (formData.start_date && formData.end_date && new Date(formData.start_date) > new Date(formData.end_date)) {
      errors.end_date = 'End date must be after start date';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddExperience = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      await profileApi.createWorkExperience(formData);
      setIsAddModalOpen(false);
      resetForm();
      fetchExperiences();
      setError(null);
    } catch (err) {
      setError('Failed to add experience.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditExperience = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      await profileApi.updateWorkExperience(currentExperience.id, formData);
      setIsEditModalOpen(false);
      resetForm();
      fetchExperiences();
      setError(null);
    } catch (err) {
      setError('Failed to update experience.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExperience = async () => {
    if (!deleteId) return;
    
    setLoading(true);
    try {
      await profileApi.deleteWorkExperience(deleteId);
      setDeleteId(null);
      fetchExperiences();
      setError(null);
    } catch (err) {
      setError('Failed to delete experience.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (exp) => {
    setCurrentExperience(exp);
    setFormData({
      title: exp.title,
      company: exp.company,
      location: exp.location,
      start_date: exp.start_date,
      end_date: exp.end_date || '',
      description: exp.description || '',
    });
    setIsEditModalOpen(true);
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-blue-700 border-b pb-2">Experience</h2>
        <button
          onClick={() => { resetForm(); setIsAddModalOpen(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
        >
          Add Experience
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && experiences.length === 0 && <p>No experiences found.</p>}

      <div className="space-y-6">
        {experiences.map((exp) => (
          <div
            key={exp.id}
            className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-lg transition duration-200"
          >
            <div className="flex justify-between mb-2">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{exp.title}</h3>
                <p className="text-gray-600">{exp.company}</p>
                <p className="text-gray-500">{exp.location}</p>
                <p className="text-gray-500">
                  {exp.start_date} - {exp.end_date || 'Present'}
                </p>
                <p className="text-gray-700 mt-2">{exp.description}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEditModal(exp)}
                  className="bg-yellow-500 text-white px-3 py-1 rounded-md hover:bg-yellow-600 transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeleteId(exp.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Experience Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl max-w-lg w-full">
            <h3 className="text-xl font-bold mb-4">Add Experience</h3>
            <form onSubmit={handleAddExperience}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Job Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className={`w-full mt-1 px-3 py-2 border ${validationErrors.title ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                />
                {validationErrors.title && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.title}</p>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Company</label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  required
                  className={`w-full mt-1 px-3 py-2 border ${validationErrors.company ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                />
                {validationErrors.company && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.company}</p>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                  className={`w-full mt-1 px-3 py-2 border ${validationErrors.location ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                />
                {validationErrors.location && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.location}</p>
                )}
              </div>
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">Start Date</label>
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    required
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">End Date</label>
                  <input
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    className={`w-full mt-1 px-3 py-2 border ${validationErrors.end_date ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                  />
                  {validationErrors.end_date && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.end_date}</p>
                  )}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                ></textarea>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Experience Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl max-w-lg w-full">
            <h3 className="text-xl font-bold mb-4">Edit Experience</h3>
            <form onSubmit={handleEditExperience}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Job Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className={`w-full mt-1 px-3 py-2 border ${validationErrors.title ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                />
                {validationErrors.title && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.title}</p>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Company</label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  required
                  className={`w-full mt-1 px-3 py-2 border ${validationErrors.company ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                />
                {validationErrors.company && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.company}</p>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                  className={`w-full mt-1 px-3 py-2 border ${validationErrors.location ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                />
                {validationErrors.location && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.location}</p>
                )}
              </div>
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">Start Date</label>
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    required
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">End Date</label>
                  <input
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    className={`w-full mt-1 px-3 py-2 border ${validationErrors.end_date ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                  />
                  {validationErrors.end_date && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.end_date}</p>
                  )}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                ></textarea>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-2">Confirm Deletion</h3>
            <p className="mb-4 text-gray-600">Are you sure you want to delete this experience? This action cannot be undone.</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteExperience}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Experience;