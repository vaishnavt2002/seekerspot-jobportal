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

const ApplicationReport = ({ data, timeFilter }) => {
  if (!data) {
    return <div className="text-gray-500 text-center p-8">Select a time period to load application report data.</div>;
  }

  const { summary, status_distribution, applications_by_domain, applications_by_job_type, monthly_trends } = data;

  // Status distribution chart
  const statusColors = {
    'APPLIED': '#4299e1',    // Blue
    'REVIEWING': '#805ad5',  // Purple
    'SHORTLISTED': '#48bb78', // Green
    'REJECTED': '#f56565',   // Red
    'HIRED': '#ecc94b',      // Yellow
    'WITHDRAWN': '#a0aec0',  // Gray
  };

  const statusChartData = {
    labels: status_distribution.map(item => item.status),
    datasets: [
      {
        data: status_distribution.map(item => item.count),
        backgroundColor: status_distribution.map(item => statusColors[item.status] || '#a0aec0'),
        borderWidth: 1,
      },
    ],
  };

  // Applications by domain chart
  const domainChartData = {
    labels: applications_by_domain.map(item => item.jobpost__domain),
    datasets: [
      {
        label: 'Applications',
        data: applications_by_domain.map(item => item.count),
        backgroundColor: '#4299e1',
        borderWidth: 1,
      },
    ],
  };

  // Applications by job type chart
  const jobTypeChartData = {
    labels: applications_by_job_type.map(item => item.jobpost__job_type),
    datasets: [
      {
        label: 'Applications',
        data: applications_by_job_type.map(item => item.count),
        backgroundColor: ['#4299e1', '#48bb78', '#f6ad55'],
        borderWidth: 1,
      },
    ],
  };

  // Monthly trends chart
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const trendChartData = {
    labels: monthly_trends.map(item => monthNames[item.month - 1]),
    datasets: [
      {
        label: 'Applications',
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

  // Calculate percentages for status distribution
  const totalApplications = summary.total_applications;
  const statusWithPercentage = status_distribution.map(item => ({
    ...item,
    percentage: totalApplications > 0 ? ((item.count / totalApplications) * 100).toFixed(1) : 0
  }));

  return (
    <div className="bg-white p-6 rounded-lg shadow print-container">
      <div className="flex justify-between items-center mb-6 no-print">
        <h2 className="text-xl font-semibold">Application Report</h2>
        <button 
          onClick={handlePrint} 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Print Report
        </button>
      </div>

      {/* Report Title for print */}
      <div className="hidden print:block report-title">
        <h1>Application Report - {getTimePeriodText()}</h1>
        <p className="text-sm text-gray-500">Generated on: {new Date().toLocaleDateString()}</p>
      </div>

      {/* Summary Card */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
        <div className="text-sm font-medium text-blue-800">Total Applications</div>
        <div className="mt-1 text-2xl font-semibold">{summary.total_applications}</div>
      </div>

      {/* Status Distribution Table */}
      <div className="mb-6 p-4 border rounded-lg">
        <h3 className="text-lg font-medium mb-4">Application Status Distribution</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-4 border-b text-left">Status</th>
                <th className="py-2 px-4 border-b text-left">Count</th>
                <th className="py-2 px-4 border-b text-left">Percentage</th>
              </tr>
            </thead>
            <tbody>
              {statusWithPercentage.map((status, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="py-2 px-4 border-b">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: statusColors[status.status] || '#a0aec0' }}
                      ></div>
                      {status.status}
                    </div>
                  </td>
                  <td className="py-2 px-4 border-b">{status.count}</td>
                  <td className="py-2 px-4 border-b">{status.percentage}%</td>
                </tr>
              ))}
              {statusWithPercentage.length === 0 && (
                <tr>
                  <td colSpan="3" className="py-4 text-center text-gray-500">No data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-medium mb-4">Application Status Distribution</h3>
          <div className="h-64">
            <Pie data={statusChartData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-medium mb-4">Applications by Job Type</h3>
          <div className="h-64">
            <Pie data={jobTypeChartData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-medium mb-4">Applications by Domain</h3>
          <div className="h-64">
            <Bar 
              data={domainChartData} 
              options={{ 
                maintainAspectRatio: false,
                indexAxis: 'y'
              }} 
            />
          </div>
        </div>
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-medium mb-4">Monthly Application Trend</h3>
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
                      text: 'Number of Applications'
                    }
                  }
                }
              }} 
            />
          </div>
        </div>
      </div>

      {/* Additional Insights - page break before in print mode */}
      <div className="p-4 border rounded-lg mb-6 page-break-before">
        <h3 className="text-lg font-medium mb-4">Application Insights</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-1">Success Rate</h4>
            <p className="text-gray-600">
              {(() => {
                const shortlisted = statusWithPercentage.find(s => s.status === 'SHORTLISTED')?.count || 0;
                const hired = statusWithPercentage.find(s => s.status === 'HIRED')?.count || 0;
                const successRate = totalApplications > 0 ? 
                  (((shortlisted + hired) / totalApplications) * 100).toFixed(1) : 0;
                return `${successRate}% of applications resulted in candidates being shortlisted or hired.`;
              })()}
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-1">Most Popular Domain</h4>
            <p className="text-gray-600">
              {applications_by_domain.length > 0 ? 
                `The ${applications_by_domain[0].jobpost__domain} domain has received the most applications (${applications_by_domain[0].count}).` :
                'No domain data available.'
              }
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-1">Preferred Job Type</h4>
            <p className="text-gray-600">
              {applications_by_job_type.length > 0 ? 
                `${applications_by_job_type[0].jobpost__job_type} jobs are the most applied to (${applications_by_job_type[0].count} applications).` :
                'No job type data available.'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Applications by Domain Table for print */}
      <div className="mb-6 hidden print:block">
        <h3 className="text-lg font-medium mb-4">Applications by Domain</h3>
        <table className="min-w-full bg-white border rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-2 px-4 border-b text-left">Domain</th>
              <th className="py-2 px-4 border-b text-left">Applications</th>
              <th className="py-2 px-4 border-b text-left">Percentage</th>
            </tr>
          </thead>
          <tbody>
            {applications_by_domain.map((domain, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="py-2 px-4 border-b">{domain.jobpost__domain}</td>
                <td className="py-2 px-4 border-b">{domain.count}</td>
                <td className="py-2 px-4 border-b">
                  {totalApplications > 0 ? ((domain.count / totalApplications) * 100).toFixed(1) : 0}%
                </td>
              </tr>
            ))}
            {applications_by_domain.length === 0 && (
              <tr>
                <td colSpan="3" className="py-4 text-center text-gray-500">No data available</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ApplicationReport;