import React from 'react';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import '../../styles/print-styles.css';

// Register ChartJS components
ChartJS.register(
  ArcElement, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend
);

const UserReport = ({ data, timeFilter }) => {
  if (!data) {
    return <div className="text-gray-500 text-center p-8">Select a time period to load user report data.</div>;
  }

  const { summary, providers_by_industry, providers_by_location, monthly_trends } = data;

  // User type distribution chart
  const userTypeData = {
    labels: ['Job Seekers', 'Job Providers', 'Admins'],
    datasets: [
      {
        data: [summary.job_seekers, summary.job_providers, summary.admins],
        backgroundColor: ['#4299e1', '#48bb78', '#f6ad55'],
        borderWidth: 1,
      },
    ],
  };

  // Verification status chart
  const verificationData = {
    labels: ['Verified', 'Unverified'],
    datasets: [
      {
        data: [summary.verified_users, summary.unverified_users],
        backgroundColor: ['#48bb78', '#f56565'],
        borderWidth: 1,
      },
    ],
  };

  // Providers by industry chart
  const industryChartData = {
    labels: providers_by_industry.map(item => item.industry),
    datasets: [
      {
        label: 'Companies',
        data: providers_by_industry.map(item => item.count),
        backgroundColor: '#4299e1',
        borderWidth: 1,
      },
    ],
  };

  // Providers by location chart
  const locationChartData = {
    labels: providers_by_location.map(item => item.location),
    datasets: [
      {
        label: 'Companies',
        data: providers_by_location.map(item => item.count),
        backgroundColor: '#48bb78',
        borderWidth: 1,
      },
    ],
  };

  // Monthly registration trend chart
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Group data by month and user type
  const trendsByMonth = {};
  monthly_trends.forEach(item => {
    if (!trendsByMonth[item.month]) {
      trendsByMonth[item.month] = {
        month: monthNames[item.month - 1],
        job_seeker: 0,
        job_provider: 0,
        admin: 0
      };
    }
    trendsByMonth[item.month][item.user_type] = item.count;
  });
  
  const sortedTrends = Object.values(trendsByMonth).sort((a, b) => {
    return monthNames.indexOf(a.month) - monthNames.indexOf(b.month);
  });
  
  const trendChartData = {
    labels: sortedTrends.map(item => item.month),
    datasets: [
      {
        label: 'Job Seekers',
        data: sortedTrends.map(item => item.job_seeker || 0),
        borderColor: '#4299e1',
        backgroundColor: 'rgba(66, 153, 225, 0.2)',
        tension: 0.3,
      },
      {
        label: 'Job Providers',
        data: sortedTrends.map(item => item.job_provider || 0),
        borderColor: '#48bb78',
        backgroundColor: 'rgba(72, 187, 120, 0.2)',
        tension: 0.3,
      },
      {
        label: 'Admins',
        data: sortedTrends.map(item => item.admin || 0),
        borderColor: '#f6ad55',
        backgroundColor: 'rgba(246, 173, 85, 0.2)',
        tension: 0.3,
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
        <h2 className="text-xl font-semibold">User Report</h2>
        <button 
          onClick={handlePrint} 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Print Report
        </button>
      </div>

      {/* Report Title for print */}
      <div className="hidden print:block report-title">
        <h1>User Report - {getTimePeriodText()}</h1>
        <p className="text-sm text-gray-500">Generated on: {new Date().toLocaleDateString()}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-sm font-medium text-blue-800">Total Users</div>
          <div className="mt-1 text-2xl font-semibold">{summary.total_users}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-sm font-medium text-green-800">Job Seekers</div>
          <div className="mt-1 text-2xl font-semibold">{summary.job_seekers}</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="text-sm font-medium text-yellow-800">Job Providers</div>
          <div className="mt-1 text-2xl font-semibold">{summary.job_providers}</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="text-sm font-medium text-purple-800">Admins</div>
          <div className="mt-1 text-2xl font-semibold">{summary.admins}</div>
        </div>
      </div>

      {/* Job Seeker Information */}
      <div className="mb-6 p-4 border rounded-lg">
        <h3 className="text-lg font-medium mb-2">Job Seeker Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Average Experience</p>
            <p className="text-xl font-semibold">{summary.avg_job_seeker_experience.toFixed(1)} years</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Average Expected Salary</p>
            <p className="text-xl font-semibold">₹{Math.round(summary.avg_expected_salary).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-medium mb-4">User Type Distribution</h3>
          <div className="h-64">
            <Pie data={userTypeData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-medium mb-4">Verification Status</h3>
          <div className="h-64">
            <Pie data={verificationData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-medium mb-4">Companies by Industry</h3>
          <div className="h-64">
            <Bar 
              data={industryChartData} 
              options={{ 
                maintainAspectRatio: false,
                indexAxis: 'y'
              }} 
            />
          </div>
        </div>
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-medium mb-4">Top Company Locations</h3>
          <div className="h-64">
            <Bar 
              data={locationChartData} 
              options={{ 
                maintainAspectRatio: false,
                indexAxis: 'y'
              }} 
            />
          </div>
        </div>
      </div>

      {/* Monthly Trend Chart - page break before in print mode */}
      <div className="mb-6 p-4 border rounded-lg page-break-before">
        <h3 className="text-lg font-medium mb-4">Monthly Registration Trend</h3>
        <div className="h-80">
          <Line 
            data={trendChartData} 
            options={{ 
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Number of Registrations'
                  }
                }
              }
            }} 
          />
        </div>
      </div>

      {/* Summary table for better print display */}
      <div className="mb-6 hidden print:block">
        <h3 className="text-lg font-medium mb-4">Registration Summary by User Type</h3>
        <table className="min-w-full bg-white border rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-2 px-4 border-b">User Type</th>
              <th className="py-2 px-4 border-b">Count</th>
              <th className="py-2 px-4 border-b">Percentage</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-2 px-4 border-b">Job Seekers</td>
              <td className="py-2 px-4 border-b">{summary.job_seekers}</td>
              <td className="py-2 px-4 border-b">
                {summary.total_users ? ((summary.job_seekers / summary.total_users) * 100).toFixed(1) : 0}%
              </td>
            </tr>
            <tr>
              <td className="py-2 px-4 border-b">Job Providers</td>
              <td className="py-2 px-4 border-b">{summary.job_providers}</td>
              <td className="py-2 px-4 border-b">
                {summary.total_users ? ((summary.job_providers / summary.total_users) * 100).toFixed(1) : 0}%
              </td>
            </tr>
            <tr>
              <td className="py-2 px-4 border-b">Admins</td>
              <td className="py-2 px-4 border-b">{summary.admins}</td>
              <td className="py-2 px-4 border-b">
                {summary.total_users ? ((summary.admins / summary.total_users) * 100).toFixed(1) : 0}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserReport;