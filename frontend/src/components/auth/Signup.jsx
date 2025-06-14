import React, { useState, useEffect } from 'react';
import { signup } from '../../api/authApi';
import { useNavigate } from 'react-router-dom';
import VerifyEmail from './VerifyEmail';
import Loading from '../Loading';
import { GoogleLogin } from '@react-oauth/google';
import axiosInstance from '../../api/axiosInstance';

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
    const [errors, setErrors] = useState({});
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showVerification, setShowVerification] = useState(false);
    const [passwordChecks, setPasswordChecks] = useState({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false
    });
    const navigate = useNavigate();

    // Validate password on change
    useEffect(() => {
        if (formData.password) {
            const checks = {
                length: formData.password.length >= 6,
                uppercase: /[A-Z]/.test(formData.password),
                lowercase: /[a-z]/.test(formData.password),
                number: /[0-9]/.test(formData.password)
            };
            setPasswordChecks(checks);
        }
    }, [formData.password]);

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'company_logo') {
            setFormData({ ...formData, [name]: files ? files[0] : null });
        } else {
            setFormData({ ...formData, [name]: value });
        }
        
        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: null
            });
        }

        if (name === 'email' && error) {
            setError(null);
        }
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.email) newErrors.email = 'Email is required';
        if (!formData.password) newErrors.password = 'Password is required';
        if (!formData.user_type) newErrors.user_type = 'User type is required';
        if (!formData.phone_number) newErrors.phone_number = 'Phone number is required';
        
        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }
        
        if (formData.password) {
            if (!passwordChecks.length || !passwordChecks.uppercase || 
                !passwordChecks.lowercase || !passwordChecks.number) {
                newErrors.password = 'Password does not meet requirements';
            }
        }
        
        if (formData.phone_number) {
            if (!/^[4-9]\d{9}$/.test(formData.phone_number)) {
                newErrors.phone_number = 'Phone number must be 10 digits and start with a digit between 4-9';
            }
        }
        
        if (formData.user_type === 'job_provider') {
            if (!formData.company_name) {
                newErrors.company_name = 'Company name is required';
            } else if (formData.company_name.length <= 4) {
                newErrors.company_name = 'Company name must be longer than 4 characters';
            }
            
            if (!formData.industry) {
                newErrors.industry = 'Industry is required';
            }
            
            if (!formData.company_website) {
                newErrors.company_website = 'Company website is required';
            } else {
                try {
                    new URL(formData.company_website);
                } catch (e) {
                    newErrors.company_website = 'Please enter a valid URL (e.g., https://example.com)';
                }
            }
            
            if (!formData.location) {
                newErrors.location = 'Location is required';
            } else if (formData.location.length <= 3) {
                newErrors.location = 'Location must be longer than 3 characters';
            }
            
            if (!formData.description) {
                newErrors.description = 'Description is required';
            } else if (formData.description.length <= 5) {
                newErrors.description = 'Description must be longer than 5 characters';
            }
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        
        if (!validateForm()) {
            setError('Please correct the errors in the form.');
            return;
        }
        
        setLoading(true);

        const data = new FormData();
        Object.keys(formData).forEach((key) => {
            if (formData[key] !== '' && formData[key] !== null) {
                data.append(key, formData[key]);
            }
        });

        try {
            const response = await signup(data);
            setSuccess(response.message);
            setLoading(false);
            setShowVerification(true);
        } catch (err) {
            setLoading(false);

            if (err.status === 400) {
                setError(err.fieldErrors.error)
            } else {
                setError(err.message || 'Signup failed. Please try again.');
            }
            
            console.error('Full error:', err);
        }
    };

    const handleVerified = () => {
        setShowVerification(false);
        setSuccess('Email verified! Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
    };

    // Google Authentication handlers
    const handleGoogleSuccess = async (credentialResponse) => {
        setLoading(true);
        setError(null);
        setSuccess(null);
        
        try {
            const response = await axiosInstance.post('/auth/google/', {
                token: credentialResponse.credential,
                user_type: 'job_seeker'
            });
            
            setSuccess('Google signup successful! Redirecting to home page...');
            setTimeout(() => {
                navigate('/');
            }, 2000);
        } catch (err) {
            console.error('Google signup error:', err);
            setError(err.message || 'Google signup failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleError = () => {
        setError('Google sign up was unsuccessful. Please try again.');
    };

    return (
        <div className='flex justify-center min-h-screen items-center bg-gray-100'>
            {!showVerification ? (
            loading ? <Loading /> : <div className="bg-white w-full max-w-md p-6 rounded-lg shadow-md">
                <h2 className='text-center text-2xl font-bold mb-5'>Sign Up</h2>
                {success && !showVerification && <p className="text-green-500 text-center mb-4">{success}</p>}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4" role="alert">
                        <p>{error}</p>
                    </div>
                )}
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">User Type <span className="text-red-500">*</span></label>
                    <select
                        name="user_type"
                        value={formData.user_type}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.user_type ? 'border-red-500' : 'border-gray-300'}`}
                        required
                    >
                        <option value="">Select User Type</option>
                        <option value="job_seeker">Job Seeker</option>
                        <option value="job_provider">Job Provider</option>
                    </select>
                    {errors.user_type && <p className="text-red-500 text-xs mt-1">{errors.user_type}</p>}
                </div>
                
                {/* Google Sign-up Button for Job Seekers Only */}
                {formData.user_type === 'job_seeker' && (
                    <div className="mt-4 mb-4">
                        <p className="text-center text-sm text-gray-600 mb-2">Job Seekers can sign up with Google</p>
                        <div className="flex justify-center">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={handleGoogleError}
                                useOneTap
                                theme="outline"
                                text="signup_with"
                                shape="rectangular"
                                logo_alignment="center"
                            />
                        </div>
                        <div className="flex items-center my-4">
                            <hr className="flex-1 border-t border-gray-300" />
                            <span className="px-3 text-gray-500 text-sm">OR</span>
                            <hr className="flex-1 border-t border-gray-300" />
                        </div>
                    </div>
                )}
                
                <form onSubmit={handleSubmit} className='space-y-4' encType="multipart/form-data">
                    <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>Email <span className="text-red-500">*</span></label>
                        <input 
                            className={`w-full border px-3 py-2 rounded-md focus:ring-2 focus:outline-none focus:ring-blue-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`} 
                            type="email" 
                            name="email" 
                            value={formData.email} 
                            onChange={handleChange} 
                            required 
                        />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </div>
                    <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>Password <span className="text-red-500">*</span></label>
                        <input 
                            className={`w-full border px-3 py-2 rounded-md focus:ring-2 focus:outline-none focus:ring-blue-500 ${errors.password ? 'border-red-500' : 'border-gray-300'}`} 
                            type="password" 
                            name="password" 
                            value={formData.password} 
                            onChange={handleChange} 
                            required 
                        />
                        
                        {/* Password requirements checklist */}
                        <div className="mt-2 text-xs">
                            <p className="font-medium text-gray-700 mb-1">Password must have:</p>
                            <ul className="space-y-1 pl-1">
                                <li className={`flex items-center ${passwordChecks.length ? 'text-green-500' : 'text-red-500'}`}>
                                    {passwordChecks.length ? '✓' : '✗'} At least 6 characters
                                </li>
                                <li className={`flex items-center ${passwordChecks.uppercase ? 'text-green-500' : 'text-red-500'}`}>
                                    {passwordChecks.uppercase ? '✓' : '✗'} At least 1 uppercase letter
                                </li>
                                <li className={`flex items-center ${passwordChecks.lowercase ? 'text-green-500' : 'text-red-500'}`}>
                                    {passwordChecks.lowercase ? '✓' : '✗'} At least 1 lowercase letter
                                </li>
                                <li className={`flex items-center ${passwordChecks.number ? 'text-green-500' : 'text-red-500'}`}>
                                    {passwordChecks.number ? '✓' : '✗'} At least 1 number
                                </li>
                            </ul>
                        </div>
                        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                    </div>
                    <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>Phone Number <span className="text-red-500">*</span></label>
                        <input 
                            className={`w-full border px-3 py-2 rounded-md focus:ring-2 focus:outline-none focus:ring-blue-500 ${errors.phone_number ? 'border-red-500' : 'border-gray-300'}`} 
                            type="text" 
                            name="phone_number" 
                            value={formData.phone_number} 
                            onChange={handleChange} 
                            required 
                            placeholder="Must be 10 digits starting with 4-9"
                        />
                        {errors.phone_number && <p className="text-red-500 text-xs mt-1">{errors.phone_number}</p>}
                    </div>
                    {formData.user_type === 'job_provider' && (
                        <>
                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>Company Name <span className="text-red-500">*</span></label>
                                <input 
                                    className={`w-full border px-3 py-2 rounded-md focus:ring-2 focus:outline-none focus:ring-blue-500 ${errors.company_name ? 'border-red-500' : 'border-gray-300'}`} 
                                    type="text" 
                                    name="company_name" 
                                    value={formData.company_name} 
                                    onChange={handleChange} 
                                    required 
                                    placeholder="Must be longer than 4 characters"
                                />
                                {errors.company_name && <p className="text-red-500 text-xs mt-1">{errors.company_name}</p>}
                            </div>
                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>Company Website <span className="text-red-500">*</span></label>
                                <input 
                                    className={`w-full border px-3 py-2 rounded-md focus:ring-2 focus:outline-none focus:ring-blue-500 ${errors.company_website ? 'border-red-500' : 'border-gray-300'}`} 
                                    type="url" 
                                    name="company_website" 
                                    value={formData.company_website} 
                                    onChange={handleChange} 
                                    required 
                                    placeholder="https://example.com"
                                />
                                {errors.company_website && <p className="text-red-500 text-xs mt-1">{errors.company_website}</p>}
                                {!errors.company_website && <p className="text-gray-500 text-xs mt-1">Must be a valid URL (e.g., https://example.com)</p>}
                            </div>
                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>Location <span className="text-red-500">*</span></label>
                                <input 
                                    className={`w-full border px-3 py-2 rounded-md focus:ring-2 focus:outline-none focus:ring-blue-500 ${errors.location ? 'border-red-500' : 'border-gray-300'}`} 
                                    type="text" 
                                    name="location" 
                                    value={formData.location} 
                                    onChange={handleChange} 
                                    required 
                                    placeholder="Must be longer than 3 characters"
                                />
                                {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Industry <span className="text-red-500">*</span></label>
                                <select
                                    name="industry"
                                    value={formData.industry}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.industry ? 'border-red-500' : 'border-gray-300'}`}
                                    required
                                >
                                    <option value="">Select Industry</option>
                                    <option value="IT">Information Technology</option>
                                    <option value="manufacturing">Manufacturing</option>
                                    <option value="finance">Finance</option>
                                </select>
                                {errors.industry && <p className="text-red-500 text-xs mt-1">{errors.industry}</p>}
                            </div>
                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>Description <span className="text-red-500">*</span></label>
                                <textarea 
                                    className={`w-full border px-3 py-2 rounded-md focus:ring-2 focus:outline-none focus:ring-blue-500 ${errors.description ? 'border-red-500' : 'border-gray-300'}`} 
                                    name="description" 
                                    value={formData.description} 
                                    onChange={handleChange} 
                                    required 
                                    placeholder="Must be longer than 5 characters"
                                    rows="3"
                                />
                                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                            </div>
                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>Company Logo</label>
                                <input 
                                    className='w-full border px-3 py-2 rounded-md' 
                                    type="file" 
                                    name="company_logo" 
                                    onChange={handleChange} 
                                />
                            </div>
                        </>
                    )}
                    <button 
                        type="submit" 
                        className='w-full bg-blue-500 text-white rounded-md py-2 px-4 hover:bg-blue-700 transition delay-150 duration-300 ease-in-out hover:-translate-y-1'
                    >
                        Sign Up
                    </button>
                </form>
                
                <div className="mt-4 text-center">
                    <button 
                        className="text-blue-600 hover:underline" 
                        onClick={() => navigate('/login')} 
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                        Already have an account? Login
                    </button>
                    <button
                        className="text-blue-600 hover:underline w-full pt-2"
                        onClick={() => navigate('/')}
                        style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer' }}
                    >
                        Go home
                    </button>
                </div>
            </div>
            ) : (
                <VerifyEmail email={formData.email} onVerified={handleVerified} />
            )}
        </div>
    );
};

export default Signup;