import axiosInstance from "./axiosInstance"

export const signup = async (userData)=>{
    const response = await axiosInstance.post('/signup/',userData);
    return response

}
export const login = async (credentials) => {
    const response = await axiosInstance.post('/login/', credentials);
    return response;
};

export const logout = async () => {
    const response = await axiosInstance.post('/logout/');
    return response;
};

export const getProfile = async () => {
    const response = await axiosInstance.get('/profile/');
    return response;
};

export const updateProfile = async (profileData) => {
    const response = await axiosInstance.put('/profile/', profileData);
    return response;
};

export const forgotPassword = async (email) => {
    const response = await axiosInstance.post('/forgot-password/', { email });
    return response;
};

export const resetPassword = async (resetData) => {
    const response = await axiosInstance.post('/reset-password/', resetData);
    return response;
};