import React, { useState, useEffect } from 'react';
import reportApi from '../../api/reportApi';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import '../../styles/print-styles.css';
import JobPostReport from './JobPostReport';
import UserReport from './UserReport';
import ApplicationReport from './ApplicationReport';
import InterviewReport from './InterviewReport';

export default function ReportDashboard() {
  const [activeTab, setActiveTab] = useState(0);
  const [timeFilter, setTimeFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  
  // State for each report type
  const [jobPostReport, setJobPostReport] = useState(null);
  const [userReport, setUserReport] = useState(null);
  const [applicationReport, setApplicationReport] = useState(null);
  const [interviewReport, setInterviewReport] = useState(null);

  // Fetch data for the active tab
  useEffect(() => {
    fetchReportData();
  }, [activeTab, timeFilter]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const params = { time_period: timeFilter };
      
      switch (activeTab) {
        case 0: // Job Posts Report
          if (!jobPostReport || timeFilter !== jobPostReport.timeFilter) {
            const data = await reportApi.getJobPostReport(params);
            setJobPostReport({ data, timeFilter });
          }
          break;
        case 1: // User Report
          if (!userReport || timeFilter !== userReport.timeFilter) {
            const data = await reportApi.getUserReport(params);
            setUserReport({ data, timeFilter });
          }
          break;
        case 2: // Application Report
          if (!applicationReport || timeFilter !== applicationReport.timeFilter) {
            const data = await reportApi.getApplicationReport(params);
            setApplicationReport({ data, timeFilter });
          }
          break;
        case 3: // Interview Report
          if (!interviewReport || timeFilter !== interviewReport.timeFilter) {
            const data = await reportApi.getInterviewReport(params);
            setInterviewReport({ data, timeFilter });
          }
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (index) => {
    setActiveTab(index);
  };

  const handleTimeFilterChange = (e) => {
    setTimeFilter(e.target.value);
  };

  const handlePrintAll = () => {
    // Make sure all reports are loaded before printing
    const loadAllReports = async () => {
      setLoading(true);
      try {
        const params = { time_period: timeFilter };
        
        // Load all reports in parallel
        const [jobData, userData, appData, interviewData] = await Promise.all([
          jobPostReport?.timeFilter === timeFilter ? Promise.resolve(jobPostReport.data) : reportApi.getJobPostReport(params),
          userReport?.timeFilter === timeFilter ? Promise.resolve(userReport.data) : reportApi.getUserReport(params),
          applicationReport?.timeFilter === timeFilter ? Promise.resolve(applicationReport.data) : reportApi.getApplicationReport(params),
          interviewReport?.timeFilter === timeFilter ? Promise.resolve(interviewReport.data) : reportApi.getInterviewReport(params)
        ]);
        
        // Update state if data is new
        if (!jobPostReport || timeFilter !== jobPostReport.timeFilter) {
          setJobPostReport({ data: jobData, timeFilter });
        }
        if (!userReport || timeFilter !== userReport.timeFilter) {
          setUserReport({ data: userData, timeFilter });
        }
        if (!applicationReport || timeFilter !== applicationReport.timeFilter) {
          setApplicationReport({ data: appData, timeFilter });
        }
        if (!interviewReport || timeFilter !== interviewReport.timeFilter) {
          setInterviewReport({ data: interviewData, timeFilter });
        }
        
        // Print once all data is loaded
        setTimeout(() => {
          window.print();
        }, 1000); // Delay to ensure DOM updates
      } catch (error) {
        console.error('Error loading all reports:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadAllReports();
  };

  return (
    <div className="p-4 max-w-7xl mx-auto print-container">
      <div className="flex justify-between items-center mb-6 no-print">
        <h1 className="text-2xl font-semibold">Admin Reports Dashboard</h1>
        <div className="flex space-x-2">
          <div className="flex items-center">
            <label className="mr-2 text-gray-700">Time Period:</label>
            <select
              className="border rounded p-2 bg-white"
              value={timeFilter}
              onChange={handleTimeFilterChange}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="year">Last 365 Days</option>
            </select>
          </div>
          <button
            onClick={handlePrintAll}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Print All Reports
          </button>
        </div>
      </div>

      {/* Report date (for print only) */}
      <div className="report-date hidden print:block">
        Report generated on: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
      </div>

      {loading && (
        <div className="flex justify-center items-center h-64 no-print">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
            <p>Loading report data...</p>
          </div>
        </div>
      )}

      {!loading && (
        <Tabs selectedIndex={activeTab} onSelect={handleTabChange}>
          <TabList className="flex border-b mb-6 no-print">
            <Tab className="px-4 py-2 cursor-pointer focus:outline-none text-blue-600 border-b-2 border-transparent hover:border-blue-600">
              Job Posts Report
            </Tab>
            <Tab className="px-4 py-2 cursor-pointer focus:outline-none text-blue-600 border-b-2 border-transparent hover:border-blue-600">
              User Report
            </Tab>
            <Tab className="px-4 py-2 cursor-pointer focus:outline-none text-blue-600 border-b-2 border-transparent hover:border-blue-600">
              Application Report
            </Tab>
            <Tab className="px-4 py-2 cursor-pointer focus:outline-none text-blue-600 border-b-2 border-transparent hover:border-blue-600">
              Interview Report
            </Tab>
          </TabList>

          <div className="print:block">
            <TabPanel>
              <JobPostReport data={jobPostReport?.data} timeFilter={timeFilter} />
            </TabPanel>
            <TabPanel>
              <UserReport data={userReport?.data} timeFilter={timeFilter} />
            </TabPanel>
            <TabPanel>
              <ApplicationReport data={applicationReport?.data} timeFilter={timeFilter} />
            </TabPanel>
            <TabPanel>
              <InterviewReport data={interviewReport?.data} timeFilter={timeFilter} />
            </TabPanel>
          </div>
        </Tabs>
      )}

      {/* When printing all reports, show all reports */}
      <div className="hidden print:block">
        {jobPostReport?.data && activeTab !== 0 && (
          <div className="report-component page-break-before">
            <JobPostReport data={jobPostReport.data} timeFilter={timeFilter} />
          </div>
        )}
        {userReport?.data && activeTab !== 1 && (
          <div className="report-component page-break-before">
            <UserReport data={userReport.data} timeFilter={timeFilter} />
          </div>
        )}
        {applicationReport?.data && activeTab !== 2 && (
          <div className="report-component page-break-before">
            <ApplicationReport data={applicationReport.data} timeFilter={timeFilter} />
          </div>
        )}
        {interviewReport?.data && activeTab !== 3 && (
          <div className="report-component page-break-before">
            <InterviewReport data={interviewReport.data} timeFilter={timeFilter} />
          </div>
        )}
      </div>
    </div>
  );
}