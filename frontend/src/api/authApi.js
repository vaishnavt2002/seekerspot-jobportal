import axiosInstance from './axiosInstance';

export const signup = async (userData) => {
    const config = { headers: { 'Content-Type': 'multipart/form-data' } };  // Ensure correct header
    console.log('Request headers:', config.headers);  // Debug
    return axiosInstance.post('/signup/', userData, config);
};

export const sendVerificationOTP = async (email) => {
    return axiosInstance.post('/send-verification-otp/', { email });
};

export const verifyOTP = async (verificationData) => {
    return axiosInstance.post('/verify-otp/', verificationData);
};

export const login = async (credentials) => {
    return axiosInstance.post('/login/', credentials);
};

export const logout = async () => {
    return axiosInstance.post('/logout/');
};

export const getProfile = async () => {
    return axiosInstance.get('/profile/');
};

export const updateProfile = async (profileData) => {
    return axiosInstance.put('/profile/', profileData);
};

export const forgotPassword = async (email) => {
    return axiosInstance.post('/forgot-password/', { email });
};

export const resetPassword = async (resetData) => {
    return axiosInstance.post('/reset-password/', resetData);
};