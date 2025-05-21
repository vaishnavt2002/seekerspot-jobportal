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
  const [showQuestionsModal, setShowQuestionsModal] = useState(false); // New state for questions modal
  const [answers, setAnswers] = useState([]); // State to store question answers
  const [addingSkills, setAddingSkills] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savingInProgress, setSavingInProgress] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const jobResponse = await publicJobApi.getPublicJobPostById(jobId);
        setJob(jobResponse);
        
        // Initialize answers for job questions
        if (jobResponse.questions && jobResponse.questions.length > 0) {
          setAnswers(
            jobResponse.questions.map(q => ({
              question_id: q.id,
              answer_text: q.question_type === 'YES_NO' ? 'No' : ''
            }))
          );
        }
        
        const skillsResponse = await publicJobApi.getUserSkills();
        setUserSkills(Array.isArray(skillsResponse) ? skillsResponse : []);
        
        const statusResponse = await publicJobApi.checkApplicationStatus(jobId);
        if (statusResponse && statusResponse.status) {
          setApplicationStatus(statusResponse.status);
        }
        
        const savedResponse = await publicJobApi.checkSavedStatus(jobId);
        if (savedResponse && typeof savedResponse.is_saved === 'boolean') {
          setIsSaved(savedResponse.is_saved);
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
  
  // Handle answer changes
  const handleAnswerChange = (questionId, value) => {
    setAnswers(prevAnswers => 
      prevAnswers.map(a => 
        a.question_id === questionId ? { ...a, answer_text: value } : a
      )
    );
    
    // Clear application error when user starts answering
    if (applicationError) {
      setApplicationError(null);
    }
  };
  
  // New approach: Use a state variable to track which step should come next
  const [nextStep, setNextStep] = useState(null);
  
  // Watch for nextStep changes and handle accordingly
  useEffect(() => {
    if (nextStep === 'showQuestions') {
      setShowQuestionsModal(true);
      setNextStep(null);
    } else if (nextStep === 'applyDirectly') {
      handleApplyDirect();
      setNextStep(null);
    }
  }, [nextStep]);
  
  // Direct apply function that doesn't involve state changes for modals
  const handleApplyDirect = async () => {
    setApplyingInProgress(true);
    setApplicationError(null);
    try {
      await publicJobApi.applyForJob(jobId, answers);
      setApplicationStatus("APPLIED");
    } catch (err) {
      console.error("Error applying:", err);
      setApplicationError(err.message || "Failed to apply for this job. Please try again.");
    } finally {
      setApplyingInProgress(false);
    }
  };
  
  // Apply via the questions modal
  const handleApply = async () => {
    setApplyingInProgress(true);
    setApplicationError(null);
    try {
      // Validate answers if there are questions
      if (job.questions && job.questions.length > 0) {
        // Check if all answers are provided
        const invalidAnswers = answers.filter(a => !a.answer_text.trim());
        if (invalidAnswers.length > 0) {
          setApplicationError("Please answer all questions before submitting.");
          setApplyingInProgress(false);
          return;
        }
      }
      
      // Send answers with the application
      await publicJobApi.applyForJob(jobId, answers);
      setApplicationStatus("APPLIED");
      setShowQuestionsModal(false);
    } catch (err) {
      console.error("Error applying:", err);
      setApplicationError(err.message || "Failed to apply for this job. Please try again.");
    } finally {
      setApplyingInProgress(false);
    }
  };
  
  // Check if answers are valid
  const areAnswersValid = () => {
    return answers.every(a => a.answer_text.trim() !== '');
  };

  // New approach for the initial apply button click
  const handleApplyClick = () => {
    const missingSkills = getMissingSkills();
    
    // If no missing skills and no questions, apply directly
    if (missingSkills.length === 0) {
      if (job.questions && job.questions.length > 0) {
        setShowQuestionsModal(true);
      } else {
        handleApplyDirect();
      }
    } else {
      // Show missing skills modal first
      setShowSkillsModal(true);
    }
  };
  
  const handleSaveToggle = async () => {
    setSavingInProgress(true);
    try {
      if (isSaved) {
        await publicJobApi.unsaveJob(jobId);
        setIsSaved(false);
      } else {
        await publicJobApi.saveJob(jobId);
        setIsSaved(true);
      }
    } catch (err) {
      console.error("Error toggling save status:", err);
    } finally {
      setSavingInProgress(false);
    }
  };
  
  const isSkillMatch = (skill) => {
    return Array.isArray(userSkills) && userSkills.some(userSkill => userSkill.id === skill.id);
  };

  const getMissingSkills = () => {
    if (!job || !job.skills) return [];
    return job.skills.filter(skill => !isSkillMatch(skill));
  };

  const handleAddSkills = async () => {
    const missingSkills = getMissingSkills();
    if (missingSkills.length === 0) return;
    
    setAddingSkills(true);
    try {
      const skillIds = missingSkills.map(skill => skill.id);
      const updatedSkills = await publicJobApi.addSkillsToProfile(skillIds);
      
      if (Array.isArray(updatedSkills)) {
        setUserSkills(updatedSkills);
      } else {
        const refreshedSkills = await publicJobApi.getUserSkills();
        setUserSkills(Array.isArray(refreshedSkills) ? refreshedSkills : []);
      }
      
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

  // Completely new implementation with a reliable transition flow
  const handleAddSkillsAndApply = async () => {
    try {
      setAddingSkills(true);
      await handleAddSkills();
      
      // First close the skills modal
      setShowSkillsModal(false);
      
      // Then schedule what to do next based on whether there are questions
      if (job.questions && job.questions.length > 0) {
        setNextStep('showQuestions');
      } else {
        setNextStep('applyDirectly');
      }
    } catch (err) {
      console.error("Error in handleAddSkillsAndApply:", err);
      setApplicationError("There was an error processing your request. Please try again.");
      setAddingSkills(false);
    }
  };
  
  // Completely revised to use the new approach
  const handleApplyAnyway = () => {
    // First close the skills modal
    setShowSkillsModal(false);
    
    // Schedule next action
    if (job.questions && job.questions.length > 0) {
      setNextStep('showQuestions');
    } else {
      setNextStep('applyDirectly');
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-gray-600">Loading...</div>;
  }

  if (error || !job) {
    return <div className="text-center py-8 text-red-600">{error || "Job not found."}</div>;
  }

  const matchedSkillsCount = job.skills.filter(skill => isSkillMatch(skill)).length;
  const totalSkillsCount = job.skills.length;
  const skillMatchPercentage = totalSkillsCount > 0 
    ? Math.round((matchedSkillsCount / totalSkillsCount) * 100) 
    : 0;

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto font-sans bg-gray-50 min-h-screen">
      <button
        onClick={handleBack}
        className="mb-6 text-blue-600 hover:text-blue-800 flex items-center transition-colors duration-200"
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

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div className="flex items-center space-x-4">
            <img
              src={`http://localhost:8000${job.job_provider.company_logo}`}
              alt={`${job.job_provider.company_name} Logo`}
              className="w-16 h-16 object-contain rounded-md border border-gray-200"
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{job.title}</h1>
              <p className="text-green-600 font-semibold text-lg">
                {job.employment_type.replace("_", " ").toUpperCase()}
              </p>
              <p className="text-gray-600 text-lg">{formatSalary(job.min_salary, job.max_salary)}</p>
              <p className="text-gray-500 text-sm">
                {job.job_provider.company_name} - {job.location}
              </p>
              <p className="text-gray-400 text-xs mt-1">
                Posted {formatDistanceToNow(new Date(job.created_at))} ago
              </p>
            </div>
          </div>
          <div className="flex flex-col space-y-3 mt-4 md:mt-0">
            {applicationStatus === "NOT_APPLIED" ? (
              <button 
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-all duration-200 transform hover:scale-105"
                onClick={handleApplyClick}
                disabled={applyingInProgress}
              >
                {applyingInProgress ? "Applying..." : "Apply Now"}
              </button>
            ) : (
              <button className="bg-green-600 text-white px-6 py-2 rounded-lg cursor-default">
                {applicationStatus === "APPLIED" ? "Applied" : applicationStatus}
              </button>
            )}
            <button 
              className={`flex items-center justify-center ${
                isSaved 
                  ? "bg-yellow-500 text-white" 
                  : "bg-gray-200 text-gray-800"
              } px-6 py-2 rounded-lg hover:${
                isSaved ? "bg-yellow-600" : "bg-gray-300"
              } disabled:opacity-50 transition-all duration-200 transform hover:scale-105`}
              onClick={handleSaveToggle}
              disabled={savingInProgress}
            >
              {savingInProgress ? (
                "Processing..."
              ) : (
                <>
                  {isSaved ? (
                    <>
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-5 w-5 mr-1" 
                        viewBox="0 0 20 20" 
                        fill="currentColor"
                      >
                        <path 
                          fillRule="evenodd" 
                          d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm11 1H6v8l4-2 4 2V6z" 
                          clipRule="evenodd" 
                        />
                      </svg>
                      Saved
                    </>
                  ) : (
                    <>
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-5 w-5 mr-1" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" 
                        />
                      </svg>
                      Save
                    </>
                  )}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Job Details Card */}
        <div className="bg-gray-100 p-5 rounded-lg shadow-sm max-w-sm mt-6 border border-gray-200">
          <div className="flex justify-between mb-3">
            <span className="font-medium text-gray-700">Job Location</span>
            <span className="text-gray-600">{job.location}</span>
          </div>
          <div className="flex justify-between mb-3">
            <span className="font-medium text-gray-700">Job Type</span>
            <span className="text-gray-600">{job.job_type}</span>
          </div>
          <div className="flex justify-between mb-3">
            <span className="font-medium text-gray-700">Experience Level</span>
            <span className="text-gray-600">{job.experience_level} years</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-700">Salary</span>
            <span className="text-gray-600">{formatSalary(job.min_salary, job.max_salary)}</span>
          </div>
        </div>
      </div>

      {applicationError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
          {applicationError}
        </div>
      )}

      {/* Application Questions Section */}
      {job.questions && job.questions.length > 0 && (
        <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">Application Questions</h2>
          <p className="text-gray-600 mb-4">
            You will be required to answer {job.questions.length} question{job.questions.length !== 1 ? 's' : ''} when applying for this position.
          </p>
        </div>
      )}

      {/* Skill Match Progress Bar */}
      <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between mb-2">
          <span className="font-semibold text-gray-800">Skill Match</span>
          <span className="text-sm font-medium text-blue-600">{skillMatchPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 shadow-sm">
          <div 
            className={`h-3 rounded-full transition-all duration-300 ${
              skillMatchPercentage > 70 ? 'bg-green-500' : 
              skillMatchPercentage > 40 ? 'bg-yellow-400' : 'bg-red-500'
            }`}
            style={{ width: `${skillMatchPercentage}%` }}
          ></div>
        </div>
        <div className="mt-3 text-sm text-gray-600">
          {matchedSkillsCount} out of {totalSkillsCount} required skills match your profile
        </div>
      </div>

      <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-gray-800 mb-3">Job Description</h2>
        <p className="text-gray-700 leading-relaxed">{job.description}</p>
      </div>

      <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-gray-800 mb-3">Responsibilities</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          {job.responsibilities_display.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-gray-800 mb-3">Requirements</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          {job.requirements_display.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-gray-800 mb-3">Skills</h2>
        <div className="flex flex-wrap gap-3">
          {job.skills.map((skill) => (
            <span
              key={skill.id}
              className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                isSkillMatch(skill)
                  ? "bg-green-100 text-green-800 border border-green-300"
                  : "bg-blue-100 text-blue-800 border border-blue-300"
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

      {/* Job Questions Modal */}
      {showQuestionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Application Questions</h3>
            <p className="mb-4 text-gray-600">
              Please answer the following questions to complete your application:
            </p>
            
            {applicationError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
                {applicationError}
              </div>
            )}
            
            <div className="mb-6 max-h-96 overflow-y-auto">
              {job.questions.map((question) => (
                <div key={question.id} className="mb-6">
                  <label className="block font-medium text-gray-700 mb-2">
                    {question.question_text}
                    <span className="ml-1 text-sm text-gray-500">
                      ({question.question_type === 'YES_NO' ? 'Yes/No Question' : 'Descriptive Question'})
                    </span>
                  </label>
                  
                  {question.question_type === 'YES_NO' ? (
                    <div className="flex space-x-4">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          value="Yes"
                          checked={answers.find(a => a.question_id === question.id)?.answer_text === 'Yes'}
                          onChange={() => handleAnswerChange(question.id, 'Yes')}
                          className="mr-2"
                        />
                        Yes
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          value="No"
                          checked={answers.find(a => a.question_id === question.id)?.answer_text === 'No'}
                          onChange={() => handleAnswerChange(question.id, 'No')}
                          className="mr-2"
                        />
                        No
                      </label>
                    </div>
                  ) : (
                    <textarea
                      value={answers.find(a => a.question_id === question.id)?.answer_text || ''}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      className="w-full border rounded px-3 py-2"
                      rows="3"
                      required
                      placeholder="Type your answer here..."
                    />
                  )}
                </div>
              ))}
            </div>
            
            <div className="flex justify-between gap-3">
              <button
                onClick={() => setShowQuestionsModal(false)}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-all duration-200"
                disabled={applyingInProgress || !areAnswersValid()}
              >
                {applyingInProgress ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Missing Skills Modal */}
      {showSkillsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Missing Skills</h3>
            <p className="mb-4 text-gray-600">
              The following skills on your profile don't match this job's requirements:
            </p>
            
            <div className="mb-6 max-h-48 overflow-y-auto">
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
            
            <div className="flex flex-wrap justify-between gap-3">
              <button
                onClick={() => setShowSkillsModal(false)}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-all duration-200 transform hover:scale-105"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSkillsAndApply}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-green-300 transition-all duration-200 transform hover:scale-105"
                disabled={addingSkills || applyingInProgress}
              >
                Add Skills & Apply
              </button>
              <button
                onClick={handleApplyAnyway}
                className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 disabled:bg-yellow-300 transition-all duration-200 transform hover:scale-105"
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