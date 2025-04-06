// src/components/auth/Signup.jsx
import React, { useState } from 'react';
import { signup } from '../../api/authApi';
import { useNavigate } from 'react-router-dom';
import VerifyEmail from './VerifyEmail';
import Loading from '../Loading';

const Signup = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        user_type: 'job_seeker',
        phone_number: '',
        company_name: '',
        company_website: '',
        description: '',
        company_logo: null,
        industry: '',
        location: '',
    });
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showVerification, setShowVerification] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'company_logo') {
            setFormData({ ...formData, [name]: files ? files[0] : null });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setLoading(true);

        if (!formData.email || !formData.password || !formData.user_type) {
            setError('Please fill all required fields.');
            return;
        }
        if (formData.user_type === 'job_provider' && (!formData.company_name || !formData.industry)) {
            setError('Company Name and Industry are required for Job Providers.');
            return;
        }

        const data = new FormData();
        Object.keys(formData).forEach((key) => {
            if (formData[key] !== '' && formData[key] !== null) {
                data.append(key, formData[key]);
            }
        });

        for (let [key, value] of data.entries()) {
            console.log(`${key}: ${value}`);
        }

        try {
            const response = await signup(data);
            setSuccess(response.message);
            setLoading(false);
            setShowVerification(true);
        } catch (err) {
            setLoading(false)
            setError(err.message || 'Signup failed');
            console.error('Full error:', err);
        }
    };

    const handleVerified = () => {
        setShowVerification(false);
        setSuccess('Email verified! Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
    };

    return (
        <div className='flex justify-center min-h-screen items-center bg-gray-100'>
            {!showVerification ? (
            loading?<Loading/>:<div className="bg-white w-full max-w-md p-6 rounded-lg shadow-md">
                <h2 className='text-center text-2xl font-bold mb-5'>Sign Up</h2>
                {success && !showVerification && <p style={{ color: 'green' }}>{success}</p>}
                {error && <p style={{ color: 'red' }}>{error}</p>}
                
                    <form onSubmit={handleSubmit} className='space-y-4' encType="multipart/form-data">
                        <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>Email</label>
                            <input className='w-full border px-3 py-2 rounded-md focus:ring-2 focus:outline-none focus:ring-blue-500' type="email" name="email" value={formData.email} onChange={handleChange} required />
                        </div>
                        <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>Password</label>
                            <input className='w-full border px-3 py-2 rounded-md focus:ring-2 focus:outline-none focus:ring-blue-500' type="password" name="password" value={formData.password} onChange={handleChange} required />
                        </div>
                        <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>Phone Number</label>
                            <input className='w-full border px-3 py-2 rounded-md focus:ring-2 focus:outline-none focus:ring-blue-500' type="text" name="phone_number" value={formData.phone_number} onChange={handleChange} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">User Type</label>
                            <select
                                name="user_type"
                                value={formData.user_type}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="">Select User Type</option>
                                <option value="job_seeker">Job Seeker</option>
                                <option value="job_provider">Job Provider</option>
                            </select>
                        </div>
                        {formData.user_type === 'job_provider' && (
                            <>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-1'>Company Name</label>
                            <input className='w-full border px-3 py-2 rounded-md focus:ring-2 focus:outline-none focus:ring-blue-500' type="text" name="company_name" value={formData.company_name} onChange={handleChange} required />
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-1'>Company Website</label>
                                    <input className='w-full border px-3 py-2 rounded-md focus:ring-2 focus:outline-none focus:ring-blue-500' type="text" name="company_website" value={formData.company_website} onChange={handleChange} />
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-1'>Location</label>
                                    <input className='w-full border px-3 py-2 rounded-md focus:ring-2 focus:outline-none focus:ring-blue-500' type="text" name="location" value={formData.location} onChange={handleChange} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                                    <select
                                        name="industry"
                                        value={formData.industry}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">Select Industry</option>
                                        <option value="IT">Information Technology</option>
                                        <option value="manufacturing">Manufacturing</option>
                                        <option value="finance">Finance</option>
                                    </select>
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-1'>Description</label>
                                    <textarea className='w-full border px-3 py-2 rounded-md focus:ring-2 focus:outline-none focus:ring-blue-500' name="description" value={formData.description} onChange={handleChange} />
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-1'>Company Logo</label>
                                    <input className='w-full border px-3 py-2 rounded-md' type="file" name="company_logo" onChange={handleChange} />
                                </div>
                            </>
                        )}
                        <button type="submit" className='w-full bg-blue-500 text-white rounded-md py-2 px-4 hover:bg-blue-700 transition delay-150 duration-300 ease-in-out hover:-translate-y-1'>Sign Up</button>
                    </form>
                
                <button className="text-blue-600 hover:underline w-full pt-2" onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer' }}>
                    Already have an account? Login
                </button>
            </div>
            ) : (
                <VerifyEmail email={formData.email} onVerified={handleVerified} />
            )};
        </div>
    );
};

export default Signup;