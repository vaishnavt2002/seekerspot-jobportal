import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const UserGrowthChart = ({ data, interval }) => {
  const mergeAndSortData = () => {
    if (!data || !data.all_users || !data.job_seekers || !data.job_providers) {
      return [];
    }

    // Create a map of all dates to ensure we have all data points
    const dateMap = {};

    // Process all data sets to collect all unique dates
    [...data.all_users, ...data.job_seekers, ...data.job_providers].forEach(item => {
      if (!dateMap[item.date]) {
        dateMap[item.date] = { date: item.date };
      }
    });

    // Sort all dates chronologically
    const sortedDates = Object.keys(dateMap).sort((a, b) => new Date(a) - new Date(b));

    // Initialize the merged data with proper cumulative values
    const mergedData = [];
    let lastAllUsers = 0;
    let lastJobSeekers = 0;
    let lastJobProviders = 0;

    // Create lookup objects for each data series
    const allUsersMap = data.all_users.reduce((acc, item) => {
      acc[item.date] = item.count;
      return acc;
    }, {});

    const jobSeekersMap = data.job_seekers.reduce((acc, item) => {
      acc[item.date] = item.count;
      return acc;
    }, {});

    const jobProvidersMap = data.job_providers.reduce((acc, item) => {
      acc[item.date] = item.count;
      return acc;
    }, {});

    sortedDates.forEach(date => {
      lastAllUsers = allUsersMap[date] !== undefined ? allUsersMap[date] : lastAllUsers;
      lastJobSeekers = jobSeekersMap[date] !== undefined ? jobSeekersMap[date] : lastJobSeekers;
      lastJobProviders = jobProvidersMap[date] !== undefined ? jobProvidersMap[date] : lastJobProviders;

      mergedData.push({
        date,
        allUsers: lastAllUsers,
        jobSeekers: lastJobSeekers,
        jobProviders: lastJobProviders
      });
    });

    return mergedData;
  };

  const mergedData = mergeAndSortData();

  const formatDate = (date) => {
    if (!date) return '';
    const dateObj = new Date(date);
    
    if (interval === 'day') {
      return dateObj.toLocaleDateString();
    } else if (interval === 'week') {
      return `Week of ${dateObj.toLocaleDateString()}`;
    } else {
      // For month
      return dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
  };

  // Format tick values for X axis
  const formatXAxisTick = (date) => {
    if (!date) return '';
    const dateObj = new Date(date);
    
    if (interval === 'day') {
      return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (interval === 'week') {
      return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      // For month
      return dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
  };

  const formatYAxis = (value) => {
    return value.toLocaleString();
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-sm">
          <p className="font-semibold mb-1">{formatDate(label)}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center">
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: entry.color }}
              ></div>
              <p className="text-sm">
                <span className="font-medium">{entry.name}: </span>
                <span>{entry.value.toLocaleString()}</span>
              </p>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const getTickCount = () => {
    if (!mergedData.length) return 5;
    
    if (interval === 'day') {
      return Math.min(7, mergedData.length);
    } else if (interval === 'week') {
      return Math.min(10, mergedData.length);
    } else {
      return Math.min(12, mergedData.length);
    }
  };

  if (!mergedData.length) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-gray-50 rounded">
        <p className="text-gray-500">No growth data available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={mergedData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatXAxisTick} 
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
            tickCount={getTickCount()}
          />
          <YAxis 
            tickFormatter={formatYAxis} 
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            type="monotone"
            name="Total Users"
            dataKey="allUsers"
            stroke="#4F46E5"
            activeDot={{ r: 8 }}
            strokeWidth={2}
          />
          <Line
            type="monotone"
            name="Job Seekers"
            dataKey="jobSeekers"
            stroke="#10B981"
            strokeWidth={2}
          />
          <Line
            type="monotone"
            name="Job Providers"
            dataKey="jobProviders"
            stroke="#F59E0B"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default UserGrowthChart;