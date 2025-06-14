import axiosInstance from './axiosInstance';

export const signup = async (userData) => {
    const config = { headers: { 'Content-Type': 'multipart/form-data' } };
    return axiosInstance.post('/auth/signup/', userData, config);
};

export const sendVerificationOTP = async (email) => {
    return axiosInstance.post('/auth/send-verification-otp/', { email });
};

export const verifyOTP = async (verificationData) => {
    return axiosInstance.post('/auth/verify-otp/', verificationData);
};

export const login = async (credentials) => {
    return axiosInstance.post('/auth/login/', credentials);
};

export const logout = async () => {
    return axiosInstance.post('/auth/logout/');
};

export const getProfile = async () => {
    return axiosInstance.get('/auth/profile/');
};
export const getUser = async () =>{
    return axiosInstance.get('/auth/user/');
}

export const updateProfile = async (profileData) => {
    return axiosInstance.put('/auth/profile/', profileData);
};

export const forgotPassword = async (email) => {
    return axiosInstance.post('/auth/forgot-password/', { email });
};

export const resetPassword = async (resetData) => {
    return axiosInstance.post('/auth/reset-password/', resetData);
};
export const refreshToken = async () => {
    return axiosInstance.post('/auth/token/refresh/');
};
export const googleAuth = async (token) => {
  return axiosInstance.post('/auth/google/', { token, user_type: 'job_seeker' });
};