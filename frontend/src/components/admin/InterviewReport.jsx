import React from 'react';
import '../../styles/print-styles.css';

const InterviewReport = ({ data }) => {
  if (!data) {
    return <div className="text-gray-500 text-center p-8">Loading interview report data...</div>;
  }

  const { summary, status_distribution, interview_types, monthly_trends } = data;

  const handlePrint = () => {
    window.print();
  };

  const totalInterviews = summary.total_interviews;
  const completedInterviews = status_distribution.find(item => item.status === 'COMPLETED')?.count || 0;
  const cancelledInterviews = status_distribution.find(item => item.status === 'CANCELLED')?.count || 0;
  const rescheduledInterviews = status_distribution.find(item => item.status === 'RESCHEDULED')?.count || 0;
  
  const completionRate = totalInterviews > 0 ? ((completedInterviews / totalInterviews) * 100).toFixed(1) : 0;
  const cancellationRate = totalInterviews > 0 ? ((cancelledInterviews / totalInterviews) * 100).toFixed(1) : 0;
  const rescheduleRate = totalInterviews > 0 ? ((rescheduledInterviews / totalInterviews) * 100).toFixed(1) : 0;

  return (
    <div className="bg-white rounded-lg shadow print-container">
      <div className="flex justify-between items-center mb-6 no-print px-4 pt-4">
        <h2 className="text-xl font-semibold">Interview Report</h2>
        <button 
          onClick={handlePrint} 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Print Report
        </button>
      </div>

      {/* Report Title for print */}
      <div className="hidden print:block report-title mb-4 text-center">
        <h1 className="text-2xl font-bold">Interview Report</h1>
        <p className="text-sm text-gray-500">Generated on: {new Date().toLocaleDateString()}</p>
      </div>

      {/* Summary Card */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6 mx-4">
        <div className="text-sm font-medium text-blue-800">Total Interviews</div>
        <div className="mt-1 text-2xl font-semibold">{summary.total_interviews}</div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 px-4">
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-sm font-medium text-green-800">Completion Rate</div>
          <div className="mt-1 text-2xl font-semibold">{completionRate}%</div>
          <div className="text-sm text-green-700">{completedInterviews} completed interviews</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="text-sm font-medium text-red-800">Cancellation Rate</div>
          <div className="mt-1 text-2xl font-semibold">{cancellationRate}%</div>
          <div className="text-sm text-red-700">{cancelledInterviews} cancelled interviews</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="text-sm font-medium text-yellow-800">Reschedule Rate</div>
          <div className="mt-1 text-2xl font-semibold">{rescheduleRate}%</div>
          <div className="text-sm text-yellow-700">{rescheduledInterviews} rescheduled interviews</div>
        </div>
      </div>

      {/* Status Distribution Table */}
      <div className="mb-6 px-4">
        <h3 className="text-lg font-medium mb-4">Interview Status Breakdown</h3>
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
              {status_distribution.map((status, index) => {
                const percentage = totalInterviews > 0 ? ((status.count / totalInterviews) * 100).toFixed(1) : 0;
                const statusColors = {
                  'SCHEDULED': '#4299e1',     // Blue
                  'COMPLETED': '#48bb78',     // Green
                  'CANCELLED': '#f56565',     // Red
                  'RESCHEDULED': '#f6ad55',   // Orange
                };
                
                return (
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
                    <td className="py-2 px-4 border-b">{percentage}%</td>
                  </tr>
                );
              })}
              {status_distribution.length === 0 && (
                <tr>
                  <td colSpan="3" className="py-4 text-center text-gray-500">No data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-6 px-4 print:page-break-before">
        <h3 className="text-lg font-medium mb-4">Interview Types Breakdown</h3>
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-4 border-b text-left">Interview Type</th>
                <th className="py-2 px-4 border-b text-left">Count</th>
                <th className="py-2 px-4 border-b text-left">Percentage</th>
              </tr>
            </thead>
            <tbody>
              {interview_types.map((type, index) => {
                const percentage = totalInterviews > 0 ? ((type.count / totalInterviews) * 100).toFixed(1) : 0;
                const typeColors = {
                  'AUDIO_ONLY': '#4299e1',        
                  'VIDEO_ONLY': '#805ad5',       
                  'AUDIO_AND_VIDEO': '#48bb78',   
                };
                
                return (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="py-2 px-4 border-b">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: typeColors[type.interview_type] || '#a0aec0' }}
                        ></div>
                        {type.interview_type.replace(/_/g, ' ')}
                      </div>
                    </td>
                    <td className="py-2 px-4 border-b">{type.count}</td>
                    <td className="py-2 px-4 border-b">{percentage}%</td>
                  </tr>
                );
              })}
              {interview_types.length === 0 && (
                <tr>
                  <td colSpan="3" className="py-4 text-center text-gray-500">No data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Trend Table */}
      <div className="mb-6 px-4">
        <h3 className="text-lg font-medium mb-4">Monthly Interview Trend</h3>
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-4 border-b text-left">Month</th>
                <th className="py-2 px-4 border-b text-left">Interviews</th>
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

      <div className="px-4 border rounded-lg mb-6 print:page-break-before mx-4">
        <h3 className="text-lg font-medium mb-4 pt-4">Interview Insights</h3>
        <div className="space-y-4 pb-4">
          <div>
            <h4 className="font-medium mb-1">Most Popular Interview Format</h4>
            <p className="text-gray-600">
              {interview_types.length > 0 ? 
                `${interview_types[0].interview_type.replace(/_/g, ' ')} is the most common interview format (${interview_types[0].count} interviews).` :
                'No interview type data available.'
              }
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-1">Interview Efficiency</h4>
            <p className="text-gray-600">
              {`${completionRate}% of scheduled interviews were successfully completed. ${cancellationRate}% were cancelled, and ${rescheduleRate}% needed to be rescheduled.`}
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-1">Improvement Suggestions</h4>
            <p className="text-gray-600">
              {(() => {
                if (cancelledInterviews > 0 && totalInterviews > 0) {
                  const cancelRate = (cancelledInterviews / totalInterviews) * 100;
                  if (cancelRate > 20) {
                    return 'High cancellation rate suggests reviewing the interview scheduling process to reduce conflicts.';
                  }
                }
                if (rescheduledInterviews > 0 && totalInterviews > 0) {
                  const rescheduleRate = (rescheduledInterviews / totalInterviews) * 100;
                  if (rescheduleRate > 15) {
                    return 'Consider improving initial scheduling communication to reduce the need for rescheduling.';
                  }
                }
                return 'Interview process is operating efficiently, but regular monitoring is recommended.';
              })()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewReport;