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

const VerifiedBadge = ({ isVerified }) => {
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${
      isVerified ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
    }`}>
      {isVerified ? 'Verified' : 'Not Verified'}
    </span>
  );
};

const JobProviderCard = ({ jobProvider, onBlockToggle }) => {
  const [expanded, setExpanded] = useState(false);
    const baseUrl = import.meta.env.VITE_BASE_URL;
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
        className="bg-indigo-50 p-4 border-b cursor-pointer hover:bg-indigo-100"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            {jobProvider.company_logo && (
              <div className="mr-3 flex-shrink-0">
                <img 
                  src={jobProvider.company_logo_url}
                  alt={`${jobProvider.company_name} logo`} 
                  className="h-10 w-10 object-contain rounded"
                />
              </div>
            )}
            <h2 className="text-lg font-semibold text-indigo-800">
              {jobProvider.company_name}
            </h2>
          </div>
          <div className="flex gap-2">
            <VerifiedBadge isVerified={jobProvider.is_verified} />
            
            <StatusBadge isActive={jobProvider.is_active} />
          </div>
        </div>
        <div className="mt-1 text-sm text-gray-600 flex flex-wrap gap-3">
          <span>{jobProvider.first_name} {jobProvider.last_name}</span>
          <span>•</span>
          <span>{jobProvider.email}</span>
          <span>•</span>
          <span>Joined: {formatDate(jobProvider.created_at)}</span>
        </div>
      </div>

      {expanded && (
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Company Information</h3>
              {jobProvider.company_logo && (
                <div className="mb-4">
                  <img 
                    src={jobProvider.company_logo_url}
                    alt={`${jobProvider.company_name} logo`} 
                    className="h-32 object-contain border rounded p-1 bg-white"
                  />
                </div>
              )}
              <p><strong>Industry:</strong> {jobProvider.industry}</p>
              <p><strong>Location:</strong> {jobProvider.location}</p>
              <p><strong>Website:</strong> {jobProvider.company_website ? 
                <a href={jobProvider.company_website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {jobProvider.company_website}
                </a> : 'Not provided'}</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Contact Information</h3>
              <p><strong>Contact Person:</strong> {jobProvider.first_name} {jobProvider.last_name}</p>
              <p><strong>Email:</strong> {jobProvider.email}</p>
              <p><strong>Phone:</strong> {jobProvider.phone_number || 'Not provided'}</p>
            </div>
          </div>
          
          {jobProvider.description && (
            <div className="mt-4">
              <h3 className="font-semibold text-lg">Description</h3>
              <p className="mt-1 text-gray-700">{jobProvider.description}</p>
            </div>
          )}
          
          <div className="mt-4 flex space-x-4">
            <button
              onClick={() => onBlockToggle(jobProvider.id, jobProvider.is_active)}
              className={`px-4 py-2 rounded text-white ${
                jobProvider.is_active 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {jobProvider.is_active ? 'Block Company' : 'Unblock Company'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default function JobProviderManagement() {
  const [jobProviders, setJobProviders] = useState([]);
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
    industry: '',
    search: ''
  });

  useEffect(() => {
    fetchJobProviders();
  }, [pagination.currentPage, filters]);

  const fetchJobProviders = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.currentPage,
        page_size: pagination.pageSize,
        ...filters
      };
      const response = await userManagementApi.getJobProviders(params);
      setJobProviders(response.results);
      setPagination(prev => ({
        ...prev,
        totalCount: response.count,
        totalPages: Math.ceil(response.count / prev.pageSize)
      }));
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to fetch job providers');
      setLoading(false);
    }
  };

  const handleBlockToggle = async (id, isActive) => {
    try {
      await userManagementApi.blockJobProvider(id, isActive);
      setJobProviders(jobProviders.map(jp => 
        jp.id === id ? { ...jp, is_active: !isActive } : jp
      ));
    } catch (err) {
      setError(err.message || `Failed to ${isActive ? 'block' : 'unblock'} job provider`);
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
      industry: '',
      search: ''
    });
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Job Provider Management</h1>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <h2 className="text-lg font-medium mb-4">Filter Job Providers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              placeholder="IT, Healthcare, Education..."
              value={filters.industry}
              onChange={(e) => handleFilterChange('industry', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              placeholder="Company Name, Email, Description..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
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
            <p>Loading job providers...</p>
          </div>
        </div>
      ) : jobProviders.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-md border">
          <p className="text-gray-500">No job providers found.</p>
        </div>
      ) : (
        <div>
          {jobProviders.map((jobProvider) => (
            <JobProviderCard
              key={jobProvider.id}
              jobProvider={jobProvider}
              onBlockToggle={handleBlockToggle}
            />
          ))}
          <div className="flex justify-between items-center mt-6">
            <div className="text-sm text-gray-700">
              Showing {(pagination.currentPage - 1) * pagination.pageSize + 1} to{' '}
              {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalCount)} of{' '}
              {pagination.totalCount} job providers
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
                    pagination.currentPage === i + 1 ? 'bg-indigo-600 text-white' : ''
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