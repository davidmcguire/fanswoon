import React from 'react';
import './PodcasterCard.css';

const PodcasterCard = ({ podcaster, onRequestClick }) => {
  return (
    <div className="podcaster-card">
      <img 
        src={podcaster.profileImage} 
        alt={podcaster.name} 
        className="podcaster-image"
      />
      <h3>{podcaster.name}</h3>
      <p>{podcaster.bio}</p>
      <div className="price-section">
        <span>${podcaster.pricePerMessage}</span>
        <button 
          onClick={() => onRequestClick(podcaster)}
          disabled={!podcaster.availableForRequests}
        >
          Request Message
        </button>
      </div>
    </div>
  );
};

export default PodcasterCard; 