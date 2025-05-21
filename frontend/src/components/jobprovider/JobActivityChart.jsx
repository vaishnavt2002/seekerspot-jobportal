import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const JobActivityChart = ({ data }) => {
  // Convert string dates to Date objects and ensure consistent formatting
  const formattedData = Array.isArray(data) ? data.map(item => ({
    ...item,
    date: new Date(item.date) // Convert to Date object
  })) : [];

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    // Parse the date string and format it consistently
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
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

  // If no data, show a placeholder
  if (!formattedData || formattedData.length === 0) {
    return (
      <div className="w-full h-56 flex items-center justify-center bg-gray-50 rounded">
        <p className="text-gray-500">No job post data available</p>
      </div>
    );
  }

  // Sort data chronologically to ensure proper chart display
  const sortedData = [...formattedData].sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="w-full h-56">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={sortedData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatDate} 
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            tickFormatter={formatYAxis} 
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="count" 
            name="Job Posts" 
            stroke="#4F46E5" 
            fill="#4F46E5" 
            fillOpacity={0.2} 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default JobActivityChart;