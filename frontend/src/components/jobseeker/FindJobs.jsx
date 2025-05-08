import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import debounce from "lodash/debounce";
import { formatDistanceToNow } from "date-fns";
import { Bookmark } from "lucide-react";
import publicJobApi from "../../api/publicJobApi";

const FindJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [savedJobs, setSavedJobs] = useState({}); // Track saved job status
  const [filters, setFilters] = useState({
    search: "",
    location: "",
    job_type: "",
    employment_type: "",
    domain: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const lastFiltersRef = useRef(filters);
  const filterButtonRef = useRef(null);
  const filterDropdownRef = useRef(null);
  const isInitialFetchDone = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();

  const JOB_TYPE_CHOICES = [
    { value: "REMOTE", label: "Remote" },
    { value: "HYBRID", label: "Hybrid" },
    { value: "ONSITE", label: "Onsite" },
  ];

  const EMPLOYMENT_TYPE_CHOICES = [
    { value: "FULL_TIME", label: "Full-time" },
    { value: "PART_TIME", label: "Part-time" },
    { value: "INTERNSHIP", label: "Internship" },
    { value: "TRAINEE", label: "Trainee" },
    { value: "CONTRACT", label: "Contract" },
  ];

  const DOMAIN_CHOICES = [
    { value: "ACCOUNTING", label: "Accounting" },
    { value: "IT", label: "Information Technology" },
    { value: "MANAGEMENT", label: "Management" },
    { value: "MARKETING", label: "Marketing" },
    { value: "ENGINEERING", label: "Engineering" },
    { value: "HEALTHCARE", label: "Healthcare" },
    { value: "EDUCATION", label: "Education" },
    { value: "OTHER", label: "Other" },
  ];

  // Items per page
  const PAGE_SIZE = 12;

  // Restore filters from URL only on initial mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const newFilters = {
      search: params.get("search") || "",
      location: params.get("location") || "",
      job_type: params.get("job_type") || "",
      employment_type: params.get("employment_type") || "",
      domain: params.get("domain") || "",
    };
    // Also get page from URL if present
    const urlPage = parseInt(params.get("page"), 10);
    if (urlPage && !isNaN(urlPage) && urlPage > 0) {
      setPage(urlPage);
    }
    setFilters(newFilters);
    lastFiltersRef.current = newFilters;
  }, []); // Empty dependency array ensures this runs only once

  // Fetch saved job status for all jobs
  const fetchSavedJobStatus = useCallback(async (jobIds) => {
    try {
      const statusPromises = jobIds.map(async (jobId) => {
        try {
          const response = await publicJobApi.checkSavedStatus(jobId);
          return { jobId, is_saved: response.is_saved };
        } catch (error) {
          console.error(`Error fetching saved status for job ${jobId}:`, error);
          return { jobId, is_saved: false };
        }
      });

      const results = await Promise.all(statusPromises);
      const savedJobsMap = {};
      results.forEach(result => {
        savedJobsMap[result.jobId] = result.is_saved;
      });
      
      setSavedJobs(savedJobsMap);
    } catch (error) {
      console.error("Error fetching saved job statuses:", error);
    }
  }, []);

  const fetchJobs = useCallback(
    async (pageNum = 1) => {
      if (isLoading || error) {
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const params = {
          page: pageNum,
          page_size: PAGE_SIZE,
          ...(filters.search && { search: filters.search }),
          ...(filters.location && { location: filters.location }),
          ...(filters.job_type && { job_type: filters.job_type }),
          ...(filters.employment_type && { employment_type: filters.employment_type }),
          ...(filters.domain && { domain: filters.domain }),
        };

        console.log("Fetching jobs with params:", params);
        const response = await publicJobApi.getPublicJobPosts(params);
        const newJobs = response.results || [];

        setJobs(newJobs);
        
        // Calculate total pages from count
        const total = response.count || 0;
        const calculatedTotalPages = Math.ceil(total / PAGE_SIZE);
        setTotalPages(calculatedTotalPages || 1); // Ensure at least 1 page
        
        // Fetch saved statuses for new jobs
        const newJobIds = newJobs.map(job => job.id);
        if (newJobIds.length > 0) {
          fetchSavedJobStatus(newJobIds);
        }
        
      } catch (err) {
        const errorMessage =
          err.status === "network_error"
            ? "Server is unreachable. Please check your connection."
            : err.message || "Failed to load jobs. Please try again later.";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
        if (pageNum === 1) {
          isInitialFetchDone.current = true;
        }
      }
    },
    [filters, isLoading, error, fetchSavedJobStatus]
  );

  // Toggle job saved status
  const toggleSaveJob = async (e, jobId) => {
    e.stopPropagation(); // Prevent job card click event
    
    const isSaved = savedJobs[jobId];
    
    try {
      if (isSaved) {
        // Unsave job
        await publicJobApi.unsaveJob(jobId);
        setSavedJobs(prev => ({
          ...prev,
          [jobId]: false
        }));
        console.log("Job removed from saved list");
      } else {
        // Save job
        await publicJobApi.saveJob(jobId);
        setSavedJobs(prev => ({
          ...prev,
          [jobId]: true
        }));
        console.log("Job saved successfully");
      }
    } catch (error) {
      console.error("Error toggling saved status:", error);
    }
  };

  const debouncedFetchJobs = useCallback(
    debounce((filtersToUse) => {
      console.log("Running debouncedFetchJobs, filters:", filtersToUse);
      fetchJobs(1);
    }, 500, { leading: false, trailing: true }),
    [fetchJobs]
  );

  // Initial fetch
  useEffect(() => {
    if (!isInitialFetchDone.current) {
      console.log("Triggering initial fetch");
      fetchJobs(page);
    }
  }, [fetchJobs, page]);

  // Handle filter changes and update URL
  useEffect(() => {
    if (isInitialFetchDone.current && JSON.stringify(filters) !== JSON.stringify(lastFiltersRef.current)) {
      // Reset to page 1 when filters change
      setPage(1);
      debouncedFetchJobs(filters);
      updateURLWithFilters(filters, 1); // Reset to page 1 in URL when filters change
      lastFiltersRef.current = { ...filters };
    }
    return () => debouncedFetchJobs.cancel();
  }, [filters, debouncedFetchJobs, navigate]);

  // Update URL with current filters and page
  const updateURLWithFilters = (currentFilters, currentPage) => {
    const queryParams = new URLSearchParams();
    Object.entries(currentFilters).forEach(([key, value]) => {
      if (value) queryParams.set(key, value);
    });
    
    // Add page to URL params if not page 1
    if (currentPage > 1) {
      queryParams.set('page', currentPage.toString());
    }
    
    navigate(`/find-jobs?${queryParams.toString()}`, { replace: true });
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) {
      return;
    }
    
    setPage(newPage);
    fetchJobs(newPage);
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Update URL with the new page
    updateURLWithFilters(filters, newPage);
  };

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        filterButtonRef.current &&
        filterDropdownRef.current &&
        !filterButtonRef.current.contains(event.target) &&
        !filterDropdownRef.current.contains(event.target)
      ) {
        setShowFilters(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    console.log(`Filter changed: ${name}=${value}`);
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    console.log("Clearing all filters");
    setFilters({
      search: "",
      location: "",
      job_type: "",
      employment_type: "",
      domain: "",
    });
    setPage(1);
    setError(null);
    setShowFilters(false);
  };

  const removeFilter = (filterKey) => {
    console.log(`Removing filter: ${filterKey}`);
    setFilters((prev) => ({ ...prev, [filterKey]: "" }));
    setPage(1);
    setError(null);
  };

  const formatSalary = (min, max) => {
    return `₹${min.toLocaleString("en-IN")} - ₹${max.toLocaleString("en-IN")}`;
  };

  // Navigate to JobPosting with filters as query params
  const handleJobClick = (jobId) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) queryParams.set(key, value);
    });
    // Include current page in return URL for better navigation
    queryParams.set('fromPage', page.toString());
    console.log(`Navigating to job/${jobId} with filters:`, queryParams.toString());
    navigate(`/job/${jobId}?${queryParams.toString()}`);
  };

  // Get selected filter labels for display
  const selectedFilters = [];
  if (filters.job_type) {
    const jobType = JOB_TYPE_CHOICES.find((jt) => jt.value === filters.job_type);
    selectedFilters.push({ key: "job_type", label: jobType.label, value: filters.job_type });
  }
  if (filters.employment_type) {
    const empType = EMPLOYMENT_TYPE_CHOICES.find((et) => et.value === filters.employment_type);
    selectedFilters.push({ key: "employment_type", label: empType.label, value: filters.employment_type });
  }
  if (filters.domain) {
    const domain = DOMAIN_CHOICES.find((d) => d.value === filters.domain);
    selectedFilters.push({ key: "domain", label: domain.label, value: filters.domain });
  }

  // Function to generate pagination numbers intelligently
  const generatePaginationNumbers = () => {
    // Always show first and last page
    // Show 2 pages before and after current page
    // Use ellipsis (...) to represent skipped pages
    
    const pagesToShow = [];
    const maxVisiblePages = 7; // Maximum number of page numbers to show
    
    if (totalPages <= maxVisiblePages) {
      // If total pages is small, show all pages
      for (let i = 1; i <= totalPages; i++) {
        pagesToShow.push(i);
      }
    } else {
      // Always add page 1
      pagesToShow.push(1);
      
      // Calculate range around current page
      const rangeStart = Math.max(2, page - 2);
      const rangeEnd = Math.min(totalPages - 1, page + 2);
      
      // Add ellipsis if needed before current range
      if (rangeStart > 2) {
        pagesToShow.push('...');
      }
      
      // Add pages around current page
      for (let i = rangeStart; i <= rangeEnd; i++) {
        pagesToShow.push(i);
      }
      
      // Add ellipsis if needed after current range
      if (rangeEnd < totalPages - 1) {
        pagesToShow.push('...');
      }
      
      // Always add last page if not already included
      if (totalPages > 1) {
        pagesToShow.push(totalPages);
      }
    }
    
    return pagesToShow;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Search and Filter Section */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">
          <input
            type="text"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Search by: Job title, Company, Keyword..."
            className="w-full md:w-1/3 px-4 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            name="location"
            value={filters.location}
            onChange={handleFilterChange}
            placeholder="City or Location"
            className="w-full md:w-1/3 px-4 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="relative" ref={filterButtonRef}>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1m-17 4h14m-7 4h7m-14 4h14"
                />
              </svg>
              Filters
            </button>
            {showFilters && (
              <div
                ref={filterDropdownRef}
                className="absolute top-12 right-0 w-64 bg-white rounded-lg shadow-xl p-4 z-10 border border-gray-200"
              >
                <select
                  name="job_type"
                  value={filters.job_type}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 mb-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Job Types</option>
                  {JOB_TYPE_CHOICES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  name="employment_type"
                  value={filters.employment_type}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 mb-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Employment Types</option>
                  {EMPLOYMENT_TYPE_CHOICES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  name="domain"
                  value={filters.domain}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 mb-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Domains</option>
                  {DOMAIN_CHOICES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={clearFilters}
                  className="w-full px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-200"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Selected Filters Display */}
        {(filters.search || filters.location || selectedFilters.length > 0) && (
          <div className="flex flex-wrap gap-2 mb-4">
            {filters.search && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                Search: {filters.search}
                <button
                  onClick={() => removeFilter("search")}
                  className="ml-2 focus:outline-none"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </span>
            )}
            {filters.location && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                Location: {filters.location}
                <button
                  onClick={() => removeFilter("location")}
                  className="ml-2 focus:outline-none"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </span>
            )}
            {selectedFilters.map((filter) => (
              <span
                key={filter.key}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
              >
                {filter.label}
                <button
                  onClick={() => removeFilter(filter.key)}
                  className="ml-2 focus:outline-none"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </span>
            ))}
            {(filters.search || filters.location || selectedFilters.length > 0) && (
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:underline"
              >
                Clear All
              </button>
            )}
          </div>
        )}

        {/* Breadcrumb */}
        <p className="text-sm text-gray-600 mb-4">Home / Find Jobs</p>

        {/* Results Summary */}
        {!isLoading && !error && (
          <div className="text-sm text-gray-600 mb-4">
            Showing page {page} of {totalPages} 
            {totalPages > 0 && ` (${(page - 1) * PAGE_SIZE + 1}-${Math.min(page * PAGE_SIZE, (totalPages - 1) * PAGE_SIZE + jobs.length)} jobs)`}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="text-center py-6 text-red-600">
            <p>{error}</p>
          </div>
        )}

        {/* Job Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="bg-white p-4 rounded-lg shadow hover:shadow-md transition duration-300 relative"
            >
              {/* Save Button */}
              <button
                onClick={(e) => toggleSaveJob(e, job.id)}
                className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-gray-100 transition-colors z-10"
                title={savedJobs[job.id] ? "Remove from saved jobs" : "Save job"}
              >
                <Bookmark
                  size={20}
                  className={`${
                    savedJobs[job.id] ? "fill-blue-500 text-blue-500" : "text-gray-400"
                  }`}
                />
              </button>

              {/* Job Card Content (clickable) */}
              <div 
                onClick={() => handleJobClick(job.id)}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={`http://localhost:8000${job.job_provider.company_logo}`}
                    alt={`${job.job_provider.company_name} logo`}
                    className="h-10 w-10 object-contain rounded"
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{job.title}</h3>
                    <p className="text-sm text-gray-500">
                      {job.job_provider.company_name} - {job.location}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded">
                    {job.employment_type.replace("_", " ").toLowerCase()}
                  </span>
                  <span className="text-sm text-gray-600">
                    {formatSalary(job.min_salary, job.max_salary)}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  Posted {formatDistanceToNow(new Date(job.created_at))} ago
                </p>
              </div>
            </div>
          ))}
        </div>

        {isLoading && (
          <div className="text-center py-6">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-600">Loading jobs...</span>
          </div>
        )}

        {!isLoading && jobs.length === 0 && !error && (
          <div className="text-center py-6">
            <p className="text-gray-600">No jobs found matching your criteria.</p>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && !error && jobs.length > 0 && totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex items-center gap-2">
              {/* Previous Page Button */}
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className={`px-3 py-1 rounded-md ${
                  page === 1 
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed" 
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
              >
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              {/* Page Numbers */}
              {generatePaginationNumbers().map((pageNum, index) => (
                <React.Fragment key={index}>
                  {pageNum === '...' ? (
                    <span className="px-3 py-1 text-gray-500">...</span>
                  ) : (
                    <button
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1 rounded-md ${
                        page === pageNum
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      {pageNum}
                    </button>
                  )}
                </React.Fragment>
              ))}

              {/* Next Page Button */}
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className={`px-3 py-1 rounded-md ${
                  page === totalPages
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
              >
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FindJobs;