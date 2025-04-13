import React, { useEffect, useState } from 'react';
import profileApi from '../../api/profileApi';

const ProfileSection = () => {
  const [profile, setProfile] = useState(null);
  const [editModal, setEditModal] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    company_logo: null,  // changed to null (file expected)
    industry: '',
    company_website: '',
    description: '',
    location: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await profileApi.getJobProviderProfile();
        setProfile(res);
        setFormData({
          company_name: res.company_name || '',
          company_logo: null,
          industry: res.industry || '',
          company_website: res.company_website || '',
          description: res.description || '',
          location: res.location || '',
        });
      } catch (err) {
        console.error(err.message);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'company_logo') {
      setFormData(prev => ({ ...prev, company_logo: files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async () => {
    try {
      const form = new FormData();
      for (const key in formData) {
        if (formData[key]) {
          form.append(key, formData[key]);
        }
      }

      const res = await profileApi.updateJobProviderProfile(form); // must send FormData
      setProfile(res);
      setEditModal(false);
    } catch (err) {
      console.error(err.message);
    }
  };

  if (!profile) return <p>Loading...</p>;

  return (
    <div className="p-6 md:p-10 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-semibold mb-8">Profile</h2>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-1">Company name</label>
          <input
            type="text"
            value={profile.company_name}
            disabled
            className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Location</label>
          <input
            type="text"
            value={profile.location}
            disabled
            className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Industry</label>
          <input
            type="text"
            value={profile.industry}
            disabled
            className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Company Website</label>
          <input
            type="text"
            value={profile.company_website}
            disabled
            className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white"
          />
        </div>

        <div className="flex flex-col items-start gap-3">
          <label className="block text-sm font-medium">Logo</label>
          <img
            src={`http://localhost:8000/${profile.company_logo}` || "https://via.placeholder.com/100x80.png?text=A+Company"}
            alt="Company Logo"
            className="h-20 w-auto border rounded-md"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Verified</span>
          <img
            src="https://cdn-icons-png.flaticon.com/512/1828/1828640.png"
            alt="Verified"
            className="w-6 h-6"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={profile.description}
            disabled
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white resize-none"
          />
        </div>
      </div>

      <div className="mt-6">
        <button
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
          onClick={() => setEditModal(true)}
        >
          Edit
        </button>
      </div>

      {/* Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-md w-[90%] md:w-[600px]">
            <h3 className="text-xl font-semibold mb-4">Edit Profile</h3>

            <div className="grid gap-4">
              <input name="company_name" value={formData.company_name} onChange={handleChange} placeholder="Company Name" className="border px-3 py-2 rounded-md" />
              <input name="location" value={formData.location} onChange={handleChange} placeholder="Location" className="border px-3 py-2 rounded-md" />
              <input name="industry" value={formData.industry} onChange={handleChange} placeholder="Industry" className="border px-3 py-2 rounded-md" />
              <input name="company_website" value={formData.company_website} onChange={handleChange} placeholder="Website" className="border px-3 py-2 rounded-md" />
              <textarea name="description" value={formData.description} onChange={handleChange} rows={3} placeholder="Description" className="border px-3 py-2 rounded-md" />

              <div>
                <label className="block text-sm mb-1 font-medium">Company Logo</label>
                <input type="file" name="company_logo" accept="image/*" onChange={handleChange} className="border px-3 py-2 rounded-md" />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-3">
              <button onClick={() => setEditModal(false)} className="px-4 py-2 border rounded-md">Cancel</button>
              <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSection
