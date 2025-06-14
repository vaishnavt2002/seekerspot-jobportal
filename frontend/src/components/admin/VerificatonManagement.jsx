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
      isVerified ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
    }`}>
      {isVerified ? 'Verified' : 'Pending Verification'}
    </span>
  );
};

const VerificationModal = ({ isOpen, onClose, onConfirm, jobProvider }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
        <div className="fixed inset-0 transition-opacity">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        
        <div className="inline-block bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Verify Company
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to verify <span className="font-medium">{jobProvider?.company_name}</span>? This action will mark the company as verified.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onConfirm}
            >
              Verify
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const UnverifiedProviderCard = ({ jobProvider, onVerify }) => {
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
                  src={`http://res.cloudinary.com/dkfic2cl6/${jobProvider.company_logo}`} 
                  alt={`${jobProvider.company_name} logo`} 
                  className="h-10 w-10 object-cover rounded"
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
                    src={`http://res.cloudinary.com/dkfic2cl6/${jobProvider.company_logo}`}  
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
              onClick={(e) => {
                e.stopPropagation();
                onVerify(jobProvider);
              }}
              className="px-4 py-2 rounded text-white bg-blue-600 hover:bg-blue-700"
            >
              Verify Company
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default function VerificationManagement() {
  const [unverifiedProviders, setUnverifiedProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    status: '',
    industry: '',
    search: ''
  });

  useEffect(() => {
    fetchUnverifiedProviders();
  }, [pagination.currentPage, filters]);

  const fetchUnverifiedProviders = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.currentPage,
        page_size: pagination.pageSize,
        verified: 'false', // Always filter to show only unverified
        ...filters
      };
      const response = await userManagementApi.getJobProviders(params);
      setUnverifiedProviders(response.results);
      setPagination(prev => ({
        ...prev,
        totalCount: response.count,
        totalPages: Math.ceil(response.count / prev.pageSize)
      }));
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to fetch unverified job providers');
      setLoading(false);
    }
  };

  const handleVerify = (provider) => {
    setSelectedProvider(provider);
    setModalOpen(true);
  };

  const confirmVerify = async () => {
    try {
      await userManagementApi.verifyJobProvider(selectedProvider.id);
      // Remove the verified provider from the list
      setUnverifiedProviders(unverifiedProviders.filter(
        provider => provider.id !== selectedProvider.id
      ));
      setModalOpen(false);
      setSelectedProvider(null);
      
      // Update pagination if needed
      const newTotalCount = pagination.totalCount - 1;
      setPagination(prev => ({
        ...prev,
        totalCount: newTotalCount,
        totalPages: Math.ceil(newTotalCount / prev.pageSize)
      }));
      
      // If we removed the last item on the page, go to previous page
      if (unverifiedProviders.length === 1 && pagination.currentPage > 1) {
        setPagination(prev => ({
          ...prev,
          currentPage: prev.currentPage - 1
        }));
      }
    } catch (err) {
      setError(err.message || 'Failed to verify job provider');
      setModalOpen(false);
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
      industry: '',
      search: ''
    });
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-2xl font-semibold mb-2">Company Verification</h1>
      <p className="text-gray-600 mb-6">Verify new companies before they can post jobs</p>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <h2 className="text-lg font-medium mb-4">Filter Unverified Companies</h2>
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
            <p>Loading unverified companies...</p>
          </div>
        </div>
      ) : unverifiedProviders.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
          <svg className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">All caught up!</h3>
          <p className="mt-1 text-gray-500">There are no companies waiting for verification.</p>
        </div>
      ) : (
        <div>
          <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  You have {pagination.totalCount} {pagination.totalCount === 1 ? 'company' : 'companies'} waiting for verification.
                </p>
              </div>
            </div>
          </div>
          
          {unverifiedProviders.map((provider) => (
            <UnverifiedProviderCard
              key={provider.id}
              jobProvider={provider}
              onVerify={handleVerify}
            />
          ))}
          
          <div className="flex justify-between items-center mt-6">
            <div className="text-sm text-gray-700">
              Showing {(pagination.currentPage - 1) * pagination.pageSize + 1} to{' '}
              {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalCount)} of{' '}
              {pagination.totalCount} unverified companies
            </div>
            {pagination.totalPages > 1 && (
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
            )}
          </div>
        </div>
      )}
      
      <VerificationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={confirmVerify}
        jobProvider={selectedProvider}
      />
    </div>
  );
}