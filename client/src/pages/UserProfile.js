import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './Profile.css'; // Reuse the Profile CSS

const UserProfile = () => {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        // Fetch user data
        const userResponse = await fetch(`http://localhost:5001/api/users/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!userResponse.ok) {
          throw new Error('Failed to fetch user profile');
        }
        
        const userData = await userResponse.json();
        setUser(userData);
        
        // Fetch user's public recordings
        const recordingsResponse = await fetch(`http://localhost:5001/api/recordings/user/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!recordingsResponse.ok) {
          throw new Error('Failed to fetch user recordings');
        }
        
        const recordingsData = await recordingsResponse.json();
        setRecordings(recordingsData);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Failed to load user profile. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [userId]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return <div className="profile-container loading">Loading user profile...</div>;
  }

  if (error) {
    return <div className="profile-container error">{error}</div>;
  }

  if (!user) {
    return <div className="profile-container error">User not found</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>{user.name}'s Profile</h1>
      </div>
      
      <div className="profile-content">
        <div className="profile-image-section">
          <div className="profile-image">
            {user.picture ? (
              <img src={user.picture} alt={`${user.name}'s profile`} />
            ) : (
              <div className="profile-image-placeholder">
                {user.name.charAt(0)}
              </div>
            )}
          </div>
        </div>
        
        <div className="profile-details">
          <h2>About</h2>
          <div className="bio">
            {user.bio || 'No bio available'}
          </div>
          
          <h2>Recordings</h2>
          {recordings.length === 0 ? (
            <p>No public recordings available</p>
          ) : (
            <div className="recordings-list">
              {recordings.map(recording => (
                <div key={recording._id} className="recording-item">
                  <h3>{recording.title}</h3>
                  <p className="recording-date">Uploaded on {formatDate(recording.createdAt)}</p>
                  <audio controls src={recording.url} className="audio-player"></audio>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile; 