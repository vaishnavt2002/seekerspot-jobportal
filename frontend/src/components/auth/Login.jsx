import React, { useState } from 'react';
import { login } from '../../api/authApi';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        try {
            const response = await login(formData);
            setSuccess('Login successful!');
            console.log('User data:', response.user);
            // Redirect to a dashboard or home page later
            navigate('/profile');  // Placeholder, adjust later
        } catch (err) {
            setError(err.message || 'Login failed');
        }
    };

    return (
        <div className="login-form">
            <h2>Login</h2>
            {success && <p style={{ color: 'green' }}>{success}</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Email</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div>
                    <label>Password</label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                </div>
                <button type="submit">Login</button>
            </form>
            <p>
                <button onClick={() => navigate('/signup')} style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer' }}>
                    Don’t have an account? Sign up
                </button>
            </p>
        </div>
    );
};

export default Login;