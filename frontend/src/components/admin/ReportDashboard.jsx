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
  const [loading, setLoading] = useState(false);
  
  // State for each report type
  const [jobPostReport, setJobPostReport] = useState(null);
  const [userReport, setUserReport] = useState(null);
  const [applicationReport, setApplicationReport] = useState(null);
  const [interviewReport, setInterviewReport] = useState(null);

  // Fetch data for the active tab
  useEffect(() => {
    fetchReportData();
  }, [activeTab]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const params = { time_period: 'all' }; // Always fetch all data
      
      switch (activeTab) {
        case 0: // Job Posts Report
          if (!jobPostReport) {
            const data = await reportApi.getJobPostReport(params);
            setJobPostReport({ data });
          }
          break;
        case 1: // User Report
          if (!userReport) {
            const data = await reportApi.getUserReport(params);
            setUserReport({ data });
          }
          break;
        case 2: // Application Report
          if (!applicationReport) {
            const data = await reportApi.getApplicationReport(params);
            setApplicationReport({ data });
          }
          break;
        case 3: // Interview Report
          if (!interviewReport) {
            const data = await reportApi.getInterviewReport(params);
            setInterviewReport({ data });
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

  return (
    <div className="max-w-full">
      <div className="flex justify-center items-center mb-6 no-print">
        <h1 className="text-2xl font-semibold">Admin Reports Dashboard</h1>
      </div>

      {/* Report header (for print only) */}
      <div className="report-header hidden print:block mb-8 text-center">
        <h1 className="text-2xl font-bold">Admin Reports</h1>
        <p className="text-gray-600">Report generated on: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
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
          <TabList className="flex border-b mb-6 no-print justify-center">
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

          <div className="print:block w-full">
            <TabPanel>
              <JobPostReport data={jobPostReport?.data} />
            </TabPanel>
            <TabPanel>
              <UserReport data={userReport?.data} />
            </TabPanel>
            <TabPanel>
              <ApplicationReport data={applicationReport?.data} />
            </TabPanel>
            <TabPanel>
              <InterviewReport data={interviewReport?.data} />
            </TabPanel>
          </div>
        </Tabs>
      )}
    </div>
  );
}