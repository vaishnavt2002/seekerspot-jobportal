// src/api/interviewApi.js
import axiosInstance from './axiosInstance';

const interviewApi = {
  // Get meeting details by meeting ID
  getMeetingDetails: (meetingId) => {
    return axiosInstance.get(`/interview/meetings/${meetingId}/`);
  },

  // Get all interviews for job seeker
  getJobSeekerInterviews: () => {
    return axiosInstance.get('/interview/job-seeker/interviews/');
  },

  // Create interview schedule
  createInterviewSchedule: (data) => {
    return axiosInstance.post('/interview/interviews/', data);
  },

  // Update interview schedule
  updateInterviewSchedule: (interviewId, data) => {
    return axiosInstance.patch(`/interview/interviews/${interviewId}/`, data);
  },

  // Cancel interview
  cancelInterviewSchedule: (interviewId) => {
    return axiosInstance.post(`/interview/interviews/${interviewId}/cancel/`);
  },

  // Complete interview
  completeInterviewSchedule: (interviewId) => {
    return axiosInstance.post(`/interview/interviews/${interviewId}/complete/`);
  },
};

export default interviewApi;