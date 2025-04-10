import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
    timeout: 10000,
});

// Add request interceptor to include CSRF token if available
axiosInstance.interceptors.request.use(
    (config) => {
        const csrfToken = document.cookie
            .split('; ')
            .find(row => row.startsWith('csrftoken='))
            ?.split('=')[1];
        
        if (csrfToken) {
            config.headers['X-CSRFToken'] = csrfToken;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Add response interceptor to handle token refresh
axiosInstance.interceptors.response.use(
    (response) => response.data,
    async (error) => {
        // If server is unreachable, don't attempt token refresh
        if (!error.response) {
            console.error('Server unreachable:', error.message);
            return Promise.reject({ 
                message: 'Server is unreachable. Please check your connection.',
                status: 'network_error'
            });
        }
                
               
        
        const originalRequest = error.config;
        
        // If the error is 401 and we haven't tried to refresh token yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
                // Try to refresh the token
                await axios.post(
                    `${import.meta.env.VITE_API_URL}/auth/token/refresh/`,
                    {},
                    { withCredentials: true }
                );
                
                // Retry the original request with the new token
                return axios(originalRequest)
                    .then(response => response.data);
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);
                // Let the error fall through to the next handler
            }
        }
        
        const errorMessage = error.response?.data?.message || 
                           error.response?.data?.error || 
                           error.message || 
                           'An error occurred';
        
        if (error.response?.status === 401) {
            console.error('Unauthorized, please log in.');
        } else if (error.response?.status === 500) {
            console.error('Server error, please try again later.');
        }
        
        return Promise.reject({ 
            message: errorMessage, 
            status: error.response?.status 
        });
    }
);

export default axiosInstance;