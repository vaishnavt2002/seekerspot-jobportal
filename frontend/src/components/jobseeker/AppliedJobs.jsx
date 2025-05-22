import React, { useState, useEffect } from 'react';
import { format, parseISO, isAfter, isBefore, isToday } from 'date-fns';
import jobApi from '../../api/jobApi';
import JoinMeetingButton from '../JoinMeetingButton';

const AppliedJobs = () => {
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedApplicationId, setExpandedApplicationId] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [expandedInterviewId, setExpandedInterviewId] = useState(null);
  const media_url = import.meta.env.VITE_BASE_URL;
  
  // Filters
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    dateRange: 'all',
    custom: {
      startDate: '',
      endDate: ''
    }
  });
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    shortlisted: 0,
    rejected: 0,
    applied: 0,
    withdrawn: 0,
    pending: 0,
    upcomingInterviews: 0
  });

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await jobApi.getJobSeekerApplications();
        setApplications(response);
        setFilteredApplications(response);
        calculateStats(response);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchApplications();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, applications, activeTab]);

  const calculateStats = (apps) => {
    const statsData = {
      total: apps.length,
      shortlisted: apps.filter(app => app.status === 'SHORTLISTED').length,
      rejected: apps.filter(app => app.status === 'REJECTED').length,
      applied: apps.filter(app => app.status === 'APPLIED').length,
      withdrawn: apps.filter(app => app.status === 'WITHDRAWN').length,
      pending: apps.filter(app => 
        app.status !== 'REJECTED' && app.status !== 'WITHDRAWN'
      ).length,
      upcomingInterviews: apps.filter(app => 
        app.interviews && app.interviews.some(interview => 
          (interview.status === 'SCHEDULED' || interview.status === 'RESCHEDULED') &&
          isAfter(parseISO(interview.interview_date), new Date())
        )
      ).length
    };
    setStats(statsData);
  };

  const applyFilters = () => {
    let result = [...applications];
    
    // Filter by tab
    if (activeTab === 'upcoming-interviews') {
      result = result.filter(app => 
        app.interviews && app.interviews.some(interview => 
          (interview.status === 'SCHEDULED' || interview.status === 'RESCHEDULED') &&
          (isAfter(parseISO(interview.interview_date), new Date()) || 
          isToday(parseISO(interview.interview_date)))
        )
      );
    } else if (activeTab === 'past-interviews') {
      result = result.filter(app => 
        app.interviews && app.interviews.some(interview => 
          interview.status === 'COMPLETED' || 
          (isBefore(parseISO(interview.interview_date), new Date()) && 
          !isToday(parseISO(interview.interview_date)))
        )
      );
    }
    
    // Apply status filter
    if (filters.status !== 'all') {
      result = result.filter(app => app.status === filters.status);
    }
    
    // Apply date range filter
    if (filters.dateRange === 'last-week') {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      result = result.filter(app => isAfter(parseISO(app.applied_at), lastWeek));
    } else if (filters.dateRange === 'last-month') {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      result = result.filter(app => isAfter(parseISO(app.applied_at), lastMonth));
    } else if (filters.dateRange === 'custom' && filters.custom.startDate && filters.custom.endDate) {
      const startDate = parseISO(filters.custom.startDate);
      const endDate = parseISO(filters.custom.endDate);
      result = result.filter(app => {
        const appliedDate = parseISO(app.applied_at);
        return (isAfter(appliedDate, startDate) || isToday(appliedDate, startDate)) && 
               (isBefore(appliedDate, endDate) || isToday(appliedDate, endDate));
      });
    }
    
    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(app => 
        app.job_title.toLowerCase().includes(searchLower) ||
        app.company_name.toLowerCase().includes(searchLower) ||
        app.job_details.location.toLowerCase().includes(searchLower) ||
        (app.job_details.skills && app.job_details.skills.some(skill => 
          skill.name.toLowerCase().includes(searchLower)
        ))
      );
    }
    
    setFilteredApplications(result);
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCustomDateChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      custom: {
        ...prev.custom,
        [name]: value
      }
    }));
  };

  const toggleExpandApplication = (id) => {
    setExpandedApplicationId(prev => prev === id ? null : id);
  };

  const toggleExpandInterview = (id) => {
    setExpandedInterviewId(prev => prev === id ? null : id);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'HIRED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
      case 'WITHDRAWN':
        return 'bg-red-100 text-red-800';
      case 'SHORTLISTED':
        return 'bg-blue-100 text-blue-800';
      case 'APPLIED':
        return 'bg-yellow-100 text-yellow-800';
      case 'REVIEWING':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getInterviewStatusBadgeClass = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800';
      case 'RESCHEDULED':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatInterviewType = (type) => {
    switch (type) {
      case 'AUDIO_ONLY':
        return 'Audio Call';
      case 'AUDIO_AND_VIDEO':
        return 'Video Call';
      default:
        return type.replace('_', ' ').toLowerCase();
    }
  };

  const renderAllApplications = () => (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Company & Job
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date Applied
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Next Interview
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredApplications.length === 0 ? (
            <tr>
              <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                No applications found matching your filters.
              </td>
            </tr>
          ) : (
            filteredApplications.map((application) => {
              // Find the next upcoming interview
              let nextInterview = null;
              
              if (application.interviews && application.interviews.length > 0) {
                const upcomingInterviews = application.interviews
                  .filter(i => 
                    (i.status === 'SCHEDULED' || i.status === 'RESCHEDULED') && 
                    (isAfter(parseISO(i.interview_date), new Date()) || isToday(parseISO(i.interview_date)))
                  )
                  .sort((a, b) => {
                    const dateA = new Date(`${a.interview_date}T${a.interview_time}`);
                    const dateB = new Date(`${b.interview_date}T${b.interview_time}`);
                    return dateA - dateB;
                  });
                
                if (upcomingInterviews.length > 0) {
                  nextInterview = upcomingInterviews[0];
                }
              }
              
              return (
                <React.Fragment key={application.id}>
                  <tr 
                    className={`hover:bg-gray-50 cursor-pointer ${expandedApplicationId === application.id ? 'bg-blue-50' : ''}`}
                    onClick={() => toggleExpandApplication(application.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {application.company_logo ? (
                        <img src={application.company_logo} alt={`${application.company_name} logo`} className="h-10 w-10 rounded-full mr-3" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                            <span className="text-sm font-medium text-gray-500">
                              {application.company_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{application.job_title}</div>
                          <div className="text-sm text-gray-500">{application.company_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(parseISO(application.applied_at), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(application.status)}`}>
                        {application.status.replace('_', ' ').toLowerCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {nextInterview ? (
                        <div>
                          <div className="font-medium text-gray-800">
                            {format(parseISO(nextInterview.interview_date), 'MMM dd, yyyy')}
                          </div>
                          <div className="text-gray-600">{nextInterview.interview_time}</div>
                          <div className="flex items-center mt-1">
                            <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
                              isToday(parseISO(nextInterview.interview_date)) ? 'bg-green-500' : 'bg-blue-500'
                            }`}></span>
                            <span className="text-xs text-gray-600">
                              {formatInterviewType(nextInterview.interview_type)} {isToday(parseISO(nextInterview.interview_date)) ? '(Today)' : ''}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div>
                          {application.interviews && application.interviews.length > 0 ? (
                            application.interviews.some(i => i.status === 'COMPLETED') ? (
                              <div>
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                  Interviews completed
                                </span>
                              </div>
                            ) : (
                              <div>
                                <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded">
                                  No upcoming interview
                                </span>
                              </div>
                            )
                          ) : (
                            <span className="text-gray-400">None scheduled</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {nextInterview && nextInterview.meeting_id && (
                        <JoinMeetingButton
                          meetingId={nextInterview.meeting_id}
                          interviewType={nextInterview.interview_type}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:border-blue-700 focus:shadow-outline-blue active:bg-blue-700 transition ease-in-out duration-150"
                        />
                      )}
                    </td>
                  </tr>
                  {expandedApplicationId === application.id && (
                    <tr>
                      <td colSpan="5" className="px-0 py-0">
                        <div className="px-6 py-4 bg-blue-50">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h3 className="text-lg font-medium text-gray-900 mb-2">Job Details</h3>
                              <div className="grid grid-cols-2 gap-2 mb-4">
                                <div className="text-sm text-gray-700">
                                  <span className="font-medium">Location:</span> {application.job_details.location}
                                </div>
                                <div className="text-sm text-gray-700">
                                  <span className="font-medium">Type:</span> {application.job_details.job_type.toLowerCase()}
                                </div>
                                <div className="text-sm text-gray-700">
                                  <span className="font-medium">Employment:</span> {application.job_details.employment_type.toLowerCase()}
                                </div>
                                <div className="text-sm text-gray-700">
                                  <span className="font-medium">Salary:</span> ₹{application.job_details.min_salary.toLocaleString()} - ₹{application.job_details.max_salary.toLocaleString()}
                                </div>
                                <div className="text-sm text-gray-700 col-span-2">
                                  <span className="font-medium">Deadline:</span> {format(parseISO(application.job_details.application_deadline), 'MMM dd, yyyy')}
                                </div>
                                <div className="text-sm text-gray-700 col-span-2">
                                  <span className="font-medium">Skills:</span> {application.job_details.skills.map(skill => skill.name).join(', ')}
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h3 className="text-lg font-medium text-gray-900 mb-2">Interview Schedule</h3>
                              {application.interviews && application.interviews.length > 0 ? (
                                <div className="space-y-3">
                                  {application.interviews.map((interview) => (
                                    <div 
                                      key={interview.id} 
                                      className="bg-white p-3 rounded border border-gray-200 shadow-sm"
                                    >
                                      <div className="flex justify-between items-center">
                                        <div>
                                          <div className="text-sm font-medium text-gray-900">
                                            {format(parseISO(interview.interview_date), 'MMM dd, yyyy')} at {interview.interview_time}
                                          </div>
                                          <div className="text-xs text-gray-500">
                                            {formatInterviewType(interview.interview_type)}
                                          </div>
                                        </div>
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getInterviewStatusBadgeClass(interview.status)}`}>
                                          {interview.status.toLowerCase()}
                                        </span>
                                      </div>
                                      {interview.notes && (
                                        <div className="mt-2 text-sm text-gray-600">
                                          <div className="font-medium">Notes:</div>
                                          <div>{interview.notes}</div>
                                        </div>
                                      )}
                                      {interview.meeting_id && 
                                       (interview.status === 'SCHEDULED' || interview.status === 'RESCHEDULED') && (
                                        <div className="mt-2">
                                          <JoinMeetingButton
                                            meetingId={interview.meeting_id}
                                            interviewType={interview.interview_type}
                                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:border-blue-700 focus:shadow-outline-blue active:bg-blue-700 transition ease-in-out duration-150"
                                          />
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-sm text-gray-500">No interviews scheduled yet.</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );

  const renderInterviews = () => {
    // Filter for upcoming or past interviews based on active tab
    const relevantApplications = filteredApplications.filter(app => 
      app.interviews && app.interviews.length > 0
    );

    if (relevantApplications.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          {activeTab === 'upcoming-interviews' 
            ? "You don't have any upcoming interviews." 
            : "You don't have any past interviews."}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {relevantApplications.map(application => {
          // Filter interviews based on tab
          const relevantInterviews = application.interviews.filter(interview => {
            if (activeTab === 'upcoming-interviews') {
              return (interview.status === 'SCHEDULED' || interview.status === 'RESCHEDULED') &&
                (isAfter(parseISO(interview.interview_date), new Date()) || 
                isToday(parseISO(interview.interview_date)));
            } else {
              return interview.status === 'COMPLETED' || 
                (isBefore(parseISO(interview.interview_date), new Date()) && 
                !isToday(parseISO(interview.interview_date)));
            }
          });

          if (relevantInterviews.length === 0) return null;

          return (
            <div key={application.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center">
                  {application.company_logo ? (
                    <img src={application.company_logo} alt={`${application.company_name} logo`} className="h-10 w-10 rounded-full mr-3" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                      <span className="text-sm font-medium text-gray-500">
                        {application.company_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <div className="text-lg font-medium text-gray-900">{application.job_title}</div>
                    <div className="text-sm text-gray-500">{application.company_name}</div>
                  </div>
                  <div className="ml-auto">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(application.status)}`}>
                      {application.status.replace('_', ' ').toLowerCase()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {relevantInterviews.map(interview => (
                  <div 
                    key={interview.id} 
                    className={`px-6 py-4 cursor-pointer hover:bg-gray-50 ${expandedInterviewId === interview.id ? 'bg-blue-50' : ''}`}
                    onClick={() => toggleExpandInterview(interview.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {format(parseISO(interview.interview_date), 'EEEE, MMMM dd, yyyy')} at {interview.interview_time}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatInterviewType(interview.interview_type)}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getInterviewStatusBadgeClass(interview.status)}`}>
                          {interview.status.toLowerCase()}
                        </span>
                        {interview.meeting_id && 
                         (interview.status === 'SCHEDULED' || interview.status === 'RESCHEDULED') && (
                          <JoinMeetingButton
                            meetingId={interview.meeting_id}
                            interviewType={interview.interview_type}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:border-blue-700 focus:shadow-outline-blue active:bg-blue-700 transition ease-in-out duration-150"
                          />
                        )}
                      </div>
                    </div>

                    {expandedInterviewId === interview.id && (
                      <div className="mt-4 bg-blue-50 p-4 rounded">
                        {interview.notes && (
                          <div className="mb-3">
                            <div className="text-sm font-medium text-gray-900">Notes:</div>
                            <div className="text-sm text-gray-700 mt-1">{interview.notes}</div>
                          </div>
                        )}
                        <div className="text-sm font-medium text-gray-900">Job Details:</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                          <div className="text-sm text-gray-700">
                            <span className="font-medium">Location:</span> {application.job_details.location}
                          </div>
                          <div className="text-sm text-gray-700">
                            <span className="font-medium">Type:</span> {application.job_details.job_type.toLowerCase()}
                          </div>
                          <div className="text-sm text-gray-700">
                            <span className="font-medium">Employment:</span> {application.job_details.employment_type.toLowerCase()}
                          </div>
                          <div className="text-sm text-gray-700">
                            <span className="font-medium">Applied on:</span> {format(parseISO(application.applied_at), 'MMM dd, yyyy')}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm leading-5 text-red-700">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Job Applications</h1>
        <p className="text-gray-600 mt-1">Track your applications and upcoming interviews</p>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Total Applications</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Shortlisted</div>
          <div className="mt-1 text-2xl font-semibold text-blue-600">{stats.shortlisted}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Pending</div>
          <div className="mt-1 text-2xl font-semibold text-yellow-600">{stats.pending}</div>
        </div>
        
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Filters</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status-filter"
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="APPLIED">Applied</option>
              <option value="REVIEWING">Reviewing</option>
              <option value="SHORTLISTED">Shortlisted</option>
              <option value="REJECTED">Rejected</option>
              <option value="WITHDRAWN">Withdrawn</option>
              <option value="HIRED">Hired</option>
            </select>
          </div>
          <div>
            <label htmlFor="date-range-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Date Range
            </label>
            <select
              id="date-range-filter"
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={filters.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="last-week">Last Week</option>
              <option value="last-month">Last Month</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          {filters.dateRange === 'custom' && (
            <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  id="start-date"
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  value={filters.custom.startDate}
                  onChange={(e) => handleCustomDateChange('startDate', e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  id="end-date"
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  value={filters.custom.endDate}
                  onChange={(e) => handleCustomDateChange('endDate', e.target.value)}
                />
              </div>
            </div>
          )}
          <div className={filters.dateRange === 'custom' ? 'md:col-start-1 md:col-span-4' : ''}>
            <label htmlFor="search-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              id="search-filter"
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search by job title, company, location, skills..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
        </div>
        {(filters.status !== 'all' || filters.dateRange !== 'all' || filters.search) && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-right">
            <button
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => {
                setFilters({
                  status: 'all',
                  search: '',
                  dateRange: 'all',
                  custom: {
                    startDate: '',
                    endDate: ''
                  }
                });
              }}
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex">
          <button
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'all'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } mr-8`}
            onClick={() => setActiveTab('all')}
          >
            All Applications
          </button>
          <button
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'upcoming-interviews'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } mr-8`}
            onClick={() => setActiveTab('upcoming-interviews')}
          >
            Upcoming Interviews
          </button>
          <button
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'past-interviews'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('past-interviews')}
          >
            Past Interviews
          </button>
        </nav>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'all' ? renderAllApplications() : renderInterviews()}
    </div>
  );
};

export default AppliedJobs;