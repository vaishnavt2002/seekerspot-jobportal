import React, { useState } from 'react';
import { verifyOTP, sendVerificationOTP } from '../api/authApi';

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
        <div className="verify-email-form">
            <h2>Verify Your Email</h2>
            <p>Enter the OTP sent to {email}</p>
            {success && <p style={{ color: 'green' }}>{success}</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <form onSubmit={handleSubmit}>
                <div>
                    <label>OTP</label>
                    <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        maxLength="6"
                        required
                    />
                </div>
                <button type="submit">Verify</button>
            </form>
            <button onClick={handleResend} style={{ marginTop: '10px' }}>Resend OTP</button>
        </div>
    );
};

export default VerifyEmail;