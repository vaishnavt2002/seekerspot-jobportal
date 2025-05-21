import React from 'react';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import '../../styles/print-styles.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement, 
  PointElement, 
  LineElement
);

const JobPostReport = ({ data, timeFilter }) => {
  if (!data) {
    return <div className="text-gray-500 text-center p-8">Select a time period to load job post report data.</div>;
  }

  const { summary, job_types, employment_types, domains, top_jobs, monthly_trends } = data;

  // Chart data for job types
  const jobTypeChartData = {
    labels: job_types.map(item => item.job_type),
    datasets: [
      {
        label: 'Job Posts',
        data: job_types.map(item => item.count),
        backgroundColor: ['#4299e1', '#48bb78', '#f6ad55', '#f56565'],
        borderWidth: 1,
      },
    ],
  };

  // Chart data for employment types
  const employmentTypeChartData = {
    labels: employment_types.map(item => item.employment_type),
    datasets: [
      {
        label: 'Job Posts',
        data: employment_types.map(item => item.count),
        backgroundColor: ['#4299e1', '#48bb78', '#f6ad55', '#f56565', '#805ad5'],
        borderWidth: 1,
      },
    ],
  };

  // Chart data for domains
  const domainChartData = {
    labels: domains.map(item => item.domain),
    datasets: [
      {
        label: 'Job Posts',
        data: domains.map(item => item.count),
        backgroundColor: ['#4299e1', '#48bb78', '#f6ad55', '#f56565', '#805ad5', '#ed64a6', '#ecc94b', '#a0aec0'],
        borderWidth: 1,
      },
    ],
  };

  // Chart data for monthly trends
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const trendChartData = {
    labels: monthly_trends.map(item => monthNames[item.month - 1]),
    datasets: [
      {
        label: 'New Job Posts',
        data: monthly_trends.map(item => item.count),
        borderColor: '#4299e1',
        backgroundColor: 'rgba(66, 153, 225, 0.2)',
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const handlePrint = () => {
    window.print();
  };

  // Get time period text for display
  const getTimePeriodText = () => {
    switch(timeFilter) {
      case 'today':
        return 'Today';
      case 'week':
        return 'Last 7 Days';
      case 'month':
        return 'Last 30 Days';
      case 'year':
        return 'Last 365 Days';
      default:
        return 'All Time';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow print-container">
      <div className="flex justify-between items-center mb-6 no-print">
        <h2 className="text-xl font-semibold">Job Posts Report</h2>
        <button 
          onClick={handlePrint} 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Print Report
        </button>
      </div>

      {/* Report Title for print */}
      <div className="hidden print:block report-title">
        <h1>Job Posts Report - {getTimePeriodText()}</h1>
        <p className="text-sm text-gray-500">Generated on: {new Date().toLocaleDateString()}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-sm font-medium text-blue-800">Total Job Posts</div>
          <div className="mt-1 text-2xl font-semibold">{summary.total_job_posts}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-sm font-medium text-green-800">Published Jobs</div>
          <div className="mt-1 text-2xl font-semibold">{summary.published_jobs}</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="text-sm font-medium text-yellow-800">Draft Jobs</div>
          <div className="mt-1 text-2xl font-semibold">{summary.draft_jobs}</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="text-sm font-medium text-red-800">Closed Jobs</div>
          <div className="mt-1 text-2xl font-semibold">{summary.closed_jobs}</div>
        </div>
      </div>

      {/* Salary Information */}
      <div className="mb-6 p-4 border rounded-lg">
        <h3 className="text-lg font-medium mb-2">Average Salary Ranges</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Average Minimum Salary</p>
            <p className="text-xl font-semibold">₹{Math.round(summary.avg_min_salary || 0).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Average Maximum Salary</p>
            <p className="text-xl font-semibold">₹{Math.round(summary.avg_max_salary || 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-medium mb-4">Job Posts by Job Type</h3>
          <div className="h-64">
            <Pie data={jobTypeChartData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-medium mb-4">Job Posts by Employment Type</h3>
          <div className="h-64">
            <Pie data={employmentTypeChartData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-medium mb-4">Job Posts by Domain</h3>
          <div className="h-64">
            <Bar 
              data={domainChartData} 
              options={{ 
                maintainAspectRatio: false,
                indexAxis: 'y',
              }} 
            />
          </div>
        </div>
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-medium mb-4">Monthly Job Posting Trend</h3>
          <div className="h-64">
            <Line 
              data={trendChartData} 
              options={{ 
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Number of Job Posts'
                    }
                  }
                }
              }} 
            />
          </div>
        </div>
      </div>

      {/* Top Jobs Table - page break before in print mode */}
      <div className="mb-6 page-break-before">
        <h3 className="text-lg font-medium mb-4">Top Jobs by Application Count</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-4 border-b text-left">Job Title</th>
                <th className="py-2 px-4 border-b text-left">Company</th>
                <th className="py-2 px-4 border-b text-left">Job Type</th>
                <th className="py-2 px-4 border-b text-left">Employment Type</th>
                <th className="py-2 px-4 border-b text-left">Domain</th>
                <th className="py-2 px-4 border-b text-left">Salary Range</th>
                <th className="py-2 px-4 border-b text-left">Applications</th>
              </tr>
            </thead>
            <tbody>
              {top_jobs.map((job, index) => (
                <tr key={job.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="py-2 px-4 border-b">{job.title}</td>
                  <td className="py-2 px-4 border-b">{job.company_name}</td>
                  <td className="py-2 px-4 border-b">{job.job_type}</td>
                  <td className="py-2 px-4 border-b">{job.employment_type}</td>
                  <td className="py-2 px-4 border-b">{job.domain}</td>
                  <td className="py-2 px-4 border-b">₹{job.min_salary?.toLocaleString() || 0} - ₹{job.max_salary?.toLocaleString() || 0}</td>
                  <td className="py-2 px-4 border-b">{job.application_count}</td>
                </tr>
              ))}
              {top_jobs.length === 0 && (
                <tr>
                  <td colSpan="7" className="py-4 text-center text-gray-500">No data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default JobPostReport;