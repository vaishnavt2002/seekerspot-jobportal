import React, { useState, useEffect } from 'react';
import jobApi from '../../api/jobApi';
import JoinMeetingButton from '../JoinMeetingButton';

// Sub-component to display applicant details
const ApplicantDetails = ({ applicant }) => {
  return (
    <div className="space-y-4 p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Personal Information</h3>
          <p><strong>Experience:</strong> {applicant.job_seeker.experience} years</p>
          <p><strong>Expected Salary:</strong> ₹{applicant.job_seeker.expected_salary}</p>
          <p><strong>Current Salary:</strong> {applicant.job_seeker.current_salary ? `₹${applicant.job_seeker.current_salary}` : 'Not provided'}</p>
          <p><strong>Availability:</strong> {applicant.job_seeker.is_available ? 'Available' : 'Not Available'}</p>
        </div>
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
      {applicant.job_seeker.summary && (
        <div>
          <h3 className="font-semibold text-lg">Professional Summary</h3>
          <p>{applicant.job_seeker.summary}</p>
        </div>
      )}
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

// Sub-component for interview scheduling form
const InterviewScheduleForm = ({ applicationId, onSchedule, onCancel, existingInterview }) => {
  const [interviewDate, setInterviewDate] = useState(existingInterview?.interview_date || '');
  const [interviewTime, setInterviewTime] = useState(existingInterview?.interview_time || '');
  const [interviewType, setInterviewType] = useState(existingInterview?.interview_type || 'AUDIO_AND_VIDEO');
  const [notes, setNotes] = useState(existingInterview?.notes || '');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
            <option value="AUDIO_ONLY">Audio Only</option>
            <option value="VIDEO_ONLY">Video Only</option>
            <option value="AUDIO_AND_VIDEO">Audio and Video</option>
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

// Main component
export default function ShortlistedApplicants() {
  const [jobPosts, setJobPosts] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [schedulingApplicantId, setSchedulingApplicantId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchJobPosts();
  }, []);

  useEffect(() => {
    if (selectedJobId) {
      fetchShortlistedApplicants(selectedJobId);
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
    } catch (err) {
      setError(err.message || 'Failed to fetch job posts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchShortlistedApplicants = async (jobId) => {
    try {
      setLoading(true);
      const response = await jobApi.getShortlistedApplicants(jobId);
      setApplicants(response);
    } catch (err) {
      setError(err.message || 'Failed to fetch shortlisted applicants. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (id) => {
    setExpandedRowId(expandedRowId === id ? null : id);
  };

  const handleScheduleInterview = (applicantId, e) => {
    if (e) {
      e.stopPropagation();
    }
    setSchedulingApplicantId(prevId => prevId === applicantId ? null : applicantId);
  };

  const handleInterviewUpdateComplete = (updatedInterview) => {
    const updatedApplicants = applicants.map(applicant => {
      if (applicant.id === updatedInterview.application) {
        const filteredInterviews = applicant.interviews.filter(
          interview => interview.id !== updatedInterview.id
        );
        return {
          ...applicant,
          interviews: [updatedInterview, ...filteredInterviews]
        };
      }
      return applicant;
    });
    
    setApplicants(updatedApplicants);
    setSchedulingApplicantId(null);
  };

  const handleCompleteInterview = async (interviewId, e) => {
    if (e) {
      e.stopPropagation();
    }
    
    try {
      const response = await jobApi.completeInterviewSchedule(interviewId);
      const updatedApplicants = applicants.map(applicant => {
        const updatedInterviews = applicant.interviews.map(interview => {
          if (interview.id === interviewId) {
            return {
              ...interview,
              status: 'COMPLETED',
              completed_at: new Date().toISOString()
            };
          }
          return interview;
        });
        return {
          ...applicant,
          interviews: updatedInterviews
        };
      });
      
      setApplicants(updatedApplicants);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to mark interview as completed. Please try again.');
    }
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
        return 'Audio Only';
      case 'VIDEO_ONLY':
        return 'Video Only';
      case 'AUDIO_AND_VIDEO':
        return 'Audio and Video';
      default:
        return 'Unknown';
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

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Shortlisted Applicants</h1>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p>{error}</p>
          <button 
            className="text-sm underline mt-1" 
            onClick={() => setError(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="mb-6">
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
              {job.title}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <p>Loading...</p>
        </div>
      ) : selectedJobId && applicants.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-md border">
          <p className="text-gray-500">No shortlisted applicants found for this job post.</p>
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
                <th className="px-4 py-2">Interview Schedule</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {applicants.map((applicant) => {
                const activeInterview = getActiveInterview(applicant.interviews);
                const hasActiveInterview = activeInterview && (
                  activeInterview.status === 'SCHEDULED' || 
                  activeInterview.status === 'RESCHEDULED'
                );
                const isCompleted = activeInterview && activeInterview.status === 'COMPLETED';
                
                return (
                  <React.Fragment key={applicant.id}>
                    <tr
                      onClick={() => handleRowClick(applicant.id)}
                      className="hover:bg-gray-50 cursor-pointer border-b"
                    >
                      <td className="px-4 py-2">{applicant.job_seeker.user.first_name} {applicant.job_seeker.user.last_name}</td>
                      <td className="px-4 py-2">{applicant.job_seeker.user.email}</td>
                      <td className="px-4 py-2">{applicant.job_seeker.experience} yrs</td>
                      <td className="px-4 py-2">₹{applicant.job_seeker.expected_salary}</td>
                      <td className="px-4 py-2">
                        {activeInterview ? (
                          <div>
                            <span className={activeInterview.status === 'CANCELLED' ? 'line-through text-gray-400' : ''}>
                              {formatDateTime(activeInterview.interview_date, activeInterview.interview_time)}
                            </span>
                            {activeInterview.status === 'RESCHEDULED' && ' (Rescheduled)'}
                            {activeInterview.status === 'COMPLETED' && ' (Completed)'}
                            {activeInterview.status === 'CANCELLED' && ' (Cancelled)'}
                            <p className="text-sm text-gray-600">Type: {getInterviewTypeLabel(activeInterview.interview_type)}</p>
                            {activeInterview.meeting_id && (
                              <p className="text-sm text-gray-600">Meeting ID: {activeInterview.meeting_id}</p>
                            )}
                            {activeInterview.meeting_id && activeInterview.status !== 'CANCELLED' && activeInterview.status !== 'COMPLETED' && (
                              <JoinMeetingButton
                                meetingId={activeInterview.meeting_id}
                                interviewType={activeInterview.interview_type}
                                className="text-blue-600 hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              />
                            )}
                          </div>
                        ) : (
                          'Not scheduled'
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex space-x-2">
                          {!hasActiveInterview && !isCompleted && (
                            <button
                              onClick={(e) => handleScheduleInterview(applicant.id, e)}
                              className="text-blue-600 hover:underline"
                            >
                              Schedule Interview
                            </button>
                          )}
                          {hasActiveInterview && (
                            <>
                              <button
                                onClick={(e) => handleScheduleInterview(applicant.id, e)}
                                className="text-blue-600 hover:underline"
                              >
                                Update Schedule
                              </button>
                              <button
                                onClick={(e) => handleCompleteInterview(activeInterview.id, e)}
                                className="text-green-600 hover:underline"
                              >
                                Mark as Completed
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedRowId === applicant.id && (
                      <tr className="bg-gray-50">
                        <td colSpan="6" className="px-0 py-0">
                          <ApplicantDetails applicant={applicant} />
                        </td>
                      </tr>
                    )}
                    {schedulingApplicantId === applicant.id && (
                      <tr className=" unnoticedbg-gray-50">
                        <td colSpan="6" className="px-0 py-0">
                          <InterviewScheduleForm
                            applicationId={applicant.id}
                            onSchedule={handleInterviewUpdateComplete}
                            onCancel={() => setSchedulingApplicantId(null)}
                            existingInterview={hasActiveInterview ? activeInterview : null}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}