import React, { useState, useEffect } from 'react';
import jobApi from '../../api/jobApi';

// Sub-component to display applicant details (reused from original)
const ApplicantDetails = ({ applicant }) => {
  const baseURL=import.meta.env.VITE_BASE_URL
  return (
    <div className="space-y-4 p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Personal Information */}
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Personal Information</h3>
          <p><strong>Experience:</strong> {applicant.job_seeker.experience} years</p>
          <p><strong>Expected Salary:</strong> ₹{applicant.job_seeker.expected_salary}</p>
          <p><strong>Current Salary:</strong> {applicant.job_seeker.current_salary ? `₹${applicant.job_seeker.current_salary}` : 'Not provided'}</p>
          <p><strong>Availability:</strong> {applicant.job_seeker.is_available ? 'Available' : 'Not Available'}</p>
        </div>

        {/* Skills Match */}
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Skills Match</h3>
          <div className="flex items-center">
            <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="absolute h-full bg-green-500 rounded-full"
                style={{ width: `${applicant.skill_match?.match_percentage || 0}%` }}
              />
            </div>
            <span className="ml-2 font-medium">{applicant.skill_match?.match_percentage || 0}%</span>
          </div>
          <p>
            <strong>Matching Skills:</strong> {applicant.skill_match?.matching_skills || 0} out of {applicant.skill_match?.total_skills || 0}
          </p>
          <div>
            <strong>Skills:</strong> {applicant.skills?.map(skill => skill.name).join(', ') || 'No skills listed'}
          </div>
        </div>
      </div>

      {/* Education */}
      <div>
        <h3 className="font-semibold text-lg">Education</h3>
        {applicant.education && applicant.education.length > 0 ? (
          <ul className="list-disc ml-6">
            {applicant.education.map((edu, index) => (
              <li key={index}>
                {edu.degree} in {edu.field_of_study} at {edu.institution}
                ({new Date(edu.start_date).getFullYear()} - {edu.end_date ? new Date(edu.end_date).getFullYear() : 'Present'})
                {edu.description && <p className="text-sm text-gray-600">{edu.description}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No education history provided</p>
        )}
      </div>

      {/* Work Experience */}
      <div>
        <h3 className="font-semibold text-lg">Work Experience</h3>
        {applicant.work_experience && applicant.work_experience.length > 0 ? (
          <ul className="list-disc ml-6">
            {applicant.work_experience.map((exp, index) => (
              <li key={index}>
                {exp.title} at {exp.company} in {exp.location}
                ({new Date(exp.start_date).getFullYear()} - {exp.end_date ? new Date(exp.end_date).getFullYear() : 'Present'})
                {exp.description && <p className="text-sm text-gray-600">{exp.description}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No work experience provided</p>
        )}
      </div>

      {/* Summary */}
      {applicant.job_seeker.summary && (
        <div>
          <h3 className="font-semibold text-lg">Professional Summary</h3>
          <p>{applicant.job_seeker.summary}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex space-x-4 pt-2">
        {applicant.job_seeker.resume ? (
  <a
    href={`${baseURL}${applicant.job_seeker.resume}`}
    target="_blank"
    rel="noopener noreferrer"
    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
  >
    Download Resume
  </a>
) : (
  <button
    disabled
    className="px-4 py-2 bg-blue-300 text-white rounded cursor-not-allowed"
  >
    No Resume Available
  </button>
)}
      </div>
    </div>
  );
};

// Status Badge component (reused from original)
const StatusBadge = ({ status }) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'APPLIED':
        return 'bg-blue-100 text-blue-800';
      case 'REVIEWING':
        return 'bg-purple-100 text-purple-800';
      case 'SHORTLISTED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'WITHDRAWN':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusStyles()}`}>
      {status}
    </span>
  );
};

// Job Post Card Component
const JobPostCard = ({ jobPost, applicants, onStatusChange, globalFilters }) => {
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [showAllApplicants, setShowAllApplicants] = useState(false);
  const [filteredApplicants, setFilteredApplicants] = useState([]);
  
  useEffect(() => {
    // Apply global filters to this job's applicants
    let filtered = applicants;
    
    if (globalFilters.status !== 'All') {
      filtered = filtered.filter(app => app.status === globalFilters.status);
    }
    
    if (globalFilters.experience !== 'All') {
      switch (globalFilters.experience) {
        case '0-2':
          filtered = filtered.filter(app => app.job_seeker.experience >= 0 && app.job_seeker.experience <= 2);
          break;
        case '3-5':
          filtered = filtered.filter(app => app.job_seeker.experience >= 3 && app.job_seeker.experience <= 5);
          break;
        case '6-10':
          filtered = filtered.filter(app => app.job_seeker.experience >= 6 && app.job_seeker.experience <= 10);
          break;
        case '10+':
          filtered = filtered.filter(app => app.job_seeker.experience > 10);
          break;
      }
    }
    
    if (globalFilters.searchTerm) {
      const term = globalFilters.searchTerm.toLowerCase();
      filtered = filtered.filter(app => 
        app.job_seeker.user.first_name.toLowerCase().includes(term) ||
        app.job_seeker.user.last_name.toLowerCase().includes(term) ||
        app.job_seeker.user.email.toLowerCase().includes(term) ||
        (app.skills && app.skills.some(skill => skill.name.toLowerCase().includes(term)))
      );
    }
    
    if (globalFilters.skillMatchThreshold > 0) {
      filtered = filtered.filter(app => 
        (app.skill_match?.match_percentage || 0) >= globalFilters.skillMatchThreshold
      );
    }
    
    setFilteredApplicants(filtered);
  }, [applicants, globalFilters]);

  const handleRowClick = (id) => {
    setExpandedRowId(expandedRowId === id ? null : id);
  };

  const updateApplicationStatus = async (applicationId, newStatus, e) => {
    e.stopPropagation();
    try {
      await onStatusChange(applicationId, newStatus);
    } catch (err) {
      console.error('Error updating application status:', err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderActionButtons = (applicant) => {
    const { id, status } = applicant;

    return (
      <div className="space-x-2">
        {status === 'APPLIED' && (
          <button
            onClick={(e) => updateApplicationStatus(id, 'REVIEWING', e)}
            className="text-blue-600 hover:underline"
          >
            Review
          </button>
        )}
        {(status === 'APPLIED' || status === 'REVIEWING') && (
          <button
            onClick={(e) => updateApplicationStatus(id, 'SHORTLISTED', e)}
            className="text-green-600 hover:underline"
          >
            Shortlist
          </button>
        )}
        {status !== 'REJECTED' && status !== 'WITHDRAWN' && (
          <button
            onClick={(e) => updateApplicationStatus(id, 'REJECTED', e)}
            className="text-red-600 hover:underline"
          >
            Reject
          </button>
        )}
      </div>
    );
  };

  // Display limited applicants initially (3) or all if expanded
  const displayApplicants = showAllApplicants 
    ? filteredApplicants 
    : filteredApplicants.slice(0, 3);

  // If no applicants match the filters for this job, don't show the job card
  if (filteredApplicants.length === 0) {
    return null;
  }

  return (
    <div className="mb-8 border rounded-lg shadow-sm overflow-hidden">
      {/* Job Post Header */}
      <div className="bg-blue-50 p-4 border-b">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-blue-800">{jobPost.title}</h2>
          <div className="text-sm text-gray-600">
            {filteredApplicants.length} applicant{filteredApplicants.length !== 1 ? 's' : ''}
          </div>
        </div>
        <div className="mt-1 text-sm text-gray-600 flex flex-wrap gap-3">
          <span>{jobPost.job_type}</span>
          <span>•</span>
          <span>{jobPost.location}</span>
          <span>•</span>
          <span>Posted: {formatDate(jobPost.created_at || new Date())}</span>
          <span>•</span>
          <span>Deadline: {formatDate(jobPost.application_deadline)}</span>
        </div>
      </div>

      {/* Applicants Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Experience
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Expected Salary
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Applied Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayApplicants.length > 0 ? (
              displayApplicants.map((applicant) => (
                <React.Fragment key={applicant.id}>
                  <tr
                    onClick={() => handleRowClick(applicant.id)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      {applicant.job_seeker.user.first_name} {applicant.job_seeker.user.last_name}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {applicant.job_seeker.user.email}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {applicant.job_seeker.experience} yrs
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      ₹{applicant.job_seeker.expected_salary}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {formatDate(applicant.applied_at)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <StatusBadge status={applicant.status} />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {renderActionButtons(applicant)}
                    </td>
                  </tr>
                  {expandedRowId === applicant.id && (
                    <tr className="bg-gray-50">
                      <td colSpan="7" className="px-0 py-0">
                        <ApplicantDetails applicant={applicant} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-4 py-4 text-center text-gray-500">
                  No applicants match your filter criteria for this job.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Show More/Less Button */}
      {filteredApplicants.length > 3 && (
        <div className="p-4 border-t text-center">
          <button
            onClick={() => setShowAllApplicants(!showAllApplicants)}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            {showAllApplicants 
              ? `Show Less (3 of ${filteredApplicants.length})` 
              : `Show All (${filteredApplicants.length} Applicants)`}
          </button>
        </div>
      )}
    </div>
  );
};

// Main component
export default function JobApplicants() {
  const [jobPosts, setJobPosts] = useState([]);
  const [applicantsByJob, setApplicantsByJob] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingJobs, setLoadingJobs] = useState({});
  
  // Global filters
  const [filters, setFilters] = useState({
    status: 'All',
    experience: 'All',
    searchTerm: '',
    skillMatchThreshold: 0
  });

  // Dashboard stats
  const [stats, setStats] = useState({
    totalApplicants: 0,
    totalShortlisted: 0,
    totalReviewing: 0,
    totalRejected: 0
  });

  useEffect(() => {
    fetchJobPosts();
  }, []);

  useEffect(() => {
    // Calculate stats whenever applicantsByJob changes
    calculateStats();
  }, [applicantsByJob]);

  const calculateStats = () => {
    let total = 0;
    let shortlisted = 0;
    let reviewing = 0;
    let rejected = 0;

    // Count applicants by status across all jobs
    Object.values(applicantsByJob).forEach(applicants => {
      total += applicants.length;
      shortlisted += applicants.filter(app => app.status === 'SHORTLISTED').length;
      reviewing += applicants.filter(app => app.status === 'REVIEWING').length;
      rejected += applicants.filter(app => app.status === 'REJECTED').length;
    });

    setStats({
      totalApplicants: total,
      totalShortlisted: shortlisted,
      totalReviewing: reviewing,
      totalRejected: rejected
    });
  };

  const fetchJobPosts = async () => {
    try {
      setLoading(true);
      const response = await jobApi.getJobPostsList();
      const filteredJobs = response.filter(job => job.status === 'PUBLISHED' && !job.is_deleted);
      setJobPosts(filteredJobs);
      
      // Fetch applicants for each job post
      const applicantsMap = {};
      await Promise.all(filteredJobs.map(async (job) => {
        setLoadingJobs(prev => ({...prev, [job.id]: true}));
        try {
          const applicants = await jobApi.getJobPostApplicants(job.id);
          applicantsMap[job.id] = applicants;
        } catch (err) {
          console.error(`Error fetching applicants for job ${job.id}:`, err);
        } finally {
          setLoadingJobs(prev => ({...prev, [job.id]: false}));
        }
      }));
      
      setApplicantsByJob(applicantsMap);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to fetch job posts. Please try again.');
      setLoading(false);
      console.error('Error fetching job posts:', err);
    }
  };

  const updateApplicationStatus = async (applicationId, newStatus) => {
    try {
      await jobApi.updateApplicationStatus(applicationId, { status: newStatus });
      
      // Update the local state to reflect the change
      const updatedApplicantsByJob = {...applicantsByJob};
      
      // Find and update the applicant across all jobs
      Object.keys(updatedApplicantsByJob).forEach(jobId => {
        updatedApplicantsByJob[jobId] = updatedApplicantsByJob[jobId].map(app => 
          app.id === applicationId ? { ...app, status: newStatus } : app
        );
      });
      
      setApplicantsByJob(updatedApplicantsByJob);
    } catch (err) {
      setError(err.message || 'Failed to update application status. Please try again.');
      console.error('Error updating application status:', err);
    }
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      status: 'All',
      experience: 'All',
      searchTerm: '',
      skillMatchThreshold: 0
    });
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Applicants Dashboard</h1>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p>{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-500">Total Applicants</div>
          <div className="mt-1 text-2xl font-semibold">{stats.totalApplicants}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-500">Shortlisted</div>
          <div className="mt-1 text-2xl font-semibold text-green-600">{stats.totalShortlisted}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-500">Reviewing</div>
          <div className="mt-1 text-2xl font-semibold text-purple-600">{stats.totalReviewing}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-500">Rejected</div>
          <div className="mt-1 text-2xl font-semibold text-red-600">{stats.totalRejected}</div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <h2 className="text-lg font-medium mb-4">Filter Applicants</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="APPLIED">Applied</option>
              <option value="REVIEWING">Reviewing</option>
              <option value="SHORTLISTED">Shortlisted</option>
              <option value="REJECTED">Rejected</option>
              <option value="WITHDRAWN">Withdrawn</option>
            </select>
          </div>
          
          {/* Experience Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Experience</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={filters.experience}
              onChange={(e) => handleFilterChange('experience', e.target.value)}
            >
              <option value="All">All Experience</option>
              <option value="0-2">0-2 years</option>
              <option value="3-5">3-5 years</option>
              <option value="6-10">6-10 years</option>
              <option value="10+">10+ years</option>
            </select>
          </div>
          
          {/* Skill Match Threshold */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Skill Match (Min {filters.skillMatchThreshold}%)
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="10"
              className="w-full"
              value={filters.skillMatchThreshold}
              onChange={(e) => handleFilterChange('skillMatchThreshold', parseInt(e.target.value))}
            />
          </div>
          
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              placeholder="Name, Email, Skills..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            />
          </div>
        </div>
        
        {/* Reset Filters */}
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
            <p>Loading applicants...</p>
          </div>
        </div>
      ) : jobPosts.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-md border">
          <p className="text-gray-500">No job posts found.</p>
        </div>
      ) : (
        <div>
          {/* Applicants by Job */}
          {jobPosts.map((jobPost) => (
            <div key={jobPost.id}>
              {loadingJobs[jobPost.id] ? (
                <div className="mb-8 p-4 border rounded-lg shadow-sm bg-white">
                  <p className="text-center text-gray-500">Loading applicants for {jobPost.title}...</p>
                </div>
              ) : (
                <JobPostCard
                  jobPost={jobPost}
                  applicants={applicantsByJob[jobPost.id] || []}
                  onStatusChange={updateApplicationStatus}
                  globalFilters={filters}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}