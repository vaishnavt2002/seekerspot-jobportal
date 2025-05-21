import React, { useState, useEffect } from 'react';
import profileApi from '../../api/profileApi';
import dummyImage from '../../assets/dummy_profile.jpeg';

const ProfileHeader = () => {
  const [userData, setUserData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const response = await profileApi.getPersonalDetails();
      console.log('ProfileHeader Fetch Response:', response);
      setUserData(response || {});
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch user data.');
      console.error('ProfileHeader Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select an image.');
      return;
    }
    setLoading(true);
    try {
      await profileApi.updateProfilePicture(selectedFile);
      setSelectedFile(null);
      setPreviewUrl(null);
      setIsModalOpen(false);
      await fetchUserData(); 
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to upload profile picture.');
      console.error('Upload Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePicture = async () => {
    setLoading(true);
    try {
      await profileApi.deleteProfilePicture();
      setSelectedFile(null);
      setPreviewUrl(null);
      setIsModalOpen(false);
      await fetchUserData();
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to remove profile picture.');
      console.error('Remove Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
    setError(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
  };

  if (loading && !userData) return <p className="text-gray-600">Loading...</p>;
  if (error && !userData) return <p className="text-red-500">{error}</p>;

  const displayName = userData?.first_name
    ? `${userData.first_name} ${userData.last_name || ''}`.trim()
    : 'User Name';
  const displayEmail = userData?.email || 'user@example.com';
  const imageUrl = userData?.profile_picture != null
  ? userData.profile_picture
  : null;
  
  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-white shadow rounded-lg">
      <div className="relative">
        <img
          src={imageUrl||dummyImage}
          alt="profile"
          className="w-20 h-20 rounded-full object-cover border-2 border-blue-100"
        />
        <button
          onClick={openModal}
          className="absolute bottom-0 right-0 bg-blue-600 text-white text-xs p-1 rounded-full hover:bg-blue-700 transition"
          title="Edit Profile Picture"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            />
          </svg>
        </button>
      </div>
      <div className="text-center sm:text-left">
        <h2 className="text-xl font-semibold text-gray-800">{displayName}</h2>
        <p className="text-gray-500 text-sm">{displayEmail}</p>
      </div>

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl max-w-md w-full">
            <h3 className="text-lg font-bold mb-4 text-gray-800">Update Profile Picture</h3>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
              />
            </div>
            {previewUrl && (
              <div className="mb-4">
                <p className="text-sm text-gray-600">Preview:</p>
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="mt-2 w-32 h-32 object-cover rounded-full mx-auto"
                />
              </div>
            )}
            <div className="flex justify-between gap-2">
              {userData?.profile_picture && (
                <button
                  onClick={handleRemovePicture}
                  disabled={loading}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:bg-red-400"
                >
                  {loading ? 'Removing...' : 'Remove Picture'}
                </button>
              )}
              <div className="flex gap-2">
                <button
                  onClick={closeModal}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={loading || !selectedFile}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                >
                  {loading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileHeader;