import React from 'react';

const StatCard = ({ title, value, growth, icon }) => {
  const isPositiveGrowth = growth >= 0;
  
  return (
    <div className="bg-white p-5 rounded-lg shadow border">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="p-2 bg-indigo-100 rounded-lg text-indigo-700">
            {icon}
          </div>
          <div className="ml-4">
            <h2 className="text-gray-600 text-sm">{title}</h2>
            <p className="text-2xl font-bold text-gray-800">{value.toLocaleString()}</p>
          </div>
        </div>
        
        <div className={`flex items-center ${isPositiveGrowth ? 'text-green-600' : 'text-red-600'}`}>
          <span className="mr-1">
            {isPositiveGrowth ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
              </svg>
            )}
          </span>
          <span className="font-semibold">{Math.abs(growth)}%</span>
        </div>
      </div>
    </div>
  );
};

export default StatCard;