import React, { useState, useEffect } from 'react';
import profileApi from '../../api/profileApi';

const Skill = () => {
  const [skills, setSkills] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [skillSearch, setSkillSearch] = useState('');
  const [skillSuggestions, setSkillSuggestions] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    setLoading(true);
    try {
      const data = await profileApi.getJobSeekerSkills();
      setSkills(data);
      setError(null);
    } catch (err) {
      if (err.message.includes('Job seeker profile not found')) {
        setError('Please complete your job seeker profile to manage skills.');
      } else {
        setError(err.message);
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSkillSearchChange = async (e) => {
    const query = e.target.value;
    setSkillSearch(query);

    if (query.length >= 2) {
      try {
        const suggestions = await profileApi.searchSkills(query);
        setSkillSuggestions(suggestions);
      } catch (err) {
        setError('Error fetching skill suggestions.');
        console.error(err);
      }
    } else {
      setSkillSuggestions([]);
    }
  };

  const handleSkillSelect = (skill) => {
    // Check if the skill is already selected
    if (!selectedSkills.some(s => s.id === skill.id)) {
      setSelectedSkills([...selectedSkills, skill]);
    }
    setSkillSearch('');
    setSkillSuggestions([]);
    setValidationErrors({});
  };

  const handleRemoveSelectedSkill = (skillId) => {
    setSelectedSkills(selectedSkills.filter(skill => skill.id !== skillId));
  };

  const validateForm = () => {
    const errors = {};
    if (selectedSkills.length === 0) {
      errors.skill = 'Please select at least one skill.';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddSkills = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const skillIds = selectedSkills.map(skill => skill.id);
      await profileApi.addJobSeekerSkills({ skill_ids: skillIds });
      
      setIsAddModalOpen(false);
      setSelectedSkills([]);
      setSkillSearch('');
      setSkillSuggestions([]);
      fetchSkills();
      setError(null);
    } catch (err) {
      if (err.message.includes('Job seeker profile not found')) {
        setError('Please complete your job seeker profile to add skills.');
      } else if (err.message.includes('already added')) {
        setError('One or more skills are already added to your profile.');
      } else {
        setError(err.message);
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSkill = async () => {
    if (!deleteId) return;

    setLoading(true);
    try {
      await profileApi.deleteJobSeekerSkill(deleteId);
      setDeleteId(null);
      fetchSkills();
      setError(null);
    } catch (err) {
      if (err.message.includes('Job seeker profile not found')) {
        setError('Please complete your job seeker profile to delete skills.');
      } else {
        setError(err.message);
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-2xl shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-green-700 border-b pb-2">Skills</h2>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
        >
          Add Skills
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && skills.length === 0 && <p>No skills added yet.</p>}

      <div className="space-y-6">
        {skills.map((jobSeekerSkill) => {
          const skill = jobSeekerSkill.skill;
          return (
            <div
              key={skill.id}
              className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-lg transition duration-200"
            >
              <div className="flex justify-between mb-2">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{skill.name}</h3>
                  {skill.category && <p className="text-gray-500">{skill.category}</p>}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDeleteId(skill.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Skill Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl max-w-lg w-full">
            <h3 className="text-xl font-bold mb-4">Add Skills</h3>
            <form onSubmit={handleAddSkills}>
              <div className="mb-4 relative">
                <label className="block text-sm font-medium text-gray-700">Search Skills</label>
                <input
                  type="text"
                  value={skillSearch}
                  onChange={handleSkillSearchChange}
                  className={`w-full mt-1 px-3 py-2 border ${
                    validationErrors.skill ? 'border-red-500' : 'border-gray-300'
                  } rounded-md`}
                  placeholder="Search for skills..."
                  disabled={loading}
                />
                {loading && <p className="text-gray-500 text-sm mt-1">Loading skills...</p>}
                {skillSuggestions.length > 0 && (
                  <ul className="absolute z-50 bg-white border rounded mt-1 max-h-40 overflow-y-auto w-full shadow-lg">
                    {skillSuggestions.map((skill) => (
                      <li
                        key={skill.id}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleSkillSelect(skill)}
                      >
                        {skill.name} {skill.category ? `(${skill.category})` : ''}
                      </li>
                    ))}
                  </ul>
                )}
                {skillSearch.length >= 2 && !loading && skillSuggestions.length === 0 && (
                  <p className="text-gray-500 text-sm mt-1">No skills found</p>
                )}
                
                {/* Selected Skills Display */}
                {selectedSkills.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedSkills.map(skill => (
                      <div 
                        key={skill.id} 
                        className="bg-blue-100 text-blue-800 px-2 py-1 rounded flex items-center"
                      >
                        {skill.name}
                        <button
                          type="button"
                          onClick={() => handleRemoveSelectedSkill(skill.id)}
                          className="ml-2 text-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {validationErrors.skill && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.skill}</p>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setSelectedSkills([]);
                    setSkillSearch('');
                    setSkillSuggestions([]);
                    setValidationErrors({});
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  {loading ? 'Saving...' : selectedSkills.length > 0 ? `Add ${selectedSkills.length} Skills` : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-2">Confirm Deletion</h3>
            <p className="mb-4 text-gray-600">
              Are you sure you want to delete this skill? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSkill}
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

export default Skill;