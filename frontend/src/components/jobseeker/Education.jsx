import React from "react";

const Education = ({ education }) => {
  return (
    <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-2xl shadow-xl">
      <h2 className="text-2xl font-bold text-green-700 mb-6 border-b pb-2">Education</h2>
      <div className="space-y-6">
        {education.map((edu, index) => (
          <div
            key={index}
            className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-lg transition duration-200"
          >
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700">Institution</label>
              <input
                type="text"
                value={edu.institution}
                disabled
                className="w-full mt-1 px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700"
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700">Degree</label>
              <input
                type="text"
                value={edu.degree}
                disabled
                className="w-full mt-1 px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700"
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:gap-4 mb-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">Start Year</label>
                <input
                  type="text"
                  value={edu.startYear}
                  disabled
                  className="w-full mt-1 px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">End Year</label>
                <input
                  type="text"
                  value={edu.endYear}
                  disabled
                  className="w-full mt-1 px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700"
                />
              </div>
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <input
                type="text"
                value={edu.location}
                disabled
                className="w-full mt-1 px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700"
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700">Field of Study</label>
              <input
                type="text"
                value={edu.fieldOfStudy}
                disabled
                className="w-full mt-1 px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Education;
