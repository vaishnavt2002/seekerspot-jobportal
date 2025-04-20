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
  const [userSkills, setUserSkills] = useState([]);
  const [showMissingSkillsWarning, setShowMissingSkillsWarning] = useState(false);
  const [missingSkills, setMissingSkills] = useState([]);
  const [isApplying, setIsApplying] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState(null);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  useEffect(() => {
    const fetchJobAndUserSkills = async () => {
      setIsLoading(true);
      try {
        // Fetch job details
        const jobResponse = await publicJobApi.getPublicJobPostById(jobId);
        setJob(jobResponse);
        
        // Fetch user skills if user is logged in
        if (localStorage.getItem('token')) {
          try {
            const userSkillsResponse = await publicJobApi.getUserSkills();
            setUserSkills(userSkillsResponse || []);
            
            // Check if user has already applied for this job
            const statusResponse = await publicJobApi.checkApplicationStatus(jobId);
            setApplicationStatus(statusResponse);
          } catch (skillError) {
            console.error("Error fetching user data:", skillError);
            setUserSkills([]);
          }
        }
      } catch (err) {
        setError("Failed to load job details. Please try again later.");
        console.error("Error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchJobAndUserSkills();
  }, [jobId]);

  useEffect(() => {
    // Identify missing skills when job and user skills are loaded
    if (job && job.skills && userSkills) {
      const missing = job.skills.filter(
        jobSkill => !userSkills.some(userSkill => userSkill.id === jobSkill.id)
      );
      setMissingSkills(missing);
    }
  }, [job, userSkills]);

  const handleBack = () => {
    navigate(`/find-jobs${location.search}`);
  };

  const formatSalary = (min, max) => {
    return `₹${min.toLocaleString("en-IN")} - ₹${max.toLocaleString("en-IN")}`;
  };

  const handleApplyClick = () => {
    if (!isAuthenticated) {
      // Redirect to login page with return URL
      navigate('/login', { state: { returnUrl: `/jobs/${jobId}` } });
      return;
    }
    
    if (missingSkills.length > 0) {
      setShowMissingSkillsWarning(true);
    } else {
      submitApplication();
    }
  };

  const submitApplication = async () => {
    setIsApplying(true);
    try {
      await publicJobApi.applyForJob(jobId);
      navigate('/my-applications', { state: { success: true, message: 'Application submitted successfully!' } });
    } catch (err) {
      console.error("Application submission error:", err);
      setError(err.response?.data?.error || "Failed to submit application. Please try again later.");
    } finally {
      setIsApplying(false);
      setShowMissingSkillsWarning(false);
    }
  };

  const addSkillsAndApply = async () => {
    try {
      // Add missing skills to user profile
      await publicJobApi.addSkillsToProfile(missingSkills.map(skill => skill.id));
      // Then submit application
      submitApplication();
    } catch (err) {
      console.error("Add skills error:", err);
      setError("Failed to add skills and apply. Please try again later.");
      setIsApplying(false);
    }
  };

  const hasUserSkill = (skillId) => {
    return userSkills && userSkills.some(userSkill => userSkill.id === skillId);
  };

  const hasAlreadyApplied = () => {
    return applicationStatus && applicationStatus.status !== "NOT_APPLIED";
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
            src={job.job_provider.company_logo ? `http://localhost:8000${job.job_provider.company_logo}` : "/placeholder-logo.png"}
            alt={`${job.job_provider.company_name} Logo`}
            className="w-16 h-16 object-contain rounded"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/placeholder-logo.png";
            }}
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
          {hasAlreadyApplied() ? (
            <button disabled className="bg-green-600 text-white px-4 py-2 rounded opacity-75">
              Applied ✓
            </button>
          ) : (
            <button 
              onClick={handleApplyClick}
              disabled={isApplying}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
            >
              {isApplying ? "Applying..." : "Apply Now"}
            </button>
          )}
          <button className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400">
            Save
          </button>
        </div>
      </div>

      {/* Missing Skills Warning Modal */}
      {showMissingSkillsWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Missing Skills</h3>
            <p className="mb-4">You're missing the following skills required for this job:</p>
            <ul className="list-disc list-inside mb-6">
              {missingSkills.map(skill => (
                <li key={skill.id} className="text-red-600">{skill.name}</li>
              ))}
            </ul>
            <p className="mb-6">You can still apply for this job, but it may affect your application's success rate.</p>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setShowMissingSkillsWarning(false)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button 
                onClick={addSkillsAndApply}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Add to Profile & Apply
              </button>
              <button 
                onClick={submitApplication}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Apply Anyway
              </button>
            </div>
          </div>
        </div>
      )}

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
          {job.skills.map((skill) => {
            const userHasSkill = hasUserSkill(skill.id);
            return (
              <div 
                key={skill.id}
                className={`flex items-center px-3 py-1 rounded-full text-sm ${
                  !isAuthenticated ? 'bg-blue-100 text-blue-800' :
                  userHasSkill ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}
              >
                {isAuthenticated && (
                  <span className="mr-1">
                    {userHasSkill ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </span>
                )}
                {skill.name}
              </div>
            );
          })}
        </div>
        {isAuthenticated && missingSkills.length > 0 && (
          <div className="mt-2 text-sm text-red-600">
            You're missing {missingSkills.length} skill{missingSkills.length !== 1 ? 's' : ''} required for this job.
          </div>
        )}
        {!isAuthenticated && (
          <div className="mt-2 text-sm text-blue-600">
            <button onClick={() => navigate('/login', { state: { returnUrl: `/jobs/${jobId}` } })} className="underline">
              Login to see your skill matches
            </button>
          </div>
        )}
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
          <span className="text-gray-700">{job.experience_level} years</span>
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