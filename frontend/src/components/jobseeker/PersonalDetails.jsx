import React, { useState, useEffect } from 'react';
import profileApi from '../../api/profileApi';

const PersonalDetails = () => {
  // Initialize state with default values
  const [details, setDetails] = useState({
    first_name: '',
    last_name: '',
    email: '',
    summary: '',
    experience: 0,
    current_salary: null,
    expected_salary: 0,
    is_available: true,
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    summary: '',
    experience: '',
    current_salary: '',
    expected_salary: '',
    is_available: true,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch personal details on mount
  useEffect(() => {
    fetchPersonalDetails();
  }, []);

  const fetchPersonalDetails = async () => {
    setLoading(true);
    try {
      // Since axiosInstance already extracts response.data, we get the data directly
      const data = await profileApi.getPersonalDetails();
      console.log('API Response:', data);

      if (data) {
        // Update the details state with the received data
        setDetails(data);
        
        // Set form data with proper type conversions
        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          summary: data.summary || '',
          experience: data.experience != null ? String(data.experience) : '0',
          current_salary: data.current_salary != null ? String(data.current_salary) : '',
          expected_salary: data.expected_salary != null ? String(data.expected_salary) : '0',
          is_available: data.is_available != null ? data.is_available : true,
        });
      }
      setError(null);
    } catch (err) {
      console.error('Fetch Error:', err);
      setError(err.message || 'Failed to fetch personal details.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleEditDetails = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Prepare the data to submit
      const submitData = {
        first_name: formData.first_name || '',
        last_name: formData.last_name || '',
        summary: formData.summary || null,
        experience: formData.experience ? parseInt(formData.experience, 10) : 0,
        current_salary: formData.current_salary ? parseInt(formData.current_salary, 10) : null,
        expected_salary: formData.expected_salary ? parseInt(formData.expected_salary, 10) : 0,  // Fixed: using expected_salary value
        is_available: formData.is_available,
      };
      
      console.log('Submitting Data:', submitData);
      
      // Since axiosInstance already extracts response.data, we get the data directly
      const updatedData = await profileApi.updatePersonalDetails(submitData);
      console.log('Update Response:', updatedData);
      
      // Update the local state with the returned data
      if (updatedData) {
        setDetails(updatedData);
      }
      
      setIsEditModalOpen(false);
      setError(null);
    } catch (err) {
      console.error('Update Error:', err);
      setError(err.message || 'Failed to update personal details.');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = () => {
    setIsEditModalOpen(true);
  };

  // Show loading state when data is being fetched initially
  if (loading && Object.keys(details).every(key => !details[key])) {
    return <p className="text-gray-600">Loading personal details...</p>;
  }

  // Show error message if fetch failed
  if (error && !Object.keys(details).some(key => details[key])) {
    return <p className="text-red-500">Error: {error}</p>;
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow mt-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-700">Personal Details</h2>
        <button
          onClick={openEditModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
        >
          Edit Details
        </button>
      </div>
      
      {/* Show error message if update failed */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* First Name */}
        <div>
          <label className="text-sm text-gray-600">First Name</label>
          <p className="mt-1 px-4 py-2 rounded-md bg-gray-100 border border-gray-300 text-gray-700">
            {details.first_name || 'Not provided'}
          </p>
        </div>

        {/* Last Name */}
        <div>
          <label className="text-sm text-gray-600">Last Name</label>
          <p className="mt-1 px-4 py-2 rounded-md bg-gray-100 border border-gray-300 text-gray-700">
            {details.last_name || 'Not provided'}
          </p>
        </div>

        {/* Email */}
        <div>
          <label className="text-sm text-gray-600">Email</label>
          <p className="mt-1 px-4 py-2 rounded-md bg-gray-100 border border-gray-300 text-gray-700">
            {details.email || 'Not provided'}
          </p>
        </div>

        {/* Current Salary */}
        <div>
          <label className="text-sm text-gray-600">Current Salary</label>
          <p className="mt-1 px-4 py-2 rounded-md bg-gray-100 border border-gray-300 text-gray-700">
            {details.current_salary != null ? `$${details.current_salary}` : 'Not provided'}
          </p>
        </div>

        {/* Expected Salary */}
        <div>
          <label className="text-sm text-gray-600">Expected Salary</label>
          <p className="mt-1 px-4 py-2 rounded-md bg-gray-100 border border-gray-300 text-gray-700">
            {details.expected_salary != null ? `$${details.expected_salary}` : 'Not provided'}
          </p>
        </div>

        {/* Experience */}
        <div>
          <label className="text-sm text-gray-600">Experience</label>
          <p className="mt-1 px-4 py-2 rounded-md bg-gray-100 border border-gray-300 text-gray-700">
            {details.experience != null ? `${details.experience} years` : 'Not provided'}
          </p>
        </div>

        {/* Summary */}
        <div className="md:col-span-2">
          <label className="text-sm text-gray-600">Summary</label>
          <p className="mt-1 px-4 py-2 rounded-md bg-gray-100 border border-gray-300 text-gray-700 min-h-[100px]">
            {details.summary || 'No summary provided'}
          </p>
        </div>

        {/* Availability */}
        <div className="md:col-span-2">
          <label className="text-sm text-gray-600">Availability</label>
          <p className="mt-1 px-4 py-2 rounded-md bg-gray-100 border border-gray-300 text-gray-700">
            {details.is_available != null ? (details.is_available ? 'Available' : 'Not available') : 'Not provided'}
          </p>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl max-w-lg w-full">
            <h3 className="text-xl font-bold mb-4">Edit Personal Details</h3>
            <form onSubmit={handleEditDetails}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Summary</label>
                <textarea
                  name="summary"
                  value={formData.summary}
                  onChange={handleInputChange}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                ></textarea>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Experience (years)</label>
                <input
                  type="number"
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Current Salary</label>
                <input
                  type="number"
                  name="current_salary"
                  value={formData.current_salary}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Expected Salary</label>
                <input
                  type="number"
                  name="expected_salary"
                  value={formData.expected_salary}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="mb-4">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    name="is_available"
                    checked={formData.is_available}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  Available for work
                </label>
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
    </div>
  );
};

export default PersonalDetails;