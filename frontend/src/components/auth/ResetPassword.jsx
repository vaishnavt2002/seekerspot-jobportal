import React, { useState, useEffect } from 'react';
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
  const [passwordChecks, setPasswordChecks] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  const validatePassword = (password) => {
    return {
      length: password.length >= 6,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
    };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrorMsg('');
    setSuccessMsg('');

    if (name === 'new_password') {
      setPasswordChecks(validatePassword(value));
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
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

    // Check if all password conditions are met
    const { length, uppercase, lowercase, number } = passwordChecks;
    if (!length || !uppercase || !lowercase || !number) {
      setErrorMsg('Password does not meet all requirements.');
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
              className="w-full bg-blue-600 text-white rounded py-2 hover:bg-blue-700"
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