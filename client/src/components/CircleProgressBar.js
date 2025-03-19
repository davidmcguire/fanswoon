import React from 'react';
import './CircleProgressBar.css';

const CircleProgressBar = ({ progress }) => {
  // Calculate the circumference of the circle
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate the stroke-dashoffset based on progress
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  return (
    <div className="progress-container">
      <svg className="progress-ring" width="100" height="100">
        <circle
          className="progress-ring-circle-bg"
          stroke="#e6e6e6"
          strokeWidth="8"
          fill="transparent"
          r={radius}
          cx="50"
          cy="50"
        />
        <circle
          className="progress-ring-circle"
          stroke="#007bff"
          strokeWidth="8"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx="50"
          cy="50"
        />
      </svg>
      <div className="progress-text">
        <span className="progress-percentage">{Math.round(progress)}%</span>
        <span className="progress-label">Uploading</span>
      </div>
    </div>
  );
};

export default CircleProgressBar; 