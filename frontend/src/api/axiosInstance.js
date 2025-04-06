import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
    timeout: 10000,
});

axiosInstance.interceptors.response.use(
    (response) => response.data,
    (error) => {
        const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'An error occurred';
        if (error.response?.status === 401) {
            console.error('Unauthorized, please log in.');
        } else if (error.response?.status === 500) {
            console.error('Server error, please try again later.');
        }
        return Promise.reject({ message: errorMessage, status: error.response?.status });
    }
);

export default axiosInstance;