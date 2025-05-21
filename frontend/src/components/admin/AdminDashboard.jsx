import React, { useState, useEffect } from 'react';
import analyticsApi from '../../api/analyticsApi';
import StatCard from './StatCard';
import UserGrowthChart from './UserGrowthChart';
import JobPostChart from './JobPostChart';
import ApplicationChart from './ApplicationChart';
import DistributionChart from './DistributionChart';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statsPeriod, setStatsPeriod] = useState(30);
  const [growthInterval, setGrowthInterval] = useState('month');
  const growthMonths = 12;
  
  const [dashboardStats, setDashboardStats] = useState({
    total_stats: {
      users: 0,
      job_seekers: 0,
      job_providers: 0,
      job_posts: 0,
      applications: 0,
      interviews: 0,
    },
    growth: {
      users: 0,
      job_seekers: 0,
      job_providers: 0,
      job_posts: 0,
      applications: 0,
      interviews: 0,
    },
    distributions: {
      application_status: [],
      job_post_status: [],
      job_post_domain: []
    }
  });
  
  const [userGrowthData, setUserGrowthData] = useState({
    all_users: [],
    job_seekers: [],
    job_providers: []
  });
  
  const [jobPostAnalytics, setJobPostAnalytics] = useState({
    job_posts_over_time: [],
    job_posts_by_domain: [],
    job_posts_by_type: [],
    job_posts_by_employment: []
  });
  
  const [applicationAnalytics, setApplicationAnalytics] = useState({
    applications_over_time: [],
    applications_by_status: [],
    top_job_posts: [],
    conversion_rate: 0,
    rejection_rate: 0,
    total_applications: 0,
    hired_count: 0,
    rejection_count: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, [statsPeriod, growthInterval]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch all data in parallel
      const [statsData, growthData, jobPostData, applicationData] = await Promise.all([
        analyticsApi.getDashboardStats(statsPeriod),
        analyticsApi.getUserGrowth(growthInterval, growthMonths),
        analyticsApi.getJobPostAnalytics(growthMonths),
        analyticsApi.getApplicationAnalytics(growthMonths)
      ]);
      
      setDashboardStats(statsData);
      setUserGrowthData(growthData);
      setJobPostAnalytics(jobPostData);
      setApplicationAnalytics(applicationData);
      
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatsPeriodChange = (event) => {
    setStatsPeriod(parseInt(event.target.value));
  };

  const handleGrowthIntervalChange = (event) => {
    setGrowthInterval(event.target.value);
  };

  if (loading && !dashboardStats.total_stats.users) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          <p className="text-gray-600">Analytics and statistics overview</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p>{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-medium">Statistics Overview</h2>
        <div>
          <label htmlFor="statsPeriod" className="mr-2 text-sm">Stats Period:</label>
          <select
            id="statsPeriod"
            value={statsPeriod}
            onChange={handleStatsPeriodChange}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 3 months</option>
            <option value="180">Last 6 months</option>
            <option value="365">Last year</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <StatCard 
          title="Users"
          value={dashboardStats.total_stats.users}
          growth={dashboardStats.growth.users}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
            </svg>
          }
        />
        <StatCard 
          title="Job Seekers"
          value={dashboardStats.total_stats.job_seekers}
          growth={dashboardStats.growth.job_seekers}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
          }
        />
        <StatCard 
          title="Job Providers"
          value={dashboardStats.total_stats.job_providers}
          growth={dashboardStats.growth.job_providers}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
            </svg>
          }
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <StatCard 
          title="Job Posts"
          value={dashboardStats.total_stats.job_posts}
          growth={dashboardStats.growth.job_posts}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
          }
        />
        <StatCard 
          title="Applications"
          value={dashboardStats.total_stats.applications}
          growth={dashboardStats.growth.applications}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
            </svg>
          }
        />
        <StatCard 
          title="Interviews"
          value={dashboardStats.total_stats.interviews}
          growth={dashboardStats.growth.interviews}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
          }
        />
      </div>

      {/* User Growth Chart */}
      <div className="mb-8 bg-white p-4 rounded-lg shadow border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">User Growth</h2>
          <div>
            <label htmlFor="growthInterval" className="mr-2 text-sm">Interval:</label>
            <select
              id="growthInterval"
              value={growthInterval}
              onChange={handleGrowthIntervalChange}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
            </select>
          </div>
        </div>
        <UserGrowthChart data={userGrowthData} interval={growthInterval} />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Job Posts Chart */}
        <div className="bg-white p-4 rounded-lg shadow border">
          <h2 className="text-xl font-semibold mb-4">Job Posts Over Time</h2>
          <JobPostChart data={jobPostAnalytics.job_posts_over_time} />
        </div>
        
        {/* Applications Chart */}
        <div className="bg-white p-4 rounded-lg shadow border">
          <h2 className="text-xl font-semibold mb-4">Applications Over Time</h2>
          <ApplicationChart data={applicationAnalytics.applications_over_time} />
        </div>
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-4 rounded-lg shadow border">
          <h2 className="text-xl font-semibold mb-4">Application Status</h2>
          <DistributionChart 
            data={dashboardStats.distributions.application_status} 
            nameKey="status" 
            valueKey="count"
            colors={['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']}
          />
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <h2 className="text-xl font-semibold mb-4">Job Post Status</h2>
          <DistributionChart 
            data={dashboardStats.distributions.job_post_status} 
            nameKey="status" 
            valueKey="count"
            colors={['#10B981', '#4F46E5', '#F59E0B']}
          />
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <h2 className="text-xl font-semibold mb-4">Job Post Domains</h2>
          <DistributionChart 
            data={dashboardStats.distributions.job_post_domain} 
            nameKey="domain" 
            valueKey="count"
            colors={['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316']}
          />
        </div>
      </div>

      {/* Job Post Type and Employment Type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-4 rounded-lg shadow border">
          <h2 className="text-xl font-semibold mb-4">Job Post Types</h2>
          <DistributionChart 
            data={jobPostAnalytics.job_posts_by_type} 
            nameKey="job_type" 
            valueKey="count"
            colors={['#4F46E5', '#10B981', '#F59E0B']}
          />
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <h2 className="text-xl font-semibold mb-4">Employment Types</h2>
          <DistributionChart 
            data={jobPostAnalytics.job_posts_by_employment} 
            nameKey="employment_type" 
            valueKey="count"
            colors={['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']}
          />
        </div>
      </div>

      {/* Top Job Posts Table */}
      <div className="bg-white p-4 rounded-lg shadow border mb-8">
        <h2 className="text-xl font-semibold mb-4">Top Job Posts by Applications</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job Title
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applications
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {applicationAnalytics.top_job_posts.map((job, index) => (
                <tr key={job.jobpost}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {job.job_title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {job.count}
                  </td>
                </tr>
              ))}
              {applicationAnalytics.top_job_posts.length === 0 && (
                <tr>
                  <td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500">
                    No application data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Application Conversion Metrics */}
      <div className="bg-white p-4 rounded-lg shadow border mb-8">
        <h2 className="text-xl font-semibold mb-4">Application Conversion Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-indigo-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-indigo-800 mb-2">Total Applications</h3>
            <p className="text-3xl font-bold text-indigo-600">{applicationAnalytics.total_applications}</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800 mb-2">Hired Rate</h3>
            <p className="text-3xl font-bold text-green-600">{applicationAnalytics.conversion_rate}%</p>
            <p className="text-sm text-green-700">{applicationAnalytics.hired_count} candidates hired</p>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Rejection Rate</h3>
            <p className="text-3xl font-bold text-red-600">{applicationAnalytics.rejection_rate}%</p>
            <p className="text-sm text-red-700">{applicationAnalytics.rejection_count} applications rejected</p>
          </div>
        </div>
      </div>
    </div>
  );
}