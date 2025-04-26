import React, { useState, useEffect } from 'react';
import jobApi from '../../api/jobApi';

// Sub-component to display applicant details
const ApplicantDetails = ({ applicant }) => {
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
        <button
          onClick={() => {
            if (applicant.job_seeker.resume) {
              window.open(applicant.job_seeker.resume, '_blank');
            }
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
          disabled={!applicant.job_seeker.resume}
        >
          Download Resume
        </button>
      </div>
    </div>
  );
};

// Status Badge component
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

// Main component
export default function JobApplicants() {
  const [jobPosts, setJobPosts] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All'); // State for status filter

  useEffect(() => {
    fetchJobPosts();
  }, []);


  useEffect(() => {
    if (selectedJobId) {
      fetchApplicants(selectedJobId);
    } else {
      setApplicants([]);
    }
  }, [selectedJobId]);

  const fetchJobPosts = async () => {
    try {
      setLoading(true);
      const response = await jobApi.getJobPostsList();
      const filteredJobs = response.filter(job => job.status === 'PUBLISHED' && !job.is_deleted);
      setJobPosts(filteredJobs);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to fetch job posts. Please try again.');
      setLoading(false);
      console.error('Error fetching job posts:', err);
    }
  };

  const fetchApplicants = async (jobId) => {
    try {
      setLoading(true);
      const response = await jobApi.getJobPostApplicants(jobId);
      setApplicants(response);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to fetch applicants. Please try again.');
      setLoading(false);
      console.error('Error fetching applicants:', err);
    }
  };

  const handleRowClick = (id) => {
    setExpandedRowId(expandedRowId === id ? null : id);
  };

  const updateApplicationStatus = async (applicationId, newStatus) => {
    try {
      await jobApi.updateApplicationStatus(applicationId, { status: newStatus });
      setApplicants(applicants.map(app =>
        app.id === applicationId ? { ...app, status: newStatus } : app
      ));
    } catch (err) {
      setError(err.message || 'Failed to update application status. Please try again.');
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
            onClick={(e) => {
              e.stopPropagation();
              updateApplicationStatus(id, 'REVIEWING');
            }}
            className="text-blue-600 hover:underline"
          >
            Review
          </button>
        )}
        {(status === 'APPLIED' || status === 'REVIEWING') && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              updateApplicationStatus(id, 'SHORTLISTED');
            }}
            className="text-green-600 hover:underline"
          >
            Shortlist
          </button>
        )}
        {status !== 'REJECTED' && status !== 'WITHDRAWN' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              updateApplicationStatus(id, 'REJECTED');
            }}
            className="text-red-600 hover:underline"
          >
            Reject
          </button>
        )}
      </div>
    );
  };

  // Filter applicants based on selected status
  const filteredApplicants = statusFilter === 'All'
    ? applicants
    : applicants.filter(applicant => applicant.status === statusFilter);

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">View Applicants</h1>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p>{error}</p>
        </div>
      )}

      <div className="mb-6 flex flex-col sm:flex-row sm:space-x-4">
        <div className="flex-1 mb-4 sm:mb-0">
          <label className="block mb-2 font-medium">Select Job Post</label>
          <select
            className="w-full border rounded px-3 py-2"
            onChange={(e) => setSelectedJobId(Number(e.target.value))}
            value={selectedJobId || ''}
            disabled={loading}
          >
            <option value="" disabled>
              -- Select a Job Post --
            </option>
            {jobPosts.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}--{job.job_type}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block mb-2 font-medium">Filter by Status</label>
          <select
            className="w-full border rounded px-3 py-2"
            onChange={(e) => setStatusFilter(e.target.value)}
            value={statusFilter}
            disabled={loading || !selectedJobId}
          >
            <option value="All">All Statuses</option>
            <option value="APPLIED">Applied</option>
            <option value="REVIEWING">Reviewing</option>
            <option value="SHORTLISTED">Shortlisted</option>
            <option value="REJECTED">Rejected</option>
            <option value="WITHDRAWN">Withdrawn</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <p>Loading...</p>
        </div>
      ) : selectedJobId && filteredApplicants.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-md border">
          <p className="text-gray-500">
            {statusFilter === 'All'
              ? 'No applicants found for this job post.'
              : `No applicants found with status "${statusFilter}".`}
          </p>
        </div>
      ) : selectedJobId && (
        <div className="overflow-x-auto border rounded-md">
          <table className="min-w-full text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Experience</th>
                <th className="px-4 py-2">Expected Salary</th>
                <th className="px-4 py-2">Applied Date</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplicants.map((applicant) => (
                <React.Fragment key={applicant.id}>
                  <tr
                    onClick={() => handleRowClick(applicant.id)}
                    className="hover:bg-gray-50 cursor-pointer border-b"
                  >
                    <td className="px-4 py-2">{applicant.job_seeker.user.first_name} {applicant.job_seeker.user.last_name}</td>
                    <td className="px-4 py-2">{applicant.job_seeker.user.email}</td>
                    <td className="px-4 py-2">{applicant.job_seeker.experience} yrs</td>
                    <td className="px-4 py-2">₹{applicant.job_seeker.expected_salary}</td>
                    <td className="px-4 py-2">{formatDate(applicant.applied_at)}</td>
                    <td className="px-4 py-2">
                      <StatusBadge status={applicant.status} />
                    </td>
                    <td className="px-4 py-2">
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}