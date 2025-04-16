import React, { useState, useEffect } from 'react';
import profileApi from '../../api/profileApi';

const Education = () => {
  const [educations, setEducations] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentEducation, setCurrentEducation] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [formData, setFormData] = useState({
    institution: '',
    degree: '',
    field_of_study: '',
    start_date: '',
    end_date: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // Fetch educations on mount
  useEffect(() => {
    fetchEducations();
  }, []);

  const fetchEducations = async () => {
    setLoading(true);
    try {
      const data = await profileApi.getEducations();
      setEducations(data);
      setError(null);
    } catch (err) {
      if (err.message.includes('Job seeker profile not found')) {
        setError('Please complete your job seeker profile to manage educations.');
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

  const validateForm = () => {
    const errors = {};
    
    if (!formData.institution || formData.institution.length < 3) {
      errors.institution = 'Institution must be at least 3 characters';
    }
    
    if (!formData.degree || formData.degree.length < 2) {
      errors.degree = 'Degree must be at least 2 characters';
    }
    
    if (formData.start_date && formData.end_date && new Date(formData.start_date) > new Date(formData.end_date)) {
      errors.end_date = 'End date must be after start date';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddEducation = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      await profileApi.createEducation(formData);
      setIsAddModalOpen(false);
      resetForm();
      fetchEducations();
      setError(null);
    } catch (err) {
      if (err.message.includes('Job seeker profile not found')) {
        setError('Please complete your job seeker profile to add educations.');
      } else {
        setError(err.message);
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditEducation = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      await profileApi.updateEducation(currentEducation.id, formData);
      setIsEditModalOpen(false);
      resetForm();
      fetchEducations();
      setError(null);
    } catch (err) {
      if (err.message.includes('Job seeker profile not found')) {
        setError('Please complete your job seeker profile to edit educations.');
      } else {
        setError(err.message);
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEducation = async () => {
    if (!deleteId) return;
    
    setLoading(true);
    try {
      await profileApi.deleteEducation(deleteId);
      setDeleteId(null);
      fetchEducations();
      setError(null);
    } catch (err) {
      if (err.message.includes('Job seeker profile not found')) {
        setError('Please complete your job seeker profile to delete educations.');
      } else {
        setError(err.message);
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (edu) => {
    setCurrentEducation(edu);
    setFormData({
      institution: edu.institution,
      degree: edu.degree,
      field_of_study: edu.field_of_study,
      start_date: edu.start_date,
      end_date: edu.end_date || '',
      description: edu.description || '',
    });
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      institution: '',
      degree: '',
      field_of_study: '',
      start_date: '',
      end_date: '',
      description: '',
    });
    setCurrentEducation(null);
    setValidationErrors({});
  };

  return (
    <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-2xl shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-green-700 border-b pb-2">Education</h2>
        <button
          onClick={() => { resetForm(); setIsAddModalOpen(true); }}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
        >
          Add Education
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && educations.length === 0 && <p>No education entries found.</p>}

      <div className="space-y-6">
        {educations.map((edu) => (
          <div
            key={edu.id}
            className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-lg transition duration-200"
          >
            <div className="flex justify-between mb-2">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{edu.degree}</h3>
                <p className="text-gray-600">{edu.institution}</p>
                <p className="text-gray-500">{edu.field_of_study}</p>
                <p className="text-gray-500">
                  {edu.start_date} - {edu.end_date || 'Present'}
                </p>
                {edu.description && <p className="text-gray-700 mt-2">{edu.description}</p>}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEditModal(edu)}
                  className="bg-yellow-500 text-white px-3 py-1 rounded-md hover:bg-yellow-600 transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeleteId(edu.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Education Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl max-w-lg w-full">
            <h3 className="text-xl font-bold mb-4">Add Education</h3>
            <form onSubmit={handleAddEducation}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Institution</label>
                <input
                  type="text"
                  name="institution"
                  value={formData.institution}
                  onChange={handleInputChange}
                  required
                  className={`w-full mt-1 px-3 py-2 border ${validationErrors.institution ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                />
                {validationErrors.institution && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.institution}</p>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Degree</label>
                <input
                  type="text"
                  name="degree"
                  value={formData.degree}
                  onChange={handleInputChange}
                  required
                  className={`w-full mt-1 px-3 py-2 border ${validationErrors.degree ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                />
                {validationErrors.degree && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.degree}</p>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Field of Study</label>
                <input
                  type="text"
                  name="field_of_study"
                  value={formData.field_of_study}
                  onChange={handleInputChange}
                  required
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                />
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
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Education Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl max-w-lg w-full">
            <h3 className="text-xl font-bold mb-4">Edit Education</h3>
            <form onSubmit={handleEditEducation}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Institution</label>
                <input
                  type="text"
                  name="institution"
                  value={formData.institution}
                  onChange={handleInputChange}
                  required
                  className={`w-full mt-1 px-3 py-2 border ${validationErrors.institution ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                />
                {validationErrors.institution && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.institution}</p>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Degree</label>
                <input
                  type="text"
                  name="degree"
                  value={formData.degree}
                  onChange={handleInputChange}
                  required
                  className={`w-full mt-1 px-3 py-2 border ${validationErrors.degree ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                />
                {validationErrors.degree && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.degree}</p>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Field of Study</label>
                <input
                  type="text"
                  name="field_of_study"
                  value={formData.field_of_study}
                  onChange={handleInputChange}
                  required
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                />
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
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
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
            <p className="mb-4 text-gray-600">Are you sure you want to delete this education entry? This action cannot be undone.</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteEducation}
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

export default Education;