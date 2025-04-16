import React, { useState, useEffect } from 'react';
import jobApi from '../../api/jobApi';

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
    domain: 'IT',
    experience_level: 0,
    min_salary: 0,
    max_salary: 0,
    application_deadline: '',
    status: 'DRAFT',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchJobPosts();
  }, []);

  const fetchJobPosts = async () => {
    try {
      const data = await jobApi.getJobPosts();
      setJobPosts(data || []);
    } catch (error) {
      console.error('Fetch job posts error:', error);
      setJobPosts([]);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters long';
    }
    
    if (formData.description.length < 5) {
      newErrors.description = 'Description must be at least 5 characters long';
    }
    
    const validRequirements = formData.requirements.filter(r => r.trim() !== '');
    if (validRequirements.length === 0) {
      newErrors.requirements = 'At least one requirement is required';
    }
    
    const validResponsibilities = formData.responsibilities.filter(r => r.trim() !== '');
    if (validResponsibilities.length === 0) {
      newErrors.responsibilities = 'At least one responsibility is required';
    }
    
    if (formData.location.length < 2) {
      newErrors.location = 'Location must be at least 2 characters long';
    }
    
    if (!formData.application_deadline) {
      newErrors.application_deadline = 'Application deadline is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error when user starts typing
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
    if (!validateForm()) {
      return;
    }
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
      fetchJobPosts();
    } catch (error) {
      console.error('Create job post error:', error);
      alert('Failed to create job post: ' + error.message);
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
      domain: job.domain,
      experience_level: job.experience_level,
      min_salary: job.min_salary,
      max_salary: job.max_salary,
      application_deadline: job.application_deadline ? job.application_deadline.split('T')[0] : '',
      status: job.status,
    });
    setSelectedJob(job);
    setEditModalOpen(true);
    setErrors({});
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
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
      fetchJobPosts();
    } catch (error) {
      console.error('Update job post error:', error);
      alert('Failed to update job post: ' + error.message);
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
      fetchJobPosts();
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
      domain: 'IT',
      experience_level: 0,
      min_salary: 0,
      max_salary: 0,
      application_deadline: '',
      status: 'DRAFT',
    });
    setErrors({});
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };

  return (
    <div className="p-4 md:p-8">
      <h2 className="text-2xl font-semibold mb-6">Job Posts</h2>
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded mb-4 hover:bg-blue-700"
        onClick={() => setAddModalOpen(true)}
      >
        Add new post +
      </button>
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
            {jobPosts.map((job) => (
              <tr key={job.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2">{job.title}</td>
                <td className="px-4 py-2">{job.location}</td>
                <td className="px-4 py-2">{job.job_type}</td>
                <td className="px-4 py-2">{formatDate(job.created_at)}</td>
                <td className="px-4 py-2">{job.status}</td>
                <td className="px-4 py-2 space-x-2">
                  <button
                    className="border border-blue-600 text-blue-600 px-3 py-1 rounded hover:bg-blue-50"
                    onClick={() => handleViewJob(job.id)}
                  >
                    View
                  </button>
                  <button
                    className="border border-green-600 text-green-600 px-3 py-1 rounded hover:bg-green-50"
                    onClick={() => handleEditJob(job)}
                  >
                    Edit
                  </button>
                  <button
                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                    onClick={() => setDeleteId(job.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Job Post Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl overflow-y-auto max-h-[80vh]">
            <h3 className="text-lg font-semibold mb-4">Add New Job Post</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`w-full border rounded px-3 py-2 ${errors.title ? 'border-red-500' : ''}`}
                  required
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className={`w-full border rounded px-3 py-2 ${errors.description ? 'border-red-500' : ''}`}
                  rows="4"
                  required
                />
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Requirements</label>
                {formData.requirements.map((req, index) => (
                  <div key={index} className="flex mb-2">
                    <input
                      type="text"
                      value={req}
                      onChange={(e) => handleArrayInputChange(index, 'requirements', e.target.value)}
                      className={`w-full border rounded px-3 py-2 ${errors.requirements ? 'border-red-500' : ''}`}
                    />
                    {formData.requirements.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayField(index, 'requirements')}
                        className="ml-2 text-red-600"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                {errors.requirements && <p className="text-red-500 text-sm mt-1">{errors.requirements}</p>}
                <button
                  type="button"
                  onClick={() => addArrayField('requirements')}
                  className="text-blue-600"
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
                      onChange={(e) => handleArrayInputChange(index, 'responsibilities', e.target.value)}
                      className={`w-full border rounded px-3 py-2 ${errors.responsibilities ? 'border-red-500' : ''}`}
                    />
                    {formData.responsibilities.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayField(index, 'responsibilities')}
                        className="ml-2 text-red-600"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                {errors.responsibilities && <p className="text-red-500 text-sm mt-1">{errors.responsibilities}</p>}
                <button
                  type="button"
                  onClick={() => addArrayField('responsibilities')}
                  className="text-blue-600"
                >
                  + Add Responsibility
                </button>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className={`w-full border rounded px-3 py-2 ${errors.location ? 'border-red-500' : ''}`}
                  required
                />
                {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Job Type</label>
                <select
                  name="job_type"
                  value={formData.job_type}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="REMOTE">Remote</option>
                  <option value="HYBRID">Hybrid</option>
                  <option value="ONSITE">Onsite</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Employment Type</label>
                <select
                  name="employment_type"
                  value={formData.employment_type}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="FULL_TIME">Full-time</option>
                  <option value="PART_TIME">Part-time</option>
                  <option value="INTERNSHIP">Internship</option>
                  <option value="TRAINEE">Trainee</option>
                  <option value="CONTRACT">Contract</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Domain</label>
                <select
                  name="domain"
                  value={formData.domain}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2"
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
                <label className="block text-sm font-medium mb-1">Experience Level (Years)</label>
                <input
                  type="number"
                  name="experience_level"
                  value={formData.experience_level}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2"
                  min="0"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Minimum Salary</label>
                <input
                  type="number"
                  name="min_salary"
                  value={formData.min_salary}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2"
                  min="0"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Maximum Salary</label>
                <input
                  type="number"
                  name="max_salary"
                  value={formData.max_salary}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2"
                  min="0"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Application Deadline</label>
                <input
                  type="date"
                  name="application_deadline"
                  value={formData.application_deadline}
                  onChange={handleInputChange}
                  className={`w-full border rounded px-3 py-2 ${errors.application_deadline ? 'border-red-500' : ''}`}
                  required
                />
                {errors.application_deadline && <p className="text-red-500 text-sm mt-1">{errors.application_deadline}</p>}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Job Post Modal */}
      {editModalOpen && selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl overflow-y-auto max-h-[80vh]">
            <h3 className="text-lg font-semibold mb-4">Edit Job Post</h3>
            <form onSubmit={handleEditSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`w-full border rounded px-3 py-2 ${errors.title ? 'border-red-500' : ''}`}
                  required
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className={`w-full border rounded px-3 py-2 ${errors.description ? 'border-red-500' : ''}`}
                  rows="4"
                  required
                />
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Requirements</label>
                {formData.requirements.map((req, index) => (
                  <div key={index} className="flex mb-2">
                    <input
                      type="text"
                      value={req}
                      onChange={(e) => handleArrayInputChange(index, 'requirements', e.target.value)}
                      className={`w-full border rounded px-3 py-2 ${errors.requirements ? 'border-red-500' : ''}`}
                    />
                    {formData.requirements.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayField(index, 'requirements')}
                        className="ml-2 text-red-600"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                {errors.requirements && <p className="text-red-500 text-sm mt-1">{errors.requirements}</p>}
                <button
                  type="button"
                  onClick={() => addArrayField('requirements')}
                  className="text-blue-600"
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
                      onChange={(e) => handleArrayInputChange(index, 'responsibilities', e.target.value)}
                      className={`w-full border rounded px-3 py-2 ${errors.responsibilities ? 'border-red-500' : ''}`}
                    />
                    {formData.responsibilities.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayField(index, 'responsibilities')}
                        className="ml-2 text-red-600"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                {errors.responsibilities && <p className="text-red-500 text-sm mt-1">{errors.responsibilities}</p>}
                <button
                  type="button"
                  onClick={() => addArrayField('responsibilities')}
                  className="text-blue-600"
                >
                  + Add Responsibility
                </button>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className={`w-full border rounded px-3 py-2 ${errors.location ? 'border-red-500' : ''}`}
                  required
                />
                {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Job Type</label>
                <select
                  name="job_type"
                  value={formData.job_type}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="REMOTE">Remote</option>
                  <option value="HYBRID">Hybrid</option>
                  <option value="ONSITE">Onsite</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Employment Type</label>
                <select
                  name="employment_type"
                  value={formData.employment_type}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="FULL_TIME">Full-time</option>
                  <option value="PART_TIME">Part-time</option>
                  <option value="INTERNSHIP">Internship</option>
                  <option value="TRAINEE">Trainee</option>
                  <option value="CONTRACT">Contract</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Domain</label>
                <select
                  name="domain"
                  value={formData.domain}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2"
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
                <label className="block text-sm font-medium mb-1">Experience Level (Years)</label>
                <input
                  type="number"
                  name="experience_level"
                  value={formData.experience_level}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2"
                  min="0"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Minimum Salary</label>
                <input
                  type="number"
                  name="min_salary"
                  value={formData.min_salary}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2"
                  min="0"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Maximum Salary</label>
                <input
                  type="number"
                  name="max_salary"
                  value={formData.max_salary}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2"
                  min="0"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Application Deadline</label>
                <input
                  type="date"
                  name="application_deadline"
                  value={formData.application_deadline}
                  onChange={handleInputChange}
                  className={`w-full border rounded px-3 py-2 ${errors.application_deadline ? 'border-red-500' : ''}`}
                  required
                />
                {errors.application_deadline && <p className="text-red-500 text-sm mt-1">{errors.application_deadline}</p>}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {setEditModalOpen(false); resetForm();}}
                  className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Job Post Modal */}
      {viewModalOpen && selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl overflow-y-auto max-h-[80vh]">
            <h3 className="text-lg font-semibold mb-4">{selectedJob.title}</h3>
            <p className="mb-2"><strong>Description:</strong> {selectedJob.description}</p>
            <p className="mb-2"><strong>Requirements:</strong></p>
            <ul className="list-disc pl-5 mb-2">
              {(selectedJob.requirements_display || []).map((req, index) => (
                <li key={index}>{req}</li>
              ))}
            </ul>
            <p className="mb-2"><strong>Responsibilities:</strong></p>
            <ul className="list-disc pl-5 mb-2">
              {(selectedJob.responsibilities_display || []).map((resp, index) => (
                <li key={index}>{resp}</li>
              ))}
            </ul>
            <p className="mb-2"><strong>Location:</strong> {selectedJob.location}</p>
            <p className="mb-2"><strong>Job Type:</strong> {selectedJob.job_type}</p>
            <p className="mb-2"><strong>Employment Type:</strong> {selectedJob.employment_type}</p>
            <p className="mb-2"><strong>Domain:</strong> {selectedJob.domain}</p>
            <p className="mb-2"><strong>Experience Level:</strong> {selectedJob.experience_level} years</p>
            <p className="mb-2"><strong>Salary Range:</strong> ${selectedJob.min_salary} - ${selectedJob.max_salary}</p>
            <p className="mb-2"><strong>Application Deadline:</strong> {formatDate(selectedJob.application_deadline)}</p>
            <p className="mb-2"><strong>Status:</strong> {selectedJob.status}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setViewModalOpen(false)}
                className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
};

export default JobPosts;