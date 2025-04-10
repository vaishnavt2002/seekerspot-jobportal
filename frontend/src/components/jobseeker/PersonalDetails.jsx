import React from "react";

const PersonalDetails = ({ user }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 bg-white p-6 rounded-xl shadow">
      {/* First Name */}
      <div>
        <label className="text-sm text-gray-600">First Name</label>
        <input
          type="text"
          value={user.firstName}
          disabled
          className="w-full mt-1 px-4 py-2 rounded-md bg-gray-100 border border-gray-300 text-gray-700"
        />
      </div>

      {/* Last Name */}
      <div>
        <label className="text-sm text-gray-600">Last Name</label>
        <input
          type="text"
          value={user.lastName}
          disabled
          className="w-full mt-1 px-4 py-2 rounded-md bg-gray-100 border border-gray-300 text-gray-700"
        />
      </div>

      {/* Gender */}
      <div>
        <label className="text-sm text-gray-600">Gender</label>
        <input
          type="text"
          value={user.gender}
          disabled
          className="w-full mt-1 px-4 py-2 rounded-md bg-gray-100 border border-gray-300 text-gray-700"
        />
      </div>

      {/* Current Salary */}
      <div>
        <label className="text-sm text-gray-600">Current Salary</label>
        <input
          type="text"
          value={user.currentSalary}
          disabled
          className="w-full mt-1 px-4 py-2 rounded-md bg-gray-100 border border-gray-300 text-gray-700"
        />
      </div>

      {/* Expected Salary */}
      <div>
        <label className="text-sm text-gray-600">Expected Salary</label>
        <input
          type="text"
          value={user.expectedSalary}
          disabled
          className="w-full mt-1 px-4 py-2 rounded-md bg-gray-100 border border-gray-300 text-gray-700"
        />
      </div>

      {/* Experience */}
      <div>
        <label className="text-sm text-gray-600">Experience</label>
        <input
          type="text"
          value={user.experience}
          disabled
          className="w-full mt-1 px-4 py-2 rounded-md bg-gray-100 border border-gray-300 text-gray-700"
        />
      </div>

      {/* Description */}
      <div className="md:col-span-2">
        <label className="text-sm text-gray-600">Description</label>
        <textarea
          value={user.description}
          disabled
          className="w-full mt-1 px-4 py-2 rounded-md bg-gray-100 border border-gray-300 text-gray-700"
        />
      </div>

      {/* Resume Link */}
      <div className="md:col-span-2">
        <label className="text-sm text-gray-600">Resume</label>
        <a
          href={user.resumeLink}
          target="_blank"
          rel="noopener noreferrer"
          className="block mt-1 text-blue-600 hover:underline break-all"
        >
          {user.resumeName}
        </a>
      </div>
    </div>
  );
};

export default PersonalDetails;
