import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginStart, loginSuccess, loginFailure } from '../../store/slices/authSlice';
import { login } from '../../api/authApi';
import { useNavigate } from 'react-router-dom';
import Loading from '../Loading';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const dispatch = useDispatch();
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
      dispatch(loginFailure(err.message || 'Login failed'));
    }
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
              Don’t have an account? Sign up
            </button>
          </p>
        </div>
      )}
    </div>
  );
};

export default Login;