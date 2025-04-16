import React, { useState } from 'react';
import { forgotPassword, resetPassword } from '../../api/authApi';
import { useNavigate } from 'react-router-dom';

const ResetPassword = () => {
  const [step, setStep] = useState(1); 
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    new_password: '',
    confirm_password: '',
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      // Changed from sendVerificationOTP to forgotPassword
      await forgotPassword(formData.email);
      setSuccessMsg('OTP sent to your email.');
      setStep(2);
    } catch (err) {
      setErrorMsg(err?.message || err?.fieldErrors?.email || 'Failed to send OTP.');
    }
    setLoading(false);
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    const { email, otp, new_password, confirm_password } = formData;

    if (new_password !== confirm_password) {
      setErrorMsg("Passwords don't match.");
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      await resetPassword({ email, otp, new_password });
      setSuccessMsg('Password reset successfully. Redirecting to login...');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setErrorMsg(err?.message || err?.fieldErrors?.otp || err?.fieldErrors?.email || 'Failed to reset password.');
    }
    setLoading(false);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-md shadow-md w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-center">Reset Password</h2>

        {errorMsg && <p className="text-red-500 text-center mb-2">{errorMsg}</p>}
        {successMsg && <p className="text-green-500 text-center mb-2">{successMsg}</p>}

        {step === 1 ? (
          <form onSubmit={handleEmailSubmit}>
            <label className="block mb-2 text-sm font-medium">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full border rounded px-3 py-2 mb-4"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 text-white rounded py-2 hover:bg-blue-600"
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">OTP</label>
              <input
                type="text"
                name="otp"
                value={formData.otp}
                onChange={handleChange}
                required
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">New Password</label>
              <input
                type="password"
                name="new_password"
                value={formData.new_password}
                onChange={handleChange}
                required
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Confirm Password</label>
              <input
                type="password"
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                required
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white rounded py-2 hover:bg-green-700"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;