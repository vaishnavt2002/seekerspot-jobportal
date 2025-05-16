import React, { useState, useEffect } from 'react';
import userManagementApi from '../../api/userManagementApi';

const StatusBadge = ({ isActive }) => {
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${
      isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
    }`}>
      {isActive ? 'Active' : 'Blocked'}
    </span>
  );
};

const JobSeekerCard = ({ jobSeeker, onBlockToggle }) => {
  const [expanded, setExpanded] = useState(false);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="mb-4 border rounded-lg shadow-sm overflow-hidden">
      <div 
        className="bg-blue-50 p-4 border-b cursor-pointer hover:bg-blue-100"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-blue-800">
            {jobSeeker.first_name} {jobSeeker.last_name}
          </h2>
          <StatusBadge isActive={jobSeeker.is_active} />
        </div>
        <div className="mt-1 text-sm text-gray-600 flex flex-wrap gap-3">
          <span>{jobSeeker.email}</span>
          <span>•</span>
          <span>Experience: {jobSeeker.experience} years</span>
          <span>•</span>
          <span>Joined: {formatDate(jobSeeker.created_at)}</span>
        </div>
      </div>

      {expanded && (
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Personal Information</h3>
              <p><strong>Phone:</strong> {jobSeeker.phone_number || 'Not provided'}</p>
              <p><strong>Verified:</strong> {jobSeeker.is_verified ? 'Yes' : 'No'}</p>
              <p><strong>Availability:</strong> {jobSeeker.is_available ? 'Available' : 'Not Available'}</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Professional Information</h3>
              <p><strong>Expected Salary:</strong> ₹{jobSeeker.expected_salary}</p>
              <p><strong>Current Salary:</strong> {jobSeeker.current_salary ? `₹${jobSeeker.current_salary}` : 'Not provided'}</p>
              <p><strong>Summary:</strong> {jobSeeker.summary || 'No summary provided'}</p>
            </div>
          </div>
          <div className="mt-4 flex space-x-4">
            {jobSeeker.resume && (
              <button
                onClick={() => window.open(jobSeeker.resume, '_blank')}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Download Resume
              </button>
            )}
            <button
              onClick={() => onBlockToggle(jobSeeker.id, jobSeeker.is_active)}
              className={`px-4 py-2 rounded text-white ${
                jobSeeker.is_active 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {jobSeeker.is_active ? 'Block User' : 'Unblock User'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default function UserManagement() {
  const [jobSeekers, setJobSeekers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    status: '',
    verified: '',
    min_experience: '',
    max_experience: '',
    search: ''
  });

  useEffect(() => {
    fetchJobSeekers();
  }, [pagination.currentPage, filters]);

  const fetchJobSeekers = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.currentPage,
        page_size: pagination.pageSize,
        ...filters
      };
      const response = await userManagementApi.getJobSeekers(params);
      setJobSeekers(response.results);
      setPagination(prev => ({
        ...prev,
        totalCount: response.count,
        totalPages: Math.ceil(response.count / prev.pageSize)
      }));
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to fetch job seekers');
      setLoading(false);
    }
  };

  const handleBlockToggle = async (id, isActive) => {
    try {
      await userManagementApi.blockJobSeeker(id, isActive);
      setJobSeekers(jobSeekers.map(js => 
        js.id === id ? { ...js, is_active: !isActive } : js
      ));
    } catch (err) {
      setError(err.message || `Failed to ${isActive ? 'unblock' : 'block'} job seeker`);
    }
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const resetFilters = () => {
    setFilters({
      status: '',
      verified: '',
      min_experience: '',
      max_experience: '',
      search: ''
    });
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Job Seeker Management</h1>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <h2 className="text-lg font-medium mb-4">Filter Job Seekers</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Verified</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={filters.verified}
              onChange={(e) => handleFilterChange('verified', e.target.value)}
            >
              <option value="">All</option>
              <option value="true">Verified</option>
              <option value="false">Not Verified</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              placeholder="Name, Email, Summary..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Experience (years)</label>
            <input
              type="number"
              min="0"
              className="w-full border rounded px-3 py-2"
              value={filters.min_experience}
              onChange={(e) => handleFilterChange('min_experience', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Experience (years)</label>
            <input
              type="number"
              min="0"
              className="w-full border rounded px-3 py-2"
              value={filters.max_experience}
              onChange={(e) => handleFilterChange('max_experience', e.target.value)}
            />
          </div>
        </div>
        <div className="mt-4 text-right">
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
            <p>Loading job seekers...</p>
          </div>
        </div>
      ) : jobSeekers.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-md border">
          <p className="text-gray-500">No job seekers found.</p>
        </div>
      ) : (
        <div>
          {jobSeekers.map((jobSeeker) => (
            <JobSeekerCard
              key={jobSeeker.id}
              jobSeeker={jobSeeker}
              onBlockToggle={handleBlockToggle}
            />
          ))}
          <div className="flex justify-between items-center mt-6">
            <div className="text-sm text-gray-700">
              Showing {(pagination.currentPage - 1) * pagination.pageSize + 1} to{' '}
              {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalCount)} of{' '}
              {pagination.totalCount} job seekers
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Previous
              </button>
              {[...Array(pagination.totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => handlePageChange(i + 1)}
                  className={`px-3 py-1 border rounded ${
                    pagination.currentPage === i + 1 ? 'bg-blue-600 text-white' : ''
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}