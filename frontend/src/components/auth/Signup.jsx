import React, { useState } from 'react';
import { signup } from '../../api/authApi';
import { useNavigate } from 'react-router-dom';
import VerifyEmail from './VerifyEmail';

const Signup = () => {
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        password: '',
        user_type: 'job_seeker',
        phone_number: '',
    });
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [showVerification, setShowVerification] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        try {
            const response = await signup(formData);
            setSuccess(response.message);
            setShowVerification(true);
        } catch (err) {
            setError(err.message || 'Signup failed');
        }
    };

    const handleVerified = () => {
        setShowVerification(false);
        setSuccess('Email verified! Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);  // 2-second delay for user feedback
    };

    return (
        <div className="signup-form">
            <h2>Sign Up</h2>
            {success && !showVerification && <p style={{ color: 'green' }}>{success}</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {!showVerification ? (
                <form onSubmit={handleSubmit}>
                    {/* Existing form fields... */}
                    <div>
                        <label>Email</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                    </div>
                    <div>
                        <label>Username</label>
                        <input type="text" name="username" value={formData.username} onChange={handleChange} required />
                    </div>
                    <div>
                        <label>Password</label>
                        <input type="password" name="password" value={formData.password} onChange={handleChange} required />
                    </div>
                    <div>
                        <label>User Type</label>
                        <select name="user_type" value={formData.user_type} onChange={handleChange}>
                            <option value="job_seeker">Job Seeker</option>
                            <option value="job_provider">Job Provider</option>
                        </select>
                    </div>
                    <div>
                        <label>Phone Number</label>
                        <input type="text" name="phone_number" value={formData.phone_number} onChange={handleChange} />
                    </div>
                    <button type="submit">Sign Up</button>
                </form>
            ) : (
                <VerifyEmail email={formData.email} onVerified={handleVerified} />
            )}
        </div>
    );
};

export default Signup;