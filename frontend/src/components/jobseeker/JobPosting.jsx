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
  const [applicationStatus, setApplicationStatus] = useState("NOT_APPLIED");
  const [applyingInProgress, setApplyingInProgress] = useState(false);
  const [applicationError, setApplicationError] = useState(null);
  const [showSkillsModal, setShowSkillsModal] = useState(false);
  const [addingSkills, setAddingSkills] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch job details
        const jobResponse = await publicJobApi.getPublicJobPostById(jobId);
        setJob(jobResponse);
        
        // Fetch user skills
        const skillsResponse = await publicJobApi.getUserSkills();
        // Make sure userSkills is an array
        setUserSkills(Array.isArray(skillsResponse) ? skillsResponse : []);
        
        // Check application status
        const statusResponse = await publicJobApi.checkApplicationStatus(jobId);
        if (statusResponse && statusResponse.status) {
          setApplicationStatus(statusResponse.status);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load job details. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [jobId]);

  const handleBack = () => {
    navigate(`/find-jobs${location.search}`);
  };

  const formatSalary = (min, max) => {
    return `₹${min.toLocaleString("en-IN")} - ₹${max.toLocaleString("en-IN")}`;
  };
  
  const handleApply = async () => {
    setApplyingInProgress(true);
    setApplicationError(null);
    try {
      await publicJobApi.applyForJob(jobId);
      setApplicationStatus("APPLIED");
    } catch (err) {
      console.error("Error applying:", err);
      setApplicationError(err.message || "Failed to apply for this job. Please try again.");
    } finally {
      setApplyingInProgress(false);
    }
  };
  
  // Function to check if a job skill matches user skills
  const isSkillMatch = (skill) => {
    // Make sure userSkills is an array before calling .some()
    return Array.isArray(userSkills) && userSkills.some(userSkill => userSkill.id === skill.id);
  };

  // Get missing skills
  const getMissingSkills = () => {
    if (!job || !job.skills) return [];
    return job.skills.filter(skill => !isSkillMatch(skill));
  };

  // Add missing skills to profile
  const handleAddSkills = async () => {
    const missingSkills = getMissingSkills();
    if (missingSkills.length === 0) return;
    
    setAddingSkills(true);
    try {
      const skillIds = missingSkills.map(skill => skill.id);
      const updatedSkills = await publicJobApi.addSkillsToProfile(skillIds);
      
      // Ensure we handle the response correctly and update the state
      if (Array.isArray(updatedSkills)) {
        setUserSkills(updatedSkills);
      } else {
        // If the API doesn't return the complete list, refetch user skills
        const refreshedSkills = await publicJobApi.getUserSkills();
        setUserSkills(Array.isArray(refreshedSkills) ? refreshedSkills : []);
      }
      
      // After adding skills, check if we still need to show the modal
      const stillMissingSkills = job.skills.filter(
        jobSkill => !updatedSkills.some(userSkill => userSkill.id === jobSkill.id)
      ).length;
      
      if (stillMissingSkills === 0) {
        setShowSkillsModal(false);
      }
    } catch (err) {
      console.error("Error adding skills:", err);
    } finally {
      setAddingSkills(false);
    }
  };

  // Add skills and apply in one step
  const handleAddSkillsAndApply = async () => {
    await handleAddSkills();
    await handleApply();
    setShowSkillsModal(false);
  };
  
  // Apply anyway without adding skills
  const handleApplyAnyway = async () => {
    setShowSkillsModal(false);
    await handleApply();
  };

  // Determine whether to apply directly or show the skills modal
  const handleApplyClick = () => {
    const missingSkills = getMissingSkills();
    if (missingSkills.length === 0) {
      // If all skills match, apply directly
      handleApply();
    } else {
      // If skills don't match, show the modal
      setShowSkillsModal(true);
    }
  };

  if (isLoading) {
    return <div className="text-center py-6">Loading...</div>;
  }

  if (error || !job) {
    return <div className="text-center py-6 text-red-600">{error || "Job not found."}</div>;
  }

  // Calculate skill match percentage
  const matchedSkillsCount = job.skills.filter(skill => isSkillMatch(skill)).length;
  const totalSkillsCount = job.skills.length;
  const skillMatchPercentage = totalSkillsCount > 0 
    ? Math.round((matchedSkillsCount / totalSkillsCount) * 100) 
    : 0;

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
        <div className="flex flex-col space-y-2 mt-4 md:mt-0">
          {applicationStatus === "NOT_APPLIED" ? (
            <>
              <button 
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                onClick={handleApplyClick}
                disabled={applyingInProgress}
              >
                {applyingInProgress ? "Applying..." : "Apply Now"}
              </button>
            </>
          ) : (
            <button className="bg-green-600 text-white px-4 py-2 rounded cursor-default">
              {applicationStatus === "APPLIED" ? "Applied" : applicationStatus}
            </button>
          )}
          <button className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400">
            Save
          </button>
        </div>
      </div>
      
      {applicationError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {applicationError}
        </div>
      )}

      {/* Skill Match Progress Bar */}
      <div className="mb-6 bg-gray-100 p-4 rounded-lg">
        <div className="flex justify-between mb-1">
          <span className="font-medium">Skill Match</span>
          <span className="text-sm font-medium text-blue-700">{skillMatchPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className={`h-2.5 rounded-full ${
              skillMatchPercentage > 70 ? 'bg-green-600' : 
              skillMatchPercentage > 40 ? 'bg-yellow-400' : 'bg-red-600'
            }`}
            style={{ width: `${skillMatchPercentage}%` }}
          ></div>
        </div>
        <div className="mt-2 text-sm text-gray-600">
          {matchedSkillsCount} out of {totalSkillsCount} required skills match your profile
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
              className={`px-3 py-1 rounded-full text-sm ${
                isSkillMatch(skill)
                  ? "bg-green-100 text-green-800 border border-green-300"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {skill.name}
              {isSkillMatch(skill) && (
                <span className="ml-1 text-green-600">✓</span>
              )}
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

      {/* Missing Skills Modal */}
      {showSkillsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Missing Skills</h3>
            <p className="mb-4">
              The following skills on your profile don't match this job's requirements:
            </p>
            
            <div className="mb-4 max-h-48 overflow-y-auto">
              <ul className="space-y-2">
                {getMissingSkills().map(skill => (
                  <li key={skill.id} className="flex items-center">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      {skill.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="flex flex-wrap justify-between gap-2">
              <button
                onClick={() => setShowSkillsModal(false)}
                className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSkillsAndApply}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-green-300"
                disabled={addingSkills || applyingInProgress}
              >
                Add Skills & Apply
              </button>
              <button
                onClick={handleApplyAnyway}
                className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 disabled:bg-yellow-300"
                disabled={applyingInProgress}
              >
                Apply Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobPosting;