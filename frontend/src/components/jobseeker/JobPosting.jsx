import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import publicJobApi from "../../api/publicJobApi";
import { formatDistanceToNow } from "date-fns";

const JobPosting = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [job, setJob] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJob = async () => {
      setIsLoading(true);
      try {
        const response = await publicJobApi.getPublicJobPostById(jobId);
        setJob(response);
        console.log(response);
      } catch (err) {
        setError("Failed to load job details. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchJob();
  }, [jobId]);

  const handleBack = () => {
    navigate(`/find-jobs${location.search}`);
  };

  const formatSalary = (min, max) => {
    return `₹${min.toLocaleString("en-IN")} - ₹${max.toLocaleString("en-IN")}`;
  };

  if (isLoading) {
    return <div className="text-center py-6">Loading...</div>;
  }

  if (error || !job) {
    return <div className="text-center py-6 text-red-600">{error || "Job not found."}</div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto font-sans">
      <button
        onClick={handleBack}
        className="mb-6 text-blue-600 hover:underline flex items-center"
      >
        <svg
          className="w-5 h-5 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Jobs
      </button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div className="flex items-center space-x-4">
          <img
            src={`http://localhost:8000${job.job_provider.company_logo}`}
            alt={`${job.job_provider.company_name} Logo`}
            className="w-16 h-16 object-contain rounded"
          />
          <div>
            <h1 className="text-2xl font-bold">{job.title}</h1>
            <p className="text-green-600 font-semibold">
              {job.employment_type.replace("_", " ").toUpperCase()}
            </p>
            <p className="text-gray-600">{formatSalary(job.min_salary, job.max_salary)}</p>
            <p className="text-gray-500 text-sm">
              {job.job_provider.company_name} - {job.location}
            </p>
            <p className="text-gray-400 text-xs">
              Posted {formatDistanceToNow(new Date(job.created_at))} ago
            </p>
          </div>
        </div>
        <div className="flex space-x-2 mt-4 md:mt-0">
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Apply Now
          </button>
          <button className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400">
            Save
          </button>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Job Description</h2>
        <p className="text-gray-700">{job.description}</p>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Responsibilities</h2>
        <ul className="list-disc list-inside space-y-1 text-gray-700">
          {job.responsibilities_display.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Requirements</h2>
        <ul className="list-disc list-inside space-y-1 text-gray-700">
          {job.requirements_display.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Skills</h2>
        <div className="flex flex-wrap gap-2">
          {job.skills.map((skill) => (
            <span
              key={skill.id}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
            >
              {skill.name}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-gray-100 p-4 rounded shadow-sm max-w-sm">
        <div className="flex justify-between mb-2">
          <span className="font-medium">Job Location</span>
          <span className="text-gray-700">{job.location}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="font-medium">Job Type</span>
          <span className="text-gray-700">{job.job_type}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="font-medium">Experience Level</span>
          <span className="text-gray-700">{job.experience_level}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium">Salary</span>
          <span className="text-gray-700">{formatSalary(job.min_salary, job.max_salary)}</span>
        </div>
      </div>
    </div>
  );
};

export default JobPosting;