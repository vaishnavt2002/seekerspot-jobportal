import React, { useEffect, useState } from "react";
import profileApi from "../../api/profileApi";
import { useNavigate } from "react-router-dom";

const SavedJobs = () => {
  const [savedJobs, setSavedJobs] = useState([]);
  const navigate = useNavigate();

  const fetchSavedJobs = async () => {
    try {
      const response = await profileApi.getSavedJobs();
      setSavedJobs(response);
      console.log("saved_jobs", response);
    } catch (err) {
      console.error("Error fetching saved jobs:", err);
    }
  };

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  const onDelete = (jobId) => {
    const deleteSavedJob = async () => {
      try {
        await profileApi.deleteSavedJob(jobId);
        fetchSavedJobs(); 
      } catch (err) {
        console.error("Error deleting saved job:", err);
      }
    };
    deleteSavedJob();
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg">
      <h2 className="text-2xl font-bold text-blue-600 mb-4">Saved Jobs</h2>
      {savedJobs.length > 0 ? (
        <ul className="space-y-4">
          {savedJobs.map((job, index) => (
            <li
              key={index}
              className="p-4 border rounded-xl hover:shadow-md transition duration-200"
            >
              <div
                className="cursor-pointer"
                onClick={() => {
                  navigate(`/job/${job.jobpost.id}/`);
                }}
              >
                <h3 className="text-lg font-semibold text-gray-800">
                  {job.jobpost.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {job.jobpost.company_name}
                </p>
                <p className="text-sm text-gray-500">
                  Deadline:{" "}
                  <span className="font-medium text-gray-700">
                    {new Date(job.jobpost.application_deadline).toLocaleString(
                      "en-IN",
                      {
                        dateStyle: "long",
                        timeStyle: "short",
                        timeZone: "Asia/Kolkata",
                      }
                    )}
                  </span>
                </p>
              </div>
              <button
                className="mt-3 text-red-600 hover:text-red-800 font-medium hover:underline"
                onClick={() => onDelete(job.jobpost.id)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No saved jobs available.</p>
      )}
    </div>
  );
};

export default SavedJobs;
