import React from 'react';
import '../../styles/print-styles.css';

const JobPostReport = ({ data }) => {
  if (!data) {
    return <div className="text-gray-500 text-center p-8">Loading job post report data...</div>;
  }

  const { summary, job_types, employment_types, domains, top_jobs, monthly_trends } = data;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-lg shadow print-container">
      <div className="flex justify-between items-center mb-6 no-print px-4 pt-4">
        <h2 className="text-xl font-semibold">Job Posts Report</h2>
        <button 
          onClick={handlePrint} 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Print Report
        </button>
      </div>

      {/* Report Title for print */}
      <div className="hidden print:block report-title mb-4 text-center">
        <h1 className="text-2xl font-bold">Job Posts Report</h1>
        <p className="text-sm text-gray-500">Generated on: {new Date().toLocaleDateString()}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 px-4">
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
      <div className="mb-6 px-4">
        <h3 className="text-lg font-medium mb-2">Average Salary Ranges</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
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

      {/* Job Types Table */}
      <div className="mb-6 px-4">
        <h3 className="text-lg font-medium mb-4">Job Posts by Job Type</h3>
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-4 border-b text-left">Job Type</th>
                <th className="py-2 px-4 border-b text-left">Count</th>
                <th className="py-2 px-4 border-b text-left">Percentage</th>
              </tr>
            </thead>
            <tbody>
              {job_types.map((item, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="py-2 px-4 border-b">{item.job_type}</td>
                  <td className="py-2 px-4 border-b">{item.count}</td>
                  <td className="py-2 px-4 border-b">
                    {summary.total_job_posts > 0 ? ((item.count / summary.total_job_posts) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              ))}
              {job_types.length === 0 && (
                <tr>
                  <td colSpan="3" className="py-4 text-center text-gray-500">No data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employment Types Table */}
      <div className="mb-6 px-4">
        <h3 className="text-lg font-medium mb-4">Job Posts by Employment Type</h3>
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-4 border-b text-left">Employment Type</th>
                <th className="py-2 px-4 border-b text-left">Count</th>
                <th className="py-2 px-4 border-b text-left">Percentage</th>
              </tr>
            </thead>
            <tbody>
              {employment_types.map((item, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="py-2 px-4 border-b">{item.employment_type}</td>
                  <td className="py-2 px-4 border-b">{item.count}</td>
                  <td className="py-2 px-4 border-b">
                    {summary.total_job_posts > 0 ? ((item.count / summary.total_job_posts) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              ))}
              {employment_types.length === 0 && (
                <tr>
                  <td colSpan="3" className="py-4 text-center text-gray-500">No data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Domains Table */}
      <div className="mb-6 px-4">
        <h3 className="text-lg font-medium mb-4">Job Posts by Domain</h3>
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-4 border-b text-left">Domain</th>
                <th className="py-2 px-4 border-b text-left">Count</th>
                <th className="py-2 px-4 border-b text-left">Percentage</th>
              </tr>
            </thead>
            <tbody>
              {domains.map((item, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="py-2 px-4 border-b">{item.domain}</td>
                  <td className="py-2 px-4 border-b">{item.count}</td>
                  <td className="py-2 px-4 border-b">
                    {summary.total_job_posts > 0 ? ((item.count / summary.total_job_posts) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              ))}
              {domains.length === 0 && (
                <tr>
                  <td colSpan="3" className="py-4 text-center text-gray-500">No data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Trends Table - page break before in print mode */}
      <div className="mb-6 px-4 print:page-break-before">
        <h3 className="text-lg font-medium mb-4">Monthly Job Posting Trend</h3>
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-4 border-b text-left">Month</th>
                <th className="py-2 px-4 border-b text-left">Job Posts</th>
              </tr>
            </thead>
            <tbody>
              {monthly_trends.map((item, index) => {
                const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                return (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="py-2 px-4 border-b">{monthNames[item.month - 1]}</td>
                    <td className="py-2 px-4 border-b">{item.count}</td>
                  </tr>
                );
              })}
              {monthly_trends.length === 0 && (
                <tr>
                  <td colSpan="2" className="py-4 text-center text-gray-500">No data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Jobs Table - page break before in print mode */}
      <div className="mb-6 px-4 print:page-break-before">
        <h3 className="text-lg font-medium mb-4">Top Jobs by Application Count</h3>
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full bg-white">
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