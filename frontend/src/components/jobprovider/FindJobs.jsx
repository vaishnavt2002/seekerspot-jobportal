import React from "react";

const FindJobs = () => {
  const jobs = [
    {
      title: "UI/UX Designer",
      company: "Google Inc.",
      location: "Mumbai, India",
      type: "FULL-TIME",
      salary: "Rs 2,00,000 - Rs 3,00,000",
      time: "36 minutes ago",
      logo: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg",
    },
    {
      title: "Web Developer Trainee",
      company: "Infosys",
      location: "Mumbai, India",
      type: "FULL-TIME",
      salary: "Rs 20,000 - Rs 25,000",
      time: "1 week ago",
      logo: "https://upload.wikimedia.org/wikipedia/commons/9/9d/Infosys_logo.svg",
    },
    {
      title: "Project Manager",
      company: "Wipro",
      location: "Bangalore, India",
      type: "FULL-TIME",
      salary: "Rs 70,000 - Rs 1,00,000",
      time: "1 day ago",
      logo: "https://upload.wikimedia.org/wikipedia/commons/0/01/Wipro_Primary_Logo_Color_RGB.svg",
    },
  ];

  const repeatedJobs = Array(4).fill(jobs).flat();

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Search and Filter Section */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by: Job title, Position, Keyword..."
            className="w-full md:w-1/2 px-4 py-2 rounded border border-gray-300 shadow-sm"
          />
          <input
            type="text"
            placeholder="City, state or zip code"
            className="w-full md:w-1/3 px-4 py-2 rounded border border-gray-300 shadow-sm"
          />
          <div className="flex gap-2">
            <button className="bg-gray-100 px-4 py-2 rounded border border-gray-300">Filters</button>
            <button className="bg-blue-600 text-white px-4 py-2 rounded">Find Job</button>
          </div>
        </div>

        {/* Breadcrumb */}
        <p className="text-sm text-gray-600 mb-4">Home / Find Jobs</p>

        {/* Job Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {repeatedJobs.map((job, index) => (
            <div key={index} className="bg-white p-4 rounded-lg shadow hover:shadow-md transition">
              <div className="flex items-center gap-4 mb-2">
                <img src={job.logo} alt="logo" className="h-10 w-10 object-contain" />
                <div>
                  <h3 className="text-lg font-semibold">{job.title}</h3>
                  <p className="text-sm text-gray-500">{job.company} - {job.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded">
                  {job.type}
                </span>
                <span className="text-sm text-gray-600">Salary: {job.salary}</span>
              </div>
              <p className="text-xs text-gray-400">{job.time}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FindJobs;
