import axiosInstance from './axiosInstance';

export const getHomeStats = async () => {
    return axiosInstance.get('/home/stats/');
};

export const getPopularJobs = async () => {
    return axiosInstance.get('/home/popular-jobs/');
};

export const getFeaturedJobs = async () => {
    return axiosInstance.get('/home/featured-jobs/');
};