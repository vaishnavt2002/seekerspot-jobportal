import React, { useState } from 'react';
import { verifyOTP, sendVerificationOTP } from '../../api/authApi';

const VerifyEmail = ({ email, onVerified }) => {
    const [otp, setOtp] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        try {
            const response = await verifyOTP({ email, otp });
            setSuccess(response.message);
            onVerified();
        } catch (err) {
            setError(err.message || 'Verification failed');
        }
    };

    const handleResend = async () => {
        setError(null);
        setSuccess(null);
        try {
            const response = await sendVerificationOTP(email);
            setSuccess(response.message);
        } catch (err) {
            setError(err.message || 'Failed to resend OTP');
        }
    };

    return (
        <div className="bg-white w-full max-w-md p-6 rounded-lg shadow-md">
            <h2 className='text-center text-2xl font-bold mb-5'>Verify Your Email</h2>
            <p>Enter the OTP sent to {email}</p>
            {success && <p style={{ color: 'green' }}>{success}</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <form onSubmit={handleSubmit} className='space-y-4'>
                <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>OTP</label>
                    <input
                        type="text"
                        className='w-full border px-3 py-2 rounded-md focus:ring-2 focus:outline-none focus:ring-blue-500'
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        maxLength="6"
                        required
                    />
                </div>
                <button  className='w-full bg-blue-500 text-white rounded-md py-2 px-4 hover:bg-blue-700 transition delay-150 duration-300 ease-in-out hover:-translate-y-1' type="submit">Verify</button>
            </form>
            <button className="text-blue-600 hover:underline w-full pt-2" onClick={handleResend} >Resend OTP</button>
        </div>
        
    );
};

export default VerifyEmail;