import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginStart, loginSuccess, loginFailure } from '../../store/slices/authSlice';
import { login } from '../../api/authApi';
import { useNavigate } from 'react-router-dom';
import Loading from '../Loading';
import { GoogleLogin } from '@react-oauth/google';
import axiosInstance from '../../api/axiosInstance';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showGoogleButton, setShowGoogleButton] = useState(true);
  const dispatch = useDispatch();
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    
    // Hide Google button if user starts typing in job provider credentials
    if (e.target.name === 'email' && e.target.value.includes('@company')) {
      setShowGoogleButton(false);
    } else {
      setShowGoogleButton(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(loginStart());
    try {
      const response = await login(formData);
      dispatch(loginSuccess({ user: response.user }));
      console.log('Login successful:')
      console.log('User data:', response.user);
      const userType = response.user.user_type;
      if (userType === 'job_seeker') navigate('/');
      else if (userType === 'job_provider') navigate('/jobprovider/dashboard');
      else if (userType === 'admin') navigate('/admin/dashboard');
      else navigate('/');
    } catch (err) {
      console.log(err)
      dispatch(loginFailure(err?.fieldErrors?.error || 'Login failed'));
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    dispatch(loginStart());
    try {
      // Send the token to your backend
      const response = await axiosInstance.post('/auth/google/', {
        token: credentialResponse.credential,
        user_type: 'job_seeker' // Explicitly set user_type to job_seeker
      });
      
      dispatch(loginSuccess({ user: response.user }));
      navigate('/');
    } catch (err) {
      console.error('Google login error:', err);
      dispatch(loginFailure(err?.fieldErrors?.error || 'Google login failed'));
    }
  };

  const handleGoogleError = () => {
    dispatch(loginFailure('Google sign in was unsuccessful'));
  };

  return (
    <div className="flex justify-center min-h-screen items-center bg-gray-100">
      {loading ? (
        <Loading />
      ) : (
        <div className="bg-white w-full max-w-md p-6 rounded-lg shadow-md">
          <h2 className="text-center text-2xl font-bold mb-5">Login</h2>
          {isAuthenticated && <p className="text-green-600 text-sm mb-2 text-center">Login successful!</p>}
          {error && <p className="text-red-600 text-sm mb-2 text-center">{error}</p>}
          
          {/* Google Sign-In Button for Job Seekers */}
          {showGoogleButton && (
            <div className="mb-4">
              <p className="text-center text-sm text-gray-600 mb-2">Job Seekers can sign in with Google</p>
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  useOneTap
                  theme="outline"
                  text="signin_with"
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
          
          {/* Regular Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                className="w-full border px-3 py-2 rounded-md focus:ring-2 focus:outline-none focus:ring-blue-500"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                className="w-full border px-3 py-2 rounded-md focus:ring-2 focus:outline-none focus:ring-blue-500"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white rounded-md py-2 px-4 hover:bg-blue-700 transition delay-150 duration-300 ease-in-out hover:-translate-y-1"
              disabled={loading}
            >
              Login
            </button>
          </form>
          
          <p>
            <button
              className="text-blue-600 hover:underline w-full pt-2"
              onClick={() => navigate('/signup')}
              style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer' }}
            >
              Don't have an account? Sign up
            </button>
            <button
              className="text-blue-600 hover:underline w-full pt-2"
              onClick={() => navigate('/reset-password')}
              style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer' }}
            >
              Forgot password?
            </button>
            <button
              className="text-blue-600 hover:underline w-full pt-2"
              onClick={() => navigate('/')}
              style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer' }}
            >
              Go home
            </button>
          </p>
        </div>
      )}
    </div>
  );
};

export default Login;