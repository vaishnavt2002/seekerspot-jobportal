import React, { useState, useEffect } from 'react';
import jobApi from '../../api/jobApi';
import JoinMeetingButton from '../JoinMeetingButton';

// Sub-component to display applicant details
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
    href={applicant.job_seeker.resume}
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
      case 'HIRED':
        return 'bg-emerald-100 text-emerald-800';
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

// Interview Badge component
const InterviewBadge = ({ interview }) => {
  if (!interview) return null;
  
  const getInterviewStyles = () => {
    switch (interview.status) {
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800';
      case 'RESCHEDULED':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${getInterviewStyles()}`}>
      {interview.status}
    </span>
  );
};

// Sub-component for interview scheduling form
const InterviewScheduleForm = ({ applicationId, onSchedule, onCancel, existingInterview }) => {
  const [interviewDate, setInterviewDate] = useState(existingInterview?.interview_date || '');
  const [interviewTime, setInterviewTime] = useState(existingInterview?.interview_time || '');
  const [interviewType, setInterviewType] = useState(existingInterview?.interview_type || 'AUDIO_AND_VIDEO');
  const [notes, setNotes] = useState(existingInterview?.notes || '');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set min date to today
  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    const interviewData = {
      application: applicationId,
      interview_date: interviewDate,
      interview_time: interviewTime,
      interview_type: interviewType,
      notes: notes || null,
    };

    try {
      let response;
      if (existingInterview) {
        response = await jobApi.updateInterviewSchedule(existingInterview.id, interviewData);
      } else {
        response = await jobApi.createInterviewSchedule(interviewData);
      }
      onSchedule(response);
    } catch (err) {
      console.error('Error in interview operation:', err);
      setError(err.response?.data?.error || 'Failed to schedule interview. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (existingInterview) {
      setIsSubmitting(true);
      try {
        const response = await jobApi.cancelInterviewSchedule(existingInterview.id);
        onSchedule(response);
      } catch (err) {
        console.error('Error cancelling interview:', err);
        setError(err.response?.data?.error || 'Failed to cancel interview. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      onCancel();
    }
  };

  return (
    <div className="p-4 bg-gray-50 rounded-md">
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-2 mb-4" role="alert">
          <p>{error}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Interview Date</label>
          <input
            type="date"
            value={interviewDate}
            onChange={(e) => setInterviewDate(e.target.value)}
            className="w-full border rounded px-3 py-2"
            min={today}
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Interview Time</label>
          <input
            type="time"
            value={interviewTime}
            onChange={(e) => setInterviewTime(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Interview Type</label>
          <select
            value={interviewType}
            onChange={(e) => setInterviewType(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          >
            <option value="AUDIO_ONLY">Audio Call</option>
            <option value="AUDIO_AND_VIDEO">Video Call</option>
          </select>
        </div>
        <div>
          <label className="block mb-1 font-medium">Notes (Optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border rounded px-3 py-2"
            rows="4"
            placeholder="Additional interview details..."
          />
        </div>
        <div className="flex space-x-4">
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-300"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processing...' : existingInterview ? 'Update Schedule' : 'Schedule Interview'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-300"
            disabled={isSubmitting}
          >
            {existingInterview ? 'Cancel Interview' : 'Cancel'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Hire confirmation modal component
const HireConfirmationModal = ({ applicant, jobPost, onHire, onCancel }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setError(null);
    
    const hireData = {
      application_id: applicant.id,
      job_id: jobPost.id,
      // Default values since we're simplifying
      proposed_salary: applicant.job_seeker.expected_salary || 0,
      start_date: new Date().toISOString().split('T')[0], // Today
      notes: null,
    };

    try {
      await onHire(hireData);
    } catch (err) {
      setError(err.message || 'Failed to hire candidate. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 bg-green-50 rounded-md border border-green-200">
      <h3 className="text-lg font-semibold text-green-800 mb-4">Hire {applicant.job_seeker.user.first_name} {applicant.job_seeker.user.last_name}</h3>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-2 mb-4" role="alert">
          <p>{error}</p>
        </div>
      )}
      
      <p className="text-gray-700 mb-4">
        Are you sure you want to hire this candidate? 
      </p>
      
      <div className="flex space-x-4">
        <button
          onClick={handleConfirm}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-300"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Processing...' : 'Confirm Hire'}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-300"
          disabled={isSubmitting}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

// Job Post Card Component
const JobPostCard = ({ 
  jobPost, 
  applicants,
  globalFilters,
  onScheduleInterview,
  onCompleteInterview,
  onHireCandidate,
  schedulingApplicantId,
  hiringApplicantId,
  onInterviewUpdateComplete,
  setSchedulingApplicantId,
  setHiringApplicantId,
  loading
}) => {
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [showAllApplicants, setShowAllApplicants] = useState(false);
  const [filteredApplicants, setFilteredApplicants] = useState([]);
  
  useEffect(() => {
    // Apply global filters to this job's applicants
    let filtered = applicants;
    
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

    if (globalFilters.interviewStatus !== 'All') {
      if (globalFilters.interviewStatus === 'NOT_SCHEDULED') {
        filtered = filtered.filter(app => !getActiveInterview(app.interviews));
      } else {
        filtered = filtered.filter(app => {
          const interview = getActiveInterview(app.interviews);
          return interview && interview.status === globalFilters.interviewStatus;
        });
      }
    }

    if (globalFilters.salaryMax) {
      filtered = filtered.filter(app => 
        app.job_seeker.expected_salary <= globalFilters.salaryMax
      );
    }

    if (globalFilters.salaryMin) {
      filtered = filtered.filter(app => 
        app.job_seeker.expected_salary >= globalFilters.salaryMin
      );
    }

    // Filter for hired status
    if (globalFilters.applicationStatus === 'HIRED') {
      filtered = filtered.filter(app => app.status === 'HIRED');
    } else if (globalFilters.applicationStatus === 'NOT_HIRED') {
      filtered = filtered.filter(app => app.status !== 'HIRED');
    }
    
    setFilteredApplicants(filtered);
  }, [applicants, globalFilters]);

  const handleRowClick = (id) => {
    setExpandedRowId(expandedRowId === id ? null : id);
    // Close any open interview forms if we're opening a different detail row
    if (schedulingApplicantId && schedulingApplicantId !== id) {
      setSchedulingApplicantId(null);
    }
    // Close any open hiring forms if we're opening a different detail row
    if (hiringApplicantId && hiringApplicantId !== id) {
      setHiringApplicantId(null);
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

  const formatDateTime = (date, time) => {
    if (!date || !time) return 'Not scheduled';
    const dateTime = new Date(`${date}T${time}`);
    return dateTime.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInterviewTypeLabel = (type) => {
    switch (type) {
      case 'AUDIO_ONLY':
        return 'Audio Call';
      case 'AUDIO_AND_VIDEO':
        return 'Video Call';
      default:
        return 'Call';
    }
  };

  const getActiveInterview = (interviews) => {
    if (!interviews || !Array.isArray(interviews)) return null;
    
    const activeInterview = interviews.find(
      interview => interview.status === 'SCHEDULED' || interview.status === 'RESCHEDULED'
    );
    
    if (activeInterview) return activeInterview;
    
    return interviews.length > 0 
      ? [...interviews].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
      : null;
  };

  // Display limited applicants initially (3) or all if expanded
  const displayApplicants = showAllApplicants 
    ? filteredApplicants 
    : filteredApplicants.slice(0, 3);

  // If no applicants match the filters for this job, don't show the job card
  if (filteredApplicants.length === 0 && !loading) {
    return null;
  }

  if (loading) {
    return (
      <div className="mb-8 p-4 border rounded-lg shadow-sm bg-white">
        <p className="text-center text-gray-500">Loading shortlisted applicants for {jobPost.title}...</p>
      </div>
    );
  }

  return (
    <div className="mb-8 border rounded-lg shadow-sm overflow-hidden">
      {/* Job Post Header */}
      <div className="bg-blue-50 p-4 border-b">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-blue-800">{jobPost.title}</h2>
          <div className="text-sm text-gray-600">
            {filteredApplicants.length} shortlisted applicant{filteredApplicants.length !== 1 ? 's' : ''}
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
                Skills Match
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Interview
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayApplicants.length > 0 ? (
              displayApplicants.map((applicant) => {
                const activeInterview = getActiveInterview(applicant.interviews);
                const hasActiveInterview = activeInterview && (
                  activeInterview.status === 'SCHEDULED' || 
                  activeInterview.status === 'RESCHEDULED'
                );
                const isCompleted = activeInterview && activeInterview.status === 'COMPLETED';
                const isHired = applicant.status === 'HIRED';
                
                return (
                  <React.Fragment key={applicant.id}>
                    <tr
                      onClick={() => handleRowClick(applicant.id)}
                      className={`hover:bg-gray-50 cursor-pointer ${expandedRowId === applicant.id ? 'bg-gray-50' : ''} ${isHired ? 'bg-green-50' : ''}`}
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
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <div className="relative w-20 h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="absolute h-full bg-green-500 rounded-full"
                              style={{ width: `${applicant.skill_match?.match_percentage || 0}%` }}
                            />
                          </div>
                          <span className="ml-2 text-sm">{applicant.skill_match?.match_percentage || 0}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <StatusBadge status={applicant.status} />
                      </td>
                      <td className="px-4 py-4">
                        {activeInterview ? (
                          <div>
                            <div className="flex items-center">
                              <InterviewBadge interview={activeInterview} />
                              <span className="ml-2 text-sm">
                                {activeInterview.status === 'CANCELLED' ? 
                                  <span className="line-through text-gray-400">
                                    {formatDateTime(activeInterview.interview_date, activeInterview.interview_time)}
                                  </span> : 
                                  formatDateTime(activeInterview.interview_date, activeInterview.interview_time)
                                }
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              {getInterviewTypeLabel(activeInterview.interview_type)}
                            </p>
                            {activeInterview.meeting_id && activeInterview.status !== 'CANCELLED' && activeInterview.status !== 'COMPLETED' && (
                              <JoinMeetingButton
                                meetingId={activeInterview.meeting_id}
                                interviewType={activeInterview.interview_type}
                                className="text-blue-600 hover:underline text-xs"
                                onClick={(e) => e.stopPropagation()}
                              />
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">Not scheduled</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="space-x-2">
                          {!isHired && (
                            <>
                              {!hasActiveInterview && !isCompleted && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onScheduleInterview(applicant.id, e);
                                  }}
                                  className="text-blue-600 hover:underline"
                                >
                                  Schedule Interview
                                </button>
                              )}
                              {hasActiveInterview && (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onScheduleInterview(applicant.id, e);
                                    }}
                                    className="text-blue-600 hover:underline"
                                  >
                                    Update Schedule
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onCompleteInterview(activeInterview.id, e);
                                    }}
                                    className="text-green-600 hover:underline ml-2"
                                  >
                                    Mark Completed
                                  </button>
                                </>
                              )}
                              {isCompleted && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setHiringApplicantId(applicant.id);
                                  }}
                                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                                >
                                  Hire Candidate
                                </button>
                              )}
                            </>
                          )}
                          {isHired && (
                            <span className="text-green-600 font-medium">Hired</span>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedRowId === applicant.id && (
                      <tr className="bg-gray-50">
                        <td colSpan="8" className="px-0 py-0">
                          <ApplicantDetails applicant={applicant} />
                        </td>
                      </tr>
                    )}
                    {schedulingApplicantId === applicant.id && (
                      <tr className="bg-gray-50">
                        <td colSpan="8" className="px-0 py-0">
                          <InterviewScheduleForm
                            applicationId={applicant.id}
                            onSchedule={onInterviewUpdateComplete}
                            onCancel={() => setSchedulingApplicantId(null)}
                            existingInterview={hasActiveInterview ? activeInterview : null}
                          />
                        </td>
                      </tr>
                    )}
                    {hiringApplicantId === applicant.id && (
                      <tr className="bg-gray-50">
                        <td colSpan="8" className="px-0 py-0">
                          <HireConfirmationModal
                            applicant={applicant}
                            jobPost={jobPost}
                            onHire={(hireData) => onHireCandidate(hireData)}
                            onCancel={() => setHiringApplicantId(null)}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan="8" className="px-4 py-4 text-center text-gray-500">
                  No shortlisted applicants match your filter criteria for this job.
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
export default function ShortlistedApplicants() {
  const [jobPosts, setJobPosts] = useState([]);
  const [applicantsByJob, setApplicantsByJob] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingJobs, setLoadingJobs] = useState({});
  const [schedulingApplicantId, setSchedulingApplicantId] = useState(null);
  const [hiringApplicantId, setHiringApplicantId] = useState(null);
  
  // Global filters - now with applicationStatus filter
  const [filters, setFilters] = useState({
    experience: 'All',
    searchTerm: '',
    skillMatchThreshold: 0,
    interviewStatus: 'All',
    applicationStatus: 'All',
    salaryMin: '',
    salaryMax: ''
  });

  // Dashboard stats - focused on shortlisted applicants
  const [stats, setStats] = useState({
    totalShortlisted: 0,
    totalInterviews: 0,
    interviewsScheduled: 0,
    interviewsCompleted: 0,
    needsScheduling: 0,
    hired: 0
  });

  useEffect(() => {
    fetchJobPosts();
  }, []);

  useEffect(() => {
    // Calculate stats whenever applicantsByJob changes
    calculateStats();
  }, [applicantsByJob]);

  const calculateStats = () => {
    let totalShortlisted = 0;
    let totalInterviews = 0;
    let interviewsScheduled = 0;
    let interviewsCompleted = 0;
    let needsScheduling = 0;
    let hired = 0;

    // Count applicants and interviews across all jobs
    Object.values(applicantsByJob).forEach(applicants => {
      // All applicants in this view are shortlisted
      totalShortlisted += applicants.length;
      
      // Count interviews and applicants without interviews
      applicants.forEach(app => {
        // Count hired applicants
        if (app.status === 'HIRED') {
          hired++;
        }
        
        if (app.interviews && app.interviews.length > 0) {
          totalInterviews += app.interviews.length;
          interviewsScheduled += app.interviews.filter(i => 
            i.status === 'SCHEDULED' || i.status === 'RESCHEDULED'
          ).length;
          interviewsCompleted += app.interviews.filter(i => i.status === 'COMPLETED').length;
          
          // Check if this applicant has any active interviews
          const hasActiveInterview = app.interviews.some(i => 
            i.status === 'SCHEDULED' || i.status === 'RESCHEDULED'
          );
          
          if (!hasActiveInterview && app.status !== 'HIRED') {
            needsScheduling++;
          }
        } else if (app.status !== 'HIRED') {
          // No interviews scheduled yet and not hired
          needsScheduling++;
        }
      });
    });

    setStats({
      totalShortlisted,
      totalInterviews,
      interviewsScheduled,
      interviewsCompleted,
      needsScheduling,
      hired
    });
  };

  const fetchJobPosts = async () => {
    try {
      setLoading(true);
      const response = await jobApi.getJobPostsList();
      const filteredJobs = response.filter(job => job.status === 'PUBLISHED' && !job.is_deleted);
      setJobPosts(filteredJobs);
      
      // Fetch shortlisted applicants for each job post
      const applicantsMap = {};
      await Promise.all(filteredJobs.map(async (job) => {
        setLoadingJobs(prev => ({...prev, [job.id]: true}));
        try {
          // Use the shortlisted API endpoint instead of all applicants
          const applicants = await jobApi.getShortlistedApplicants(job.id);
          applicantsMap[job.id] = applicants;
        } catch (err) {
          console.error(`Error fetching shortlisted applicants for job ${job.id}:`, err);
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

  const handleScheduleInterview = (applicantId, e) => {
    if (e) {
      e.stopPropagation();
    }
    setSchedulingApplicantId(prevId => prevId === applicantId ? null : applicantId);
    // Close any hiring form that might be open
    setHiringApplicantId(null);
  };

  const handleCompleteInterview = async (interviewId, e) => {
    if (e) {
      e.stopPropagation();
    }
    
    try {
      await jobApi.completeInterviewSchedule(interviewId);
      
      // Update local state
      const updatedApplicantsByJob = {...applicantsByJob};
      
      // Update the interview status in all jobs
      Object.keys(updatedApplicantsByJob).forEach(jobId => {
        updatedApplicantsByJob[jobId] = updatedApplicantsByJob[jobId].map(app => {
          if (app.interviews && app.interviews.some(interview => interview.id === interviewId)) {
            return {
              ...app,
              interviews: app.interviews.map(interview => 
                interview.id === interviewId 
                  ? { ...interview, status: 'COMPLETED', completed_at: new Date().toISOString() } 
                  : interview
              )
            };
          }
          return app;
        });
      });
      
      setApplicantsByJob(updatedApplicantsByJob);
    } catch (err) {
      setError(err.message || 'Failed to complete interview. Please try again.');
      console.error('Error completing interview:', err);
    }
  };

  const handleHireCandidate = async (hireData) => {
    try {
      // Update the application status directly without calling the API
      // We'll modify the client-side state immediately for a better UX
      const updatedApplicantsByJob = {...applicantsByJob};
      
      Object.keys(updatedApplicantsByJob).forEach(jobId => {
        updatedApplicantsByJob[jobId] = updatedApplicantsByJob[jobId].map(app => {
          if (app.id === hireData.application_id) {
            return {
              ...app,
              status: 'HIRED',
              hire_details: {
                proposed_salary: hireData.proposed_salary,
                start_date: hireData.start_date,
                notes: hireData.notes,
                hired_at: new Date().toISOString()
              }
            };
          }
          return app;
        });
      });
      
      // Update state to reflect changes immediately
      setApplicantsByJob(updatedApplicantsByJob);
      setHiringApplicantId(null);
      
      // Now call the API to update on the server (this is more resilient to network issues)
      try {
        await jobApi.updateApplicationStatus(hireData.application_id, {
          status: 'HIRED',
          hire_details: {
            proposed_salary: hireData.proposed_salary,
            start_date: hireData.start_date,
            notes: hireData.notes,
            hired_at: new Date().toISOString()
          }
        });
      } catch (apiError) {
        // If the API call fails, show an error but don't revert the UI
        // This prevents flickering and maintains better UX
        setError('Candidate was hired locally but server update failed. Please refresh to confirm status.');
        console.error('Error updating server with hired status:', apiError);
      }
      
      // Recalculate stats
      calculateStats();
    } catch (err) {
      setError(err.message || 'Failed to hire candidate. Please try again.');
      console.error('Error hiring candidate:', err);
      throw err; // Re-throw to be caught by the modal
    }
  };

  const handleInterviewUpdateComplete = (updatedInterview) => {
    const updatedApplicantsByJob = {...applicantsByJob};
    
    // Update the interview in all jobs
    Object.keys(updatedApplicantsByJob).forEach(jobId => {
      updatedApplicantsByJob[jobId] = updatedApplicantsByJob[jobId].map(app => {
        if (app.id === updatedInterview.application) {
          // If there are no interviews yet, initialize with an empty array
          const interviews = app.interviews || [];
          
          // Filter out the updated interview if it already exists
          const filteredInterviews = interviews.filter(interview => 
            interview.id !== updatedInterview.id
          );
          
          // Add the updated interview to the beginning
          return {
            ...app,
            interviews: [updatedInterview, ...filteredInterviews]
          };
        }
        return app;
      });
    });
    
    setApplicantsByJob(updatedApplicantsByJob);
    setSchedulingApplicantId(null);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      experience: 'All',
      searchTerm: '',
      skillMatchThreshold: 0,
      interviewStatus: 'All',
      applicationStatus: 'All',
      salaryMin: '',
      salaryMax: ''
    });
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Shortlisted Applicants Dashboard</h1>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p>{error}</p>
          <button 
            className="text-sm underline mt-1" 
            onClick={() => setError(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Stats Cards - now with hired count */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-500">Shortlisted Applicants</div>
          <div className="mt-1 text-2xl font-semibold text-green-600">{stats.totalShortlisted}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-500">Need Scheduling</div>
          <div className="mt-1 text-2xl font-semibold text-yellow-600">{stats.needsScheduling}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-500">Total Interviews</div>
          <div className="mt-1 text-2xl font-semibold text-blue-600">{stats.totalInterviews}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-500">Scheduled</div>
          <div className="mt-1 text-2xl font-semibold text-orange-600">{stats.interviewsScheduled}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-500">Completed</div>
          <div className="mt-1 text-2xl font-semibold text-purple-600">{stats.interviewsCompleted}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-green-200">
          <div className="text-sm font-medium text-gray-500">Hired</div>
          <div className="mt-1 text-2xl font-semibold text-emerald-600">{stats.hired}</div>
        </div>
      </div>

      {/* Filter Section - added application status filter */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Filter Shortlisted Applicants</h2>
          <button
            onClick={resetFilters}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
          >
            Reset All Filters
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Application Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Application Status</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={filters.applicationStatus}
              onChange={(e) => handleFilterChange('applicationStatus', e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="NOT_HIRED">Not Hired</option>
              <option value="HIRED">Hired</option>
            </select>
          </div>
          
          {/* Interview Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Interview Status</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={filters.interviewStatus}
              onChange={(e) => handleFilterChange('interviewStatus', e.target.value)}
            >
              <option value="All">All Interview Statuses</option>
              <option value="NOT_SCHEDULED">Not Scheduled</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="RESCHEDULED">Rescheduled</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
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
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          
          {/* Salary Range */}
          <div className="flex gap-2 items-center">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Salary (₹)</label>
              <input
                type="number"
                className="w-full border rounded px-3 py-2"
                placeholder="Min"
                value={filters.salaryMin}
                onChange={(e) => handleFilterChange('salaryMin', e.target.value ? Number(e.target.value) : '')}
              />
            </div>
            <span className="mt-6">-</span>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Salary (₹)</label>
              <input
                type="number"
                className="w-full border rounded px-3 py-2"
                placeholder="Max"
                value={filters.salaryMax}
                onChange={(e) => handleFilterChange('salaryMax', e.target.value ? Number(e.target.value) : '')}
              />
            </div>
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
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
            <p>Loading shortlisted applicants...</p>
          </div>
        </div>
      ) : jobPosts.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-md border">
          <p className="text-gray-500">No job posts found.</p>
        </div>
      ) : (
        <div>
          {/* Applicants by Job */}
          {jobPosts.map((jobPost) => {
            const applicants = applicantsByJob[jobPost.id] || [];
            if (applicants.length === 0 && !loadingJobs[jobPost.id]) return null;
            
            return (
              <JobPostCard
                key={jobPost.id}
                jobPost={jobPost}
                applicants={applicants}
                globalFilters={filters}
                onScheduleInterview={handleScheduleInterview}
                onCompleteInterview={handleCompleteInterview}
                onHireCandidate={handleHireCandidate}
                schedulingApplicantId={schedulingApplicantId}
                hiringApplicantId={hiringApplicantId}
                onInterviewUpdateComplete={handleInterviewUpdateComplete}
                setSchedulingApplicantId={setSchedulingApplicantId}
                setHiringApplicantId={setHiringApplicantId}
                loading={loadingJobs[jobPost.id]}
              />
            );
          })}
          
          {/* If all job cards were filtered out */}
          {jobPosts.every(jobPost => 
            (applicantsByJob[jobPost.id] || []).length === 0 && !loadingJobs[jobPost.id]
          ) && (
            <div className="text-center p-8 bg-gray-50 rounded-md border">
              <p className="text-gray-500">No shortlisted applicants found for any job post.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}