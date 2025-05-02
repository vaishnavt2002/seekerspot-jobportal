import React, { useState, useEffect } from 'react';
import jobApi from '../../api/jobApi';
import { format } from 'date-fns';
import JoinMeetingButton from '../JoinMeetingButton';

const AppliedJobs = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await jobApi.getJobSeekerApplications();
        setApplications(response);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchApplications();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">My Applied Jobs</h1>
      {applications.length === 0 ? (
        <p className="text-gray-600">You haven't applied to any jobs yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {applications.map((application) => (
            <div
              key={application.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center mb-4">
                {application.company_logo ? (
                  <img
                    src={application.company_logo}
                    alt={`${application.company_name} logo`}
                    className="w-12 h-12 rounded-full mr-4 object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-200 mr-4 flex items-center justify-center">
                    <span className="text-gray-500 font-semibold">
                      {application.company_name[0]}
                    </span>
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    {application.job_title}
                  </h2>
                  <p className="text-gray-600">{application.company_name}</p>
                </div>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-500">
                  Applied on: {format(new Date(application.applied_at), 'PPP')}
                </p>
                <p className="text-sm font-medium text-gray-700">
                  Status:{' '}
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs ${
                      application.status === 'HIRED'
                        ? 'bg-green-100 text-green-800'
                        : application.status === 'REJECTED' || application.status === 'WITHDRAWN'
                        ? 'bg-red-100 text-red-800'
                        : application.status === 'SHORTLISTED'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {application.status.replace('_', ' ').toLowerCase()}
                  </span>
                </p>
              </div>
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700">Job Details</h3>
                <p className="text-sm text-gray-600">
                  Location: {application.job_details.location}
                </p>
                <p className="text-sm text-gray-600">
                  Type: {application.job_details.job_type.toLowerCase()}
                </p>
                <p className="text-sm text-gray-600">
                  Employment: {application.job_details.employment_type.toLowerCase()}
                </p>
                <p className="text-sm text-gray-600">
                  Salary: ${application.job_details.min_salary.toLocaleString()} - $
                  {application.job_details.max_salary.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">
                  Deadline:{' '}
                  {format(new Date(application.job_details.application_deadline), 'PPP')}
                </p>
                <p className="text-sm text-gray-600">
                  Skills:{' '}
                  {application.job_details.skills.map((skill) => skill.name).join(', ')}
                </p>
              </div>
              {application.interviews.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    Interview Schedule
                  </h3>
                  {application.interviews.map((interview) => (
                    <div
                      key={interview.id}
                      className="bg-gray-50 p-4 rounded-md mb-2"
                    >
                      <p className="text-sm text-gray-600">
                        Date: {format(new Date(interview.interview_date), 'PPP')}
                      </p>
                      <p className="text-sm text-gray-600">
                        Time: {interview.interview_time}
                      </p>
                      <p className="text-sm text-gray-600">
                        Type: {interview.interview_type.replace('_', ' ').toLowerCase()}
                      </p>
                      <p className="text-sm text-gray-600">
                        Status:{' '}
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs ${
                            interview.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-800'
                              : interview.status === 'CANCELLED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {interview.status.toLowerCase()}
                        </span>
                      </p>
                      {interview.notes && (
                        <p className="text-sm text-gray-600 mt-2">
                          Notes: {interview.notes}
                        </p>
                      )}
                      {(interview.status === 'SCHEDULED' ||
                          interview.status === 'RESCHEDULED') && (
                          <JoinMeetingButton
                            meetingId={interview.meeting_id}
                            interviewType={interview.interview_type}
                            className="mt-2 inline-block bg-blue-500 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-600 transition-colors"
                          />
                        )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AppliedJobs;