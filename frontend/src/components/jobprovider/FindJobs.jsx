import React, { useState, useEffect, useCallback, useRef } from "react";
import debounce from "lodash/debounce";
import { formatDistanceToNow } from "date-fns";
import publicJobApi from "../../api/publicJobApi";

const FindJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    location: "",
    job_type: "",
    employment_type: "",
    domain: "",
  });
  const lastFiltersRef = useRef(filters); // Track last filters to prevent redundant fetches

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

  const fetchJobs = useCallback(
    async (pageNum = 1, append = false) => {
      if (isLoading || (!hasMore && pageNum !== 1) || error) {
        console.log("Blocked fetchJobs:", { isLoading, hasMore, pageNum, error });
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const params = {
          page: pageNum,
          page_size: 12,
          ...(filters.search && { search: filters.search }),
          ...(filters.location && { location: filters.location }),
          ...(filters.job_type && { job_type: filters.job_type }),
          ...(filters.employment_type && { employment_type: filters.employment_type }),
          ...(filters.domain && { domain: filters.domain }),
        };

        console.log("Fetching jobs with params:", params);
        const response = await publicJobApi.getPublicJobPosts(params);
        console.log("API Response:", response);
        const newJobs = response.results || [];

        setJobs((prev) => (append ? [...prev, ...newJobs] : newJobs));
        const hasMoreJobs = !!response.next && newJobs.length === params.page_size;
        setHasMore(hasMoreJobs);
        setPage(pageNum);
        lastFiltersRef.current = filters;
        console.log("Post-fetch state:", { pageNum, hasMore: hasMoreJobs, jobCount: newJobs.length });
      } catch (err) {
        const errorMessage = err.status === "network_error" ? "Server is unreachable. Please check your connection." : (err.message || "Failed to load jobs. Please try again later.");
        setError(errorMessage);
        setHasMore(false);
        console.error("Error fetching jobs:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [filters, isLoading, hasMore, error]
  );

  const debouncedFetchJobs = useCallback(debounce(() => {
    console.log("Running debouncedFetchJobs, filters:", filters);
    fetchJobs(1);
  }, 500), [fetchJobs]);

  useEffect(() => {
    console.log("Initial fetch triggered");
    fetchJobs(1);
  }, []);

  useEffect(() => {
    if (
      JSON.stringify(filters) !== JSON.stringify(lastFiltersRef.current)
    ) {
      console.log("Filters changed, triggering fetch:", filters);
      debouncedFetchJobs();
    } else {
      console.log("Filters unchanged, skipping fetch:", filters);
    }
    return () => debouncedFetchJobs.cancel();
  }, [filters, debouncedFetchJobs]);

  const debouncedHandleScroll = useCallback(
    debounce(() => {
      if (document.documentElement.offsetHeight <= window.innerHeight) {
        console.log("Page too short, skipping scroll fetch");
        return;
      }
      if (
        window.innerHeight + document.documentElement.scrollTop >=
          document.documentElement.offsetHeight - 100 &&
        hasMore &&
        !isLoading &&
        !error
      ) {
        console.log("Fetching more jobs, page:", page + 1);
        fetchJobs(page + 1, true);
      }
    }, 500),
    [hasMore, isLoading, error, page, fetchJobs]
  );

  useEffect(() => {
    window.addEventListener("scroll", debouncedHandleScroll);
    return () => {
      window.removeEventListener("scroll", debouncedHandleScroll);
      debouncedHandleScroll.cancel();
    };
  }, [debouncedHandleScroll]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(1);
    setHasMore(true);
    setError(null);
  };

  const formatSalary = (min, max) => {
    return `₹${min.toLocaleString("en-IN")} - ₹${max.toLocaleString("en-IN")}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Search and Filter Section */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Search by: Job title, Company, Keyword..."
            className="w-full md:w-1/3 px-4 py-2 rounded border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            name="location"
            value={filters.location}
            onChange={handleFilterChange}
            placeholder="City or Location"
            className="w-full md:w-1/3 px-4 py-2 rounded border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <select
              name="job_type"
              value={filters.job_type}
              onChange={handleFilterChange}
              className="px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Domains</option>
              {DOMAIN_CHOICES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Breadcrumb */}
        <p className="text-sm text-gray-600 mb-4">Home / Find Jobs</p>

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
              className="bg-white p-4 rounded-lg shadow hover:shadow-md transition duration-300"
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
          ))}
        </div>

        {isLoading && (
          <div className="text-center py-6">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-600">Loading more jobs...</span>
          </div>
        )}

        {!isLoading && jobs.length === 0 && !error && (
          <div className="text-center py-6">
            <p className="text-gray-600">No jobs found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FindJobs;