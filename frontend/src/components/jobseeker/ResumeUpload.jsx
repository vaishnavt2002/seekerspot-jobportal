import React, { useState, useEffect } from 'react';
import profileApi from '../../api/profileApi';

const ResumeUpload = () => {
  const [resume, setResume] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isUpdateMode, setIsUpdateMode] = useState(false);

  useEffect(() => {
    fetchResume();
  }, []);

  const fetchResume = async () => {
    setLoading(true);
    try {
      const data = await profileApi.getResume();
      setResume(data);
      setError(null);
      setIsUpdateMode(false);
    } catch (err) {
      if (err.response?.status === 404) {
        // No resume found, not an error
        setResume(null);
      } else if (err.message.includes('Job seeker profile not found')) {
        setError('Please complete your job seeker profile to manage your resume.');
      } else {
        setError(err.message);
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    // Only allow PDF, DOCX, or DOC files
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
    
    if (selectedFile && allowedTypes.includes(selectedFile.type)) {
      setFile(selectedFile);
      setError(null);
    } else {
      setFile(null);
      setError('Please upload a valid resume file (PDF, DOCX, or DOC)');
    }
  };

  const handleUploadResume = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    
    setLoading(true);
    setSuccess(null);
    
    try {
      await profileApi.uploadResume(file);
      fetchResume();
      setFile(null);
      setSuccess(resume ? 'Resume updated successfully' : 'Resume uploaded successfully');
      setError(null);
    } catch (err) {
      if (err.message.includes('Job seeker profile not found')) {
        setError('Please complete your job seeker profile to upload a resume.');
      } else {
        setError(err.message);
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResume = async () => {
    setLoading(true);
    setSuccess(null);
    
    try {
      await profileApi.deleteResume();
      setResume(null);
      setSuccess('Resume deleted successfully');
      setError(null);
      setIsUpdateMode(false);
    } catch (err) {
      if (err.message.includes('Job seeker profile not found')) {
        setError('Please complete your job seeker profile to manage your resume.');
      } else {
        setError(err.message);
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleUpdateMode = () => {
    setIsUpdateMode(!isUpdateMode);
    setFile(null);
    setError(null);
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-blue-700 border-b pb-2">Resume</h2>
        {resume && !isUpdateMode && (
          <button
            onClick={toggleUpdateMode}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
          >
            Replace Resume
          </button>
        )}
      </div>

      {loading && <p className="text-gray-600">Loading...</p>}
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {success && <p className="text-green-500 mb-4">{success}</p>}

      {resume && !isUpdateMode ? (
        <div className="bg-white border border-gray-100 rounded-xl p-5 mb-6 hover:shadow-lg transition duration-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Current Resume</h3>
              <p className="text-gray-600">{resume.filename}</p>
              <p className="text-gray-500">Uploaded: {new Date(resume.uploaded_at).toLocaleDateString()}</p>
              <p className="text-gray-500 mt-2 italic">You can have only one resume at a time</p>
            </div>
            <div className="flex gap-2">
              <a
                href={resume.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 transition"
              >
                View
              </a>
              <button
                onClick={handleDeleteResume}
                className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {isUpdateMode ? 'Replace Resume' : 'Upload Resume'}
          </h3>
          <p className="text-gray-500 mb-4 italic">
            {isUpdateMode 
              ? 'This will replace your current resume' 
              : 'You can upload one resume file (PDF, DOCX, or DOC)'}
          </p>
          
          <form onSubmit={handleUploadResume}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Resume File
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
            </div>
            <div className="flex gap-2">
              {isUpdateMode && (
                <button
                  type="button"
                  onClick={toggleUpdateMode}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={loading || !file}
                className={`bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition ${
                  loading || !file ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading 
                  ? 'Processing...' 
                  : isUpdateMode 
                    ? 'Replace Resume' 
                    : 'Upload Resume'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ResumeUpload;