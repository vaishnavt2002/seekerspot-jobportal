import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';
import jobApi from '../../api/jobApi';

// Search and Filters Component
const SearchAndFilters = ({ searchQuery, filters, sort, onSearchChange, onFilterChange, onSortChange, onClearAll }) => {
  return (
    <div className="mb-6 flex flex-col md:flex-row gap-4 items-center">
      <div className="relative w-full md:w-1/3">
        <input
          type="text"
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Search job posts..."
          className="border rounded px-3 py-2 w-full pr-10"
          aria-label="Search job posts"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange({ target: { value: '' } })}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>
      <select
        name="job_type"
        value={filters.job_type}
        onChange={onFilterChange}
        className="border rounded px-3 py-2 w-full md:w-1/5"
        aria-label="Filter by job type"
      >
        <option value="">All Job Types</option>
        <option value="REMOTE">Remote</option>
        <option value="HYBRID">Hybrid</option>
        <option value="ONSITE">Onsite</option>
      </select>
      <select
        name="status"
        value={filters.status}
        onChange={onFilterChange}
        className="border rounded px-3 py-2 w-full md:w-1/5"
        aria-label="Filter by status"
      >
        <option value="">All Statuses</option>
        <option value="DRAFT">Draft</option>
        <option value="PUBLISHED">Published</option>
        <option value="CLOSED">Closed</option>
      </select>
      <select
        name="domain"
        value={filters.domain}
        onChange={onFilterChange}
        className="border rounded px-3 py-2 w-full md:w-1/5"
        aria-label="Filter by domain"
      >
        <option value="">All Domains</option>
        <option value="ACCOUNTING">Accounting</option>
        <option value="IT">Information Technology</option>
        <option value="MANAGEMENT">Management</option>
        <option value="MARKETING">Marketing</option>
        <option value="ENGINEERING">Engineering</option>
        <option value="HEALTHCARE">Healthcare</option>
        <option value="EDUCATION">Education</option>
        <option value="OTHER">Other</option>
      </select>
      <select
        name="sort"
        value={sort}
        onChange={onSortChange}
        className="border rounded px-3 py-2 w-full md:w-1/5"
        aria-label="Sort job posts"
      >
        <option value="">Sort By</option>
        <option value="created_at">Newest First</option>
        <option value="-created_at">Oldest First</option>
        <option value="title">Title (A-Z)</option>
        <option value="-title">Title (Z-A)</option>
      </select>
      <button
        onClick={onClearAll}
        className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
        aria-label="Clear all filters and search"
      >
        Clear All
      </button>
    </div>
  );
};

// Job List Component
const JobList = ({ jobPosts, isLoading, hasMore, lastJobElementRef, onView, onEdit, onDelete, formatDate }) => {
  return (
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
          {jobPosts.map((job, index) => (
            <tr
              key={job.id}
              ref={index === jobPosts.length - 1 ? lastJobElementRef : null}
              className="border-b hover:bg-gray-50"
            >
              <td className="px-4 py-2">{job.title}</td>
              <td className="px-4 py-2">{job.location}</td>
              <td className="px-4 py-2">{job.job_type}</td>
              <td className="px-4 py-2">{formatDate(job.created_at)}</td>
              <td className="px-4 py-2">{job.status}</td>
              <td className="px-4 py-2 space-x-2">
                <button
                  className="border border-blue-600 text-blue-600 px-3 py-1 rounded hover:bg-blue-50"
                  onClick={() => onView(job.id)}
                  aria-label={`View job ${job.title}`}
                >
                  View
                </button>
                <button
                  className="border border-green-600 text-green-600 px-3 py-1 rounded hover:bg-green-50"
                  onClick={() => onEdit(job)}
                  aria-label={`Edit job ${job.title}`}
                >
                  Edit
                </button>
                <button
                  className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                  onClick={() => onDelete(job.id)}
                  aria-label={`Delete job ${job.title}`}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {isLoading && <p className="text-center py-4">Loading...</p>}
      {!hasMore && jobPosts.length > 0 && (
        <p className="text-center py-4 text-gray-500">No more job posts to load</p>
      )}
      {jobPosts.length === 0 && !isLoading && (
        <p className="text-center py-4 text-gray-500">No job posts found</p>
      )}
    </div>
  );
};

// Job Form Modal Component
const JobFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  formData,
  errors,
  selectedSkills,
  skillSearch,
  skillSuggestions,
  isLoadingSkills,
  onInputChange,
  onArrayInputChange,
  addArrayField,
  removeArrayField,
  onSkillSearchChange,
  onSkillSelect,
  onSkillRemove,
  title,
  submitButtonText,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl overflow-y-auto max-h-[80vh]">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <form onSubmit={onSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" htmlFor="title">
              Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={onInputChange}
              className={`w-full border rounded px-3 py-2 ${errors.title ? 'border-red-500' : ''}`}
              required
              aria-describedby={errors.title ? 'title-error' : undefined}
            />
            {errors.title && (
              <p id="title-error" className="text-red-500 text-sm mt-1">
                {errors.title}
              </p>
            )}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={onInputChange}
              className={`w-full border rounded px-3 py-2 ${errors.description ? 'border-red-500' : ''}`}
              rows="4"
              required
              aria-describedby={errors.description ? 'description-error' : undefined}
            />
            {errors.description && (
              <p id="description-error" className="text-red-500 text-sm mt-1">
                {errors.description}
              </p>
            )}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Requirements</label>
            {formData.requirements.map((req, index) => (
              <div key={index} className="flex mb-2">
                <input
                  type="text"
                  value={req}
                  onChange={(e) => onArrayInputChange(index, 'requirements', e.target.value)}
                  className={`w-full border rounded px-3 py-2 ${errors.requirements ? 'border-red-500' : ''}`}
                  aria-label={`Requirement ${index + 1}`}
                />
                {formData.requirements.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayField(index, 'requirements')}
                    className="ml-2 text-red-600"
                    aria-label={`Remove requirement ${index + 1}`}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            {errors.requirements && (
              <p className="text-red-500 text-sm mt-1">{errors.requirements}</p>
            )}
            <button
              type="button"
              onClick={() => addArrayField('requirements')}
              className="text-blue-600"
              aria-label="Add requirement"
            >
              + Add Requirement
            </button>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Responsibilities</label>
            {formData.responsibilities.map((resp, index) => (
              <div key={index} className="flex mb-2">
                <input
                  type="text"
                  value={resp}
                  onChange={(e) => onArrayInputChange(index, 'responsibilities', e.target.value)}
                  className={`w-full border rounded px-3 py-2 ${errors.responsibilities ? 'border-red-500' : ''}`}
                  aria-label={`Responsibility ${index + 1}`}
                />
                {formData.responsibilities.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayField(index, 'responsibilities')}
                    className="ml-2 text-red-600"
                    aria-label={`Remove responsibility ${index + 1}`}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            {errors.responsibilities && (
              <p className="text-red-500 text-sm mt-1">{errors.responsibilities}</p>
            )}
            <button
              type="button"
              onClick={() => addArrayField('responsibilities')}
              className="text-blue-600"
              aria-label="Add responsibility"
            >
              + Add Responsibility
            </button>
          </div>
          <div className="mb-4 relative">
            <label className="block text-sm font-medium mb-1" htmlFor="skills">
              Skills
            </label>
            <input
              type="text"
              id="skills"
              value={skillSearch}
              onChange={onSkillSearchChange}
              className={`w-full border rounded px-3 py-2 ${errors.skill_ids ? 'border-red-500' : ''}`}
              placeholder="Search for skills..."
              disabled={isLoadingSkills}
              aria-describedby={errors.skill_ids ? 'skills-error' : undefined}
            />
            {isLoadingSkills && <p className="text-gray-500 text-sm mt-1">Loading skills...</p>}
            {skillSuggestions.length > 0 ? (
              <ul className="absolute z-50 bg-white border rounded mt-1 max-h-40 overflow-y-auto w-full shadow-lg">
                {skillSuggestions.map((skill) => (
                  <li
                    key={skill.id}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => onSkillSelect(skill)}
                    role="option"
                    aria-selected={selectedSkills.some((s) => s.id === skill.id)}
                  >
                    {skill.name} ({skill.category || 'No category'})
                  </li>
                ))}
              </ul>
            ) : (
              skillSearch.length >= 2 &&
              !isLoadingSkills && <p className="text-gray-500 text-sm mt-1">No skills found</p>
            )}
            {selectedSkills.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedSkills.map((skill) => (
                  <div
                    key={skill.id}
                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded flex items-center"
                  >
                    {skill.name}
                    <button
                      type="button"
                      onClick={() => onSkillRemove(skill.id)}
                      className="ml-2 text-red-600"
                      aria-label={`Remove skill ${skill.name}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            {errors.skill_ids && (
              <p id="skills-error" className="text-red-500 text-sm mt-1">
                {errors.skill_ids}
              </p>
            )}
            <p className="text-gray-500 text-sm mt-1">
              Suggestions count: {skillSuggestions.length}
            </p>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" htmlFor="location">
              Location
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={onInputChange}
              className={`w-full border rounded px-3 py-2 ${errors.location ? 'border-red-500' : ''}`}
              required
              aria-describedby={errors.location ? 'location-error' : undefined}
            />
            {errors.location && (
              <p id="location-error" className="text-red-500 text-sm mt-1">
                {errors.location}
              </p>
            )}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" htmlFor="job_type">
              Job Type
            </label>
            <select
              id="job_type"
              name="job_type"
              value={formData.job_type}
              onChange={onInputChange}
              className="w-full border rounded px-3 py-2"
              aria-describedby={errors.job_type ? 'job_type-error' : undefined}
            >
              <option value="REMOTE">Remote</option>
              <option value="HYBRID">Hybrid</option>
              <option value="ONSITE">Onsite</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" htmlFor="employment_type">
              Employment Type
            </label>
            <select
              id="employment_type"
              name="employment_type"
              value={formData.employment_type}
              onChange={onInputChange}
              className="w-full border rounded px-3 py-2"
              aria-describedby={errors.employment_type ? 'employment_type-error' : undefined}
            >
              <option value="FULL_TIME">Full-time</option>
              <option value="PART_TIME">Part-time</option>
              <option value="INTERNSHIP">Internship</option>
              <option value="TRAINEE">Trainee</option>
              <option value="CONTRACT">Contract</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" htmlFor="domain">
              Domain
            </label>
            <select
              id="domain"
              name="domain"
              value={formData.domain}
              onChange={onInputChange}
              className="w-full border rounded px-3 py-2"
              aria-describedby={errors.domain ? 'domain-error' : undefined}
            >
              <option value="ACCOUNTING">Accounting</option>
              <option value="IT">Information Technology</option>
              <option value="MANAGEMENT">Management</option>
              <option value="MARKETING">Marketing</option>
              <option value="ENGINEERING">Engineering</option>
              <option value="HEALTHCARE">Healthcare</option>
              <option value="EDUCATION">Education</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" htmlFor="experience_level">
              Experience Level (Years)
            </label>
            <input
              type="number"
              id="experience_level"
              name="experience_level"
              value={formData.experience_level}
              onChange={onInputChange}
              className={`w-full border rounded px-3 py-2 ${errors.experience_level ? 'border-red-500' : ''}`}
              min="0"
              required
              aria-describedby={errors.experience_level ? 'experience_level-error' : undefined}
            />
            {errors.experience_level && (
              <p id="experience_level-error" className="text-red-500 text-sm mt-1">
                {errors.experience_level}
              </p>
            )}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" htmlFor="min_salary">
              Minimum Salary
            </label>
            <input
              type="number"
              id="min_salary"
              name="min_salary"
              value={formData.min_salary}
              onChange={onInputChange}
              className={`w-full border rounded px-3 py-2 ${errors.min_salary ? 'border-red-500' : ''}`}
              min="0"
              required
              aria-describedby={errors.min_salary ? 'min_salary-error' : undefined}
            />
            {errors.min_salary && (
              <p id="min_salary-error" className="text-red-500 text-sm mt-1">
                {errors.min_salary}
              </p>
            )}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" htmlFor="max_salary">
              Maximum Salary
            </label>
            <input
              type="number"
              id="max_salary"
              name="max_salary"
              value={formData.max_salary}
              onChange={onInputChange}
              className={`w-full border rounded px-3 py-2 ${errors.max_salary ? 'border-red-500' : ''}`}
              min="0"
              required
              aria-describedby={errors.max_salary ? 'max_salary-error' : undefined}
            />
            {errors.max_salary && (
              <p id="max_salary-error" className="text-red-500 text-sm mt-1">
                {errors.max_salary}
              </p>
            )}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" htmlFor="application_deadline">
              Application Deadline
            </label>
            <input
              type="date"
              id="application_deadline"
              name="application_deadline"
              value={formData.application_deadline}
              onChange={onInputChange}
              className={`w-full border rounded px-3 py-2 ${errors.application_deadline ? 'border-red-500' : ''}`}
              required
              aria-describedby={errors.application_deadline ? 'application_deadline-error' : undefined}
            />
            {errors.application_deadline && (
              <p id="application_deadline-error" className="text-red-500 text-sm mt-1">
                {errors.application_deadline}
              </p>
            )}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" htmlFor="status">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={onInputChange}
              className="w-full border rounded px-3 py-2"
              aria-describedby={errors.status ? 'status-error' : undefined}
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100"
              aria-label={`Cancel ${title.toLowerCase()}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              aria-label={submitButtonText}
            >
              {submitButtonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// View Job Modal Component
const ViewJobModal = ({ isOpen, onClose, job, formatDate }) => {
  if (!isOpen || !job) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl overflow-y-auto max-h-[80vh]">
        <h3 className="text-lg font-semibold mb-4">{job.title}</h3>
        <p className="mb-2">
          <strong>Description:</strong> {job.description}
        </p>
        <p className="mb-2">
          <strong>Requirements:</strong>
        </p>
        <ul className="list-disc pl-5 mb-2">
          {(job.requirements_display || []).map((req, index) => (
            <li key={index}>{req}</li>
          ))}
        </ul>
        <p className="mb-2">
          <strong>Responsibilities:</strong>
        </p>
        <ul className="list-disc pl-5 mb-2">
          {(job.responsibilities_display || []).map((resp, index) => (
            <li key={index}>{resp}</li>
          ))}
        </ul>
        <p className="mb-2">
          <strong>Skills:</strong>
        </p>
        <ul className="list-disc pl-5 mb-2">
          {(job.skills || []).map((skill, index) => (
            <li key={index}>{skill.name}</li>
          ))}
        </ul>
        <p className="mb-2">
          <strong>Location:</strong> {job.location}
        </p>
        <p className="mb-2">
          <strong>Job Type:</strong> {job.job_type}
        </p>
        <p className="mb-2">
          <strong>Employment Type:</strong> {job.employment_type}
        </p>
        <p className="mb-2">
          <strong>Domain:</strong> {job.domain}
        </p>
        <p className="mb-2">
          <strong>Experience Level:</strong> {job.experience_level} years
        </p>
        <p className="mb-2">
          <strong>Salary Range:</strong> ${job.min_salary} - ${job.max_salary}
        </p>
        <p className="mb-2">
          <strong>Application Deadline:</strong> {formatDate(job.application_deadline)}
        </p>
        <p className="mb-2">
          <strong>Status:</strong> {job.status}
        </p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100"
            aria-label="Close view job modal"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Delete Confirmation Modal Component
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-2">Confirm Deletion</h3>
        <p className="mb-4 text-gray-600">
          Are you sure you want to delete this job post? This action cannot be undone.
        </p>
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100"
            aria-label="Cancel deletion"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
            aria-label="Confirm deletion"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// Main JobPosts Component
const JobPosts = () => {
  const [jobPosts, setJobPosts] = useState([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: [''],
    responsibilities: [''],
    location: '',
    job_type: 'REMOTE',
    employment_type: 'FULL_TIME',
    skill_ids: [],
    domain: 'IT',
    experience_level: 0,
    min_salary: 0,
    max_salary: 0,
    application_deadline: '',
    status: 'DRAFT',
  });
  const [errors, setErrors] = useState({});
  const [skillSearch, setSkillSearch] = useState('');
  const [skillSuggestions, setSkillSuggestions] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    job_type: '',
    status: '',
    domain: '',
  });
  const [sort, setSort] = useState('');

  const observer = useRef();
  const lastJobElementRef = useRef();

  // Debounce search query
  const debouncedSetSearchQuery = useCallback(
    debounce((value) => {
      setSearchQuery(value);
    }, 300),
    []
  );

  // Debounce skill search
  const debouncedSearchSkills = useCallback(
    debounce(async (query) => {
      if (query.length < 2) {
        setSkillSuggestions([]);
        return;
      }
      setIsLoadingSkills(true);
      try {
        const skills = await jobApi.searchSkills(query);
        setSkillSuggestions(Array.isArray(skills) ? skills : []);
      } catch (error) {
        console.error('Search skills error:', error);
        setSkillSuggestions([]);
        alert('Failed to load skills. Please try again.');
      } finally {
        setIsLoadingSkills(false);
      }
    }, 300),
    []
  );

  // Memoize filter parameters
  const filterParams = useMemo(() => {
    const params = {
      page,
      page_size: 16,
      search: searchQuery,
      job_type: filters.job_type,
      status: filters.status,
      domain: filters.domain,
      sort,
    };
    Object.keys(params).forEach((key) => {
      if (params[key] === '' || params[key] === undefined) {
        delete params[key];
      }
    });
    return params;
  }, [page, searchQuery, filters.job_type, filters.status, filters.domain, sort]);

  // Fetch job posts
  useEffect(() => {
    setJobPosts([]);
    setPage(1);
    setHasMore(true);
    fetchJobPosts(true);
  }, [searchQuery, filters.job_type, filters.status, filters.domain, sort]);

  const fetchJobPosts = async (reset = false) => {
    if (isLoading || (!reset && !hasMore)) return;
    setIsLoading(true);
    try {
      const currentPage = reset ? 1 : page;
      const params = { ...filterParams, page: currentPage };

      const response = await jobApi.getJobPosts(params);
      const newJobs = response.results || [];
      setJobPosts((prev) => (reset ? newJobs : [...prev, ...newJobs]));
      setHasMore(!!response.next);
      if (newJobs.length > 0 && response.next) {
        setPage(currentPage + 1);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Fetch job posts error:', error);
      setJobPosts([]);
      setHasMore(false);
      alert('Failed to fetch job posts: ' + (error.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const debouncedFetch = useCallback(
    debounce(() => {
      if (hasMore && !isLoading) {
        fetchJobPosts();
      }
    }, 300),
    [hasMore, isLoading]
  );

  // Infinite scroll observer
  useEffect(() => {
    if (!lastJobElementRef.current || !hasMore || isLoading) return;
    observer.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          debouncedFetch();
        }
      },
      { threshold: 0.1 }
    );
    observer.current.observe(lastJobElementRef.current);
    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, [jobPosts, hasMore, isLoading, debouncedFetch]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    debouncedSetSearchQuery(value);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearAllFilters = () => {
    setFilters({
      job_type: '',
      status: '',
      domain: '',
    });
    setSort('');
    setSearchQuery('');
    debouncedSetSearchQuery('');
  };

  const handleSortChange = (e) => {
    setSort(e.target.value);
  };

  const handleSkillSearchChange = (e) => {
    const query = e.target.value;
    setSkillSearch(query);
    debouncedSearchSkills(query);
  };

  const handleSkillSelect = (skill) => {
    if (!selectedSkills.find((s) => s.id === skill.id)) {
      setSelectedSkills([...selectedSkills, skill]);
      setFormData({
        ...formData,
        skill_ids: [...formData.skill_ids, skill.id],
      });
    }
    setSkillSearch('');
    setSkillSuggestions([]);
  };

  const handleSkillRemove = (skillId) => {
    setSelectedSkills(selectedSkills.filter((s) => s.id !== skillId));
    setFormData({
      ...formData,
      skill_ids: formData.skill_ids.filter((id) => id !== skillId),
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters long';
    }

    if (formData.description.length < 5) {
      newErrors.description = 'Description must be at least 5 characters long';
    }

    const validRequirements = formData.requirements.filter((r) => r.trim() !== '');
    if (validRequirements.length === 0) {
      newErrors.requirements = 'At least one requirement is required';
    }

    const validResponsibilities = formData.responsibilities.filter((r) => r.trim() !== '');
    if (validResponsibilities.length === 0) {
      newErrors.responsibilities = 'At least one responsibility is required';
    }

    if (formData.location.length < 2) {
      newErrors.location = 'Location must be at least 2 characters long';
    }

    if (!formData.application_deadline) {
      newErrors.application_deadline = 'Application deadline is required';
    }

    if (formData.skill_ids.length === 0) {
      newErrors.skill_ids = 'At least one skill is required';
    }

    if (formData.min_salary < 0) {
      newErrors.min_salary = 'Minimum salary cannot be negative';
    }

    if (formData.max_salary < formData.min_salary) {
      newErrors.max_salary = 'Maximum salary must be greater than or equal to minimum salary';
    }

    if (formData.experience_level < 0) {
      newErrors.experience_level = 'Experience level cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const handleArrayInputChange = (index, field, value) => {
    const updatedArray = [...formData[field]];
    updatedArray[index] = value;
    setFormData({ ...formData, [field]: updatedArray });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const addArrayField = (field) => {
    setFormData({ ...formData, [field]: [...formData[field], ''] });
  };

  const removeArrayField = (index, field) => {
    const updatedArray = formData[field].filter((_, i) => i !== index);
    setFormData({ ...formData, [field]: updatedArray });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      const cleanedData = {
        ...formData,
        requirements: formData.requirements.filter((r) => r.trim() !== ''),
        responsibilities: formData.responsibilities.filter((r) => r.trim() !== ''),
        application_deadline: formData.application_deadline
          ? new Date(formData.application_deadline).toISOString()
          : null,
      };
      await jobApi.createJobPost(cleanedData);
      setAddModalOpen(false);
      resetForm();
      setPage(1);
      setHasMore(true);
      setJobPosts([]);
      fetchJobPosts(true);
    } catch (error) {
      console.error('Create job post error:', error);
      alert('Failed to create job post: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleEditJob = (job) => {
    setFormData({
      title: job.title,
      description: job.description,
      requirements: job.requirements_display.length > 0 ? job.requirements_display : [''],
      responsibilities: job.responsibilities_display.length > 0 ? job.responsibilities_display : [''],
      location: job.location,
      job_type: job.job_type,
      employment_type: job.employment_type,
      skill_ids: job.skills.map((s) => s.id),
      domain: job.domain,
      experience_level: job.experience_level,
      min_salary: job.min_salary,
      max_salary: job.max_salary,
      application_deadline: job.application_deadline ? job.application_deadline.split('T')[0] : '',
      status: job.status,
    });
    setSelectedSkills(job.skills);
    setSelectedJob(job);
    setEditModalOpen(true);
    setErrors({});
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      const cleanedData = {
        ...formData,
        requirements: formData.requirements.filter((r) => r.trim() !== ''),
        responsibilities: formData.responsibilities.filter((r) => r.trim() !== ''),
        application_deadline: formData.application_deadline
          ? new Date(formData.application_deadline).toISOString()
          : null,
      };
      await jobApi.updateJobPost(selectedJob.id, cleanedData);
      setEditModalOpen(false);
      resetForm();
      setPage(1);
      setHasMore(true);
      setJobPosts([]);
      fetchJobPosts(true);
    } catch (error) {
      console.error('Update job post error:', error);
      alert('Failed to update job post: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleViewJob = async (id) => {
    try {
      const data = await jobApi.getJobPost(id);
      setSelectedJob(data);
      setViewModalOpen(true);
    } catch (error) {
      console.error('View job error:', error);
      alert('Failed to fetch job details');
    }
  };

  const handleDelete = async () => {
    try {
      await jobApi.deleteJobPost(deleteId);
      setDeleteId(null);
      setPage(1);
      setHasMore(true);
      setJobPosts([]);
      fetchJobPosts(true);
    } catch (error) {
      console.error('Delete job error:', error);
      alert('Failed to delete job post');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      requirements: [''],
      responsibilities: [''],
      location: '',
      job_type: 'REMOTE',
      employment_type: 'FULL_TIME',
      skill_ids: [],
      domain: 'IT',
      experience_level: 0,
      min_salary: 0,
      max_salary: 0,
      application_deadline: '',
      status: 'DRAFT',
    });
    setSelectedSkills([]);
    setSkillSearch('');
    setSkillSuggestions([]);
    setErrors({});
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };

  return (
    <div className="p-4 md:p-8">
      <h2 className="text-2xl font-semibold mb-6">Job Posts</h2>
      <SearchAndFilters
        searchQuery={searchQuery}
        filters={filters}
        sort={sort}
        onSearchChange={handleSearchChange}
        onFilterChange={handleFilterChange}
        onSortChange={handleSortChange}
        onClearAll={clearAllFilters}
      />
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded mb-4 hover:bg-blue-700"
        onClick={() => setAddModalOpen(true)}
        aria-label="Add new job post"
      >
        Add new post +
      </button>
      <JobList
        jobPosts={jobPosts}
        isLoading={isLoading}
        hasMore={hasMore}
        lastJobElementRef={lastJobElementRef}
        onView={handleViewJob}
        onEdit={handleEditJob}
        onDelete={setDeleteId}
        formatDate={formatDate}
      />
      <JobFormModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSubmit={handleSubmit}
        formData={formData}
        errors={errors}
        selectedSkills={selectedSkills}
        skillSearch={skillSearch}
        skillSuggestions={skillSuggestions}
        isLoadingSkills={isLoadingSkills}
        onInputChange={handleInputChange}
        onArrayInputChange={handleArrayInputChange}
        addArrayField={addArrayField}
        removeArrayField={removeArrayField}
        onSkillSearchChange={handleSkillSearchChange}
        onSkillSelect={handleSkillSelect}
        onSkillRemove={handleSkillRemove}
        title="Add New Job Post"
        submitButtonText="Save"
      />
      <JobFormModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          resetForm();
        }}
        onSubmit={handleEditSubmit}
        formData={formData}
        errors={errors}
        selectedSkills={selectedSkills}
        skillSearch={skillSearch}
        skillSuggestions={skillSuggestions}
        isLoadingSkills={isLoadingSkills}
        onInputChange={handleInputChange}
        onArrayInputChange={handleArrayInputChange}
        addArrayField={addArrayField}
        removeArrayField={removeArrayField}
        onSkillSearchChange={handleSkillSearchChange}
        onSkillSelect={handleSkillSelect}
        onSkillRemove={handleSkillRemove}
        title="Edit Job Post"
        submitButtonText="Update"
      />
      <ViewJobModal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        job={selectedJob}
        formatDate={formatDate}
      />
      <DeleteConfirmationModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default JobPosts;