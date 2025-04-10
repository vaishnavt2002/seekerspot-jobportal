import React from "react";

const SavedJobs = ({ savedJobs }) => {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl shadow-xl">
      <h2 className="text-2xl font-bold text-blue-700 mb-6 border-b pb-2">Saved Jobs</h2>
      <div className="space-y-6">
        {savedJobs.length > 0 ? (
          savedJobs.map((job, index) => (
            <div
              key={index}
              className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-lg transition duration-200"
            >
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700">Job Title</label>
                <input
                  type="text"
                  value={job.title}
                  disabled
                  className="w-full mt-1 px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700"
                />
              </div>
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700">Company</label>
                <input
                  type="text"
                  value={job.company}
                  disabled
                  className="w-full mt-1 px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700"
                />
              </div>
              <div className="flex flex-col sm:flex-row sm:gap-4 mb-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <input
                    type="text"
                    value={job.location}
                    disabled
                    className="w-full mt-1 px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">Saved Date</label>
                  <input
                    type="text"
                    value={job.savedDate}
                    disabled
                    className="w-full mt-1 px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700"
                  />
                </div>
              </div>
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={job.description}
                  disabled
                  className="w-full mt-1 px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700"
                ></textarea>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-600">No saved jobs to show.</p>
        )}
      </div>
    </div>
  );
};

export default SavedJobs;
