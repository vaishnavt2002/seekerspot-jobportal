// src/components/interview/JoinMeetingButton.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

const JoinMeetingButton = ({ 
  meetingId, 
  interviewType, 
  disabled = false, 
  className = "bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors",
  onClick
}) => {
  const { user } = useSelector(state => state.auth);
  
  if (!meetingId) {
    return null;
  }

  if (disabled) {
    return (
      <button 
        disabled 
        className={`opacity-50 cursor-not-allowed ${className}`}
      >
        Join Meeting
      </button>
    );
  }

  const meetingUrl = `/meet/${meetingId}?type=${interviewType}`;
  
  return (
    <Link
      to={meetingUrl}
      className={className}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => {
        // Call the onClick handler if provided
        if (onClick) {
          onClick(e);
        }
      }}
    >
      Join Meeting
    </Link>
  );
};

export default JoinMeetingButton;