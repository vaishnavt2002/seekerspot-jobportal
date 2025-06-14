import React from 'react';
import '../../styles/print-styles.css';

const ApplicationReport = ({ data }) => {
  if (!data) {
    return <div className="text-gray-500 text-center p-8">Loading application report data...</div>;
  }

  const { summary, status_distribution, applications_by_domain, applications_by_job_type, monthly_trends } = data;

  const handlePrint = () => {
    window.print();
  };

  // Calculate percentages for status distribution
  const totalApplications = summary.total_applications;
  const statusWithPercentage = status_distribution.map(item => ({
    ...item,
    percentage: totalApplications > 0 ? ((item.count / totalApplications) * 100).toFixed(1) : 0
  }));

  return (
    <div className="bg-white rounded-lg shadow print-container">
      <div className="flex justify-between items-center mb-6 no-print px-4 pt-4">
        <h2 className="text-xl font-semibold">Application Report</h2>
        <button 
          onClick={handlePrint} 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Print Report
        </button>
      </div>

      {/* Report Title for print */}
      <div className="hidden print:block report-title mb-4 text-center">
        <h1 className="text-2xl font-bold">Application Report</h1>
        <p className="text-sm text-gray-500">Generated on: {new Date().toLocaleDateString()}</p>
      </div>

      {/* Summary Card */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6 mx-4">
        <div className="text-sm font-medium text-blue-800">Total Applications</div>
        <div className="mt-1 text-2xl font-semibold">{summary.total_applications}</div>
      </div>

      {/* Application Success Metrics */}
      <div className="mb-6 px-4">
        <h3 className="text-lg font-medium mb-2">Application Success Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
          <div>
            <p className="text-sm text-gray-600">Shortlisted Applications</p>
            <p className="text-xl font-semibold">
              {(() => {
                const shortlisted = statusWithPercentage.find(s => s.status === 'SHORTLISTED')?.count || 0;
                return shortlisted;
              })()}
              <span className="text-sm text-gray-500 ml-2">
                ({(() => {
                  const shortlisted = statusWithPercentage.find(s => s.status === 'SHORTLISTED')?.percentage || 0;
                  return shortlisted;
                })()}%)
              </span>
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Hired Applications</p>
            <p className="text-xl font-semibold">
              {(() => {
                const hired = statusWithPercentage.find(s => s.status === 'HIRED')?.count || 0;
                return hired;
              })()}
              <span className="text-sm text-gray-500 ml-2">
                ({(() => {
                  const hired = statusWithPercentage.find(s => s.status === 'HIRED')?.percentage || 0;
                  return hired;
                })()}%)
              </span>
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Success Rate</p>
            <p className="text-xl font-semibold">
              {(() => {
                const shortlisted = statusWithPercentage.find(s => s.status === 'SHORTLISTED')?.count || 0;
                const hired = statusWithPercentage.find(s => s.status === 'HIRED')?.count || 0;
                const successRate = totalApplications > 0 ? 
                  (((shortlisted + hired) / totalApplications) * 100).toFixed(1) : 0;
                return `${successRate}%`;
              })()}
            </p>
          </div>
        </div>
      </div>

      {/* Status Distribution Table */}
      <div className="mb-6 px-4">
        <h3 className="text-lg font-medium mb-4">Application Status Distribution</h3>
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
              {statusWithPercentage.map((status, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="py-2 px-4 border-b">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ 
                          backgroundColor: 
                            status.status === 'APPLIED' ? '#4299e1' : 
                            status.status === 'REVIEWING' ? '#805ad5' : 
                            status.status === 'SHORTLISTED' ? '#48bb78' : 
                            status.status === 'REJECTED' ? '#f56565' : 
                            status.status === 'HIRED' ? '#ecc94b' : 
                            status.status === 'WITHDRAWN' ? '#a0aec0' : '#a0aec0'
                        }}
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

      {/* Applications by Domain Table */}
      <div className="mb-6 px-4">
        <h3 className="text-lg font-medium mb-4">Applications by Domain</h3>
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full bg-white">
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

      {/* Applications by Job Type Table - page break before in print mode */}
      <div className="mb-6 px-4 print:page-break-before">
        <h3 className="text-lg font-medium mb-4">Applications by Job Type</h3>
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-4 border-b text-left">Job Type</th>
                <th className="py-2 px-4 border-b text-left">Applications</th>
                <th className="py-2 px-4 border-b text-left">Percentage</th>
              </tr>
            </thead>
            <tbody>
              {applications_by_job_type.map((type, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="py-2 px-4 border-b">{type.jobpost__job_type}</td>
                  <td className="py-2 px-4 border-b">{type.count}</td>
                  <td className="py-2 px-4 border-b">
                    {totalApplications > 0 ? ((type.count / totalApplications) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              ))}
              {applications_by_job_type.length === 0 && (
                <tr>
                  <td colSpan="3" className="py-4 text-center text-gray-500">No data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Application Trend Table */}
      <div className="mb-6 px-4">
        <h3 className="text-lg font-medium mb-4">Monthly Application Trend</h3>
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-4 border-b text-left">Month</th>
                <th className="py-2 px-4 border-b text-left">Applications</th>
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

      {/* Additional Insights - page break before in print mode */}
      <div className="px-4 border rounded-lg mb-6 print:page-break-before mx-4">
        <h3 className="text-lg font-medium mb-4 pt-4">Application Insights</h3>
        <div className="space-y-4 pb-4">
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
    </div>
  );
};

export default ApplicationReport;