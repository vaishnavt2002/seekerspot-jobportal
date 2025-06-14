import React from 'react';
import '../../styles/print-styles.css';

const UserReport = ({ data }) => {
  if (!data) {
    return <div className="text-gray-500 text-center p-8">Loading user report data...</div>;
  }

  const { summary, providers_by_industry, providers_by_location, monthly_trends } = data;

  const handlePrint = () => {
    window.print();
  };

  // Group monthly trends by month for table display
  const groupedMonthlyTrends = {};
  
  monthly_trends.forEach(item => {
    if (!groupedMonthlyTrends[item.month]) {
      groupedMonthlyTrends[item.month] = {
        month: item.month,
        job_seeker: 0,
        job_provider: 0,
        admin: 0
      };
    }
    
    groupedMonthlyTrends[item.month][item.user_type] = item.count;
  });
  
  const sortedMonthlyTrends = Object.values(groupedMonthlyTrends).sort((a, b) => a.month - b.month);

  return (
    <div className="bg-white rounded-lg shadow print-container">
      <div className="flex justify-between items-center mb-6 no-print px-4 pt-4">
        <h2 className="text-xl font-semibold">User Report</h2>
        <button 
          onClick={handlePrint} 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Print Report
        </button>
      </div>

      {/* Report Title for print */}
      <div className="hidden print:block report-title mb-4 text-center">
        <h1 className="text-2xl font-bold">User Report</h1>
        <p className="text-sm text-gray-500">Generated on: {new Date().toLocaleDateString()}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 px-4">
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
      <div className="mb-6 px-4">
        <h3 className="text-lg font-medium mb-2">Job Seeker Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
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

      {/* Verification Status Table */}
      <div className="mb-6 px-4">
        <h3 className="text-lg font-medium mb-4">Verification Status</h3>
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-4 border-b text-left">Status</th>
                <th className="py-2 px-4 border-b text-left">Count</th>
                <th className="py-2 px-4 border-b text-left">Percentage</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-gray-50">
                <td className="py-2 px-4 border-b">Verified Users</td>
                <td className="py-2 px-4 border-b">{summary.verified_users}</td>
                <td className="py-2 px-4 border-b">
                  {summary.total_users > 0 ? ((summary.verified_users / summary.total_users) * 100).toFixed(1) : 0}%
                </td>
              </tr>
              <tr>
                <td className="py-2 px-4 border-b">Unverified Users</td>
                <td className="py-2 px-4 border-b">{summary.unverified_users}</td>
                <td className="py-2 px-4 border-b">
                  {summary.total_users > 0 ? ((summary.unverified_users / summary.total_users) * 100).toFixed(1) : 0}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* User Type Distribution Table */}
      <div className="mb-6 px-4">
        <h3 className="text-lg font-medium mb-4">User Type Distribution</h3>
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-4 border-b text-left">User Type</th>
                <th className="py-2 px-4 border-b text-left">Count</th>
                <th className="py-2 px-4 border-b text-left">Percentage</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-gray-50">
                <td className="py-2 px-4 border-b">Job Seekers</td>
                <td className="py-2 px-4 border-b">{summary.job_seekers}</td>
                <td className="py-2 px-4 border-b">
                  {summary.total_users > 0 ? ((summary.job_seekers / summary.total_users) * 100).toFixed(1) : 0}%
                </td>
              </tr>
              <tr>
                <td className="py-2 px-4 border-b">Job Providers</td>
                <td className="py-2 px-4 border-b">{summary.job_providers}</td>
                <td className="py-2 px-4 border-b">
                  {summary.total_users > 0 ? ((summary.job_providers / summary.total_users) * 100).toFixed(1) : 0}%
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className="py-2 px-4 border-b">Admins</td>
                <td className="py-2 px-4 border-b">{summary.admins}</td>
                <td className="py-2 px-4 border-b">
                  {summary.total_users > 0 ? ((summary.admins / summary.total_users) * 100).toFixed(1) : 0}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Companies by Industry Table - page break before in print mode */}
      <div className="mb-6 px-4 print:page-break-before">
        <h3 className="text-lg font-medium mb-4">Companies by Industry</h3>
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-4 border-b text-left">Industry</th>
                <th className="py-2 px-4 border-b text-left">Count</th>
                <th className="py-2 px-4 border-b text-left">Percentage</th>
              </tr>
            </thead>
            <tbody>
              {providers_by_industry.map((item, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="py-2 px-4 border-b">{item.industry}</td>
                  <td className="py-2 px-4 border-b">{item.count}</td>
                  <td className="py-2 px-4 border-b">
                    {summary.job_providers > 0 ? ((item.count / summary.job_providers) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              ))}
              {providers_by_industry.length === 0 && (
                <tr>
                  <td colSpan="3" className="py-4 text-center text-gray-500">No data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Companies by Location Table */}
      <div className="mb-6 px-4">
        <h3 className="text-lg font-medium mb-4">Top Company Locations</h3>
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-4 border-b text-left">Location</th>
                <th className="py-2 px-4 border-b text-left">Count</th>
                <th className="py-2 px-4 border-b text-left">Percentage</th>
              </tr>
            </thead>
            <tbody>
              {providers_by_location.map((item, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="py-2 px-4 border-b">{item.location}</td>
                  <td className="py-2 px-4 border-b">{item.count}</td>
                  <td className="py-2 px-4 border-b">
                    {summary.job_providers > 0 ? ((item.count / summary.job_providers) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              ))}
              {providers_by_location.length === 0 && (
                <tr>
                  <td colSpan="3" className="py-4 text-center text-gray-500">No data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Registration Trend Table - page break before in print mode */}
      <div className="mb-6 px-4 print:page-break-before">
        <h3 className="text-lg font-medium mb-4">Monthly Registration Trend</h3>
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-4 border-b text-left">Month</th>
                <th className="py-2 px-4 border-b text-left">Job Seekers</th>
                <th className="py-2 px-4 border-b text-left">Job Providers</th>
                <th className="py-2 px-4 border-b text-left">Admins</th>
                <th className="py-2 px-4 border-b text-left">Total</th>
              </tr>
            </thead>
            <tbody>
              {sortedMonthlyTrends.map((item, index) => {
                const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                const total = (item.job_seeker || 0) + (item.job_provider || 0) + (item.admin || 0);
                
                return (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="py-2 px-4 border-b">{monthNames[item.month - 1]}</td>
                    <td className="py-2 px-4 border-b">{item.job_seeker || 0}</td>
                    <td className="py-2 px-4 border-b">{item.job_provider || 0}</td>
                    <td className="py-2 px-4 border-b">{item.admin || 0}</td>
                    <td className="py-2 px-4 border-b">{total}</td>
                  </tr>
                );
              })}
              {sortedMonthlyTrends.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-4 text-center text-gray-500">No data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserReport;