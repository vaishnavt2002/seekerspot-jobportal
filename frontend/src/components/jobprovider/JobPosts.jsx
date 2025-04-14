import React, { useState } from "react";

const initialJobs = [
  {
    id: 1,
    title: "UI UX Designer",
    location: "Chennai",
    type: "On-site",
    postedOn: "23/03/2025",
    status: "ACTIVE",
  },
  {
    id: 2,
    title: "Senior Developer",
    location: "Mumbai",
    type: "On-site",
    postedOn: "20/03/2025",
    status: "ACTIVE",
  },
];

export default function JobPosts() {
  const [jobs, setJobs] = useState(initialJobs);
  const [deleteId, setDeleteId] = useState(null);

  const handleDelete = () => {
    setJobs((prevJobs) => prevJobs.filter((job) => job.id !== deleteId));
    setDeleteId(null);
  };

  return (
    <div className="p-4 md:p-8">
      <h2 className="text-2xl font-semibold mb-6">Job posts</h2>
      <button className="bg-blue-600 text-white px-4 py-2 rounded mb-4 hover:bg-blue-700">Add new post +</button>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left border-collapse">
          <thead>
            <tr className="border-b">
              <th className="px-4 py-2 font-medium">JOB TITLE</th>
              <th className="px-4 py-2 font-medium">LOCATION</th>
              <th className="px-4 py-2 font-medium">TYPE</th>
              <th className="px-4 py-2 font-medium">POSTED ON</th>
              <th className="px-4 py-2 font-medium">STATUS</th>
              <th className="px-4 py-2 font-medium">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2">{job.title}</td>
                <td className="px-4 py-2">{job.location}</td>
                <td className="px-4 py-2">{job.type}</td>
                <td className="px-4 py-2">{job.postedOn}</td>
                <td className="px-4 py-2">{job.status}</td>
                <td className="px-4 py-2 space-x-2">
                  <button className="border border-blue-600 text-blue-600 px-3 py-1 rounded hover:bg-blue-50">Edit</button>
                  <button className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700" onClick={() => setDeleteId(job.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-2">Confirm Deletion</h3>
            <p className="mb-4 text-gray-600">Are you sure you want to delete this job post? This action cannot be undone.</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
