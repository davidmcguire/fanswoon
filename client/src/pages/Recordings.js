import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Recordings.css';

const Recordings = () => {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [playingId, setPlayingId] = useState(null);
  const [rssFeedUrl, setRssFeedUrl] = useState('');
  const [audioProgress, setAudioProgress] = useState({});
  const [audioDurations, setAudioDurations] = useState({});
  const audioRefs = useRef({});
  const progressIntervals = useRef({});
  const navigate = useNavigate();
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const [updatingArtwork, setUpdatingArtwork] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchRecordings();
    const userId = localStorage.getItem('userId');
    if (userId) {
      setRssFeedUrl(`${window.location.origin}/api/recordings/rss/${userId}`);
    }
  }, [navigate]);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      Object.values(progressIntervals.current).forEach(interval => {
        clearInterval(interval);
      });
    };
  }, []);

  const fetchRecordings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/recordings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch recordings');
      }
      const data = await response.json();
      setRecordings(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/recordings/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to delete recording');
      }
      fetchRecordings();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateDescription = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/recordings/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ description })
      });
      if (!response.ok) {
        throw new Error('Failed to update description');
      }
      fetchRecordings();
      setEditingId(null);
      setDescription('');
    } catch (err) {
      setError(err.message);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds) || !isFinite(seconds)) {
      return '0:00';
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = (recordingId) => {
    const audioElement = audioRefs.current[recordingId];
    
    if (playingId === recordingId) {
      audioElement.pause();
      setPlayingId(null);
      clearInterval(progressIntervals.current[recordingId]);
    } else {
      // Stop any currently playing audio
      if (playingId) {
        audioRefs.current[playingId].pause();
        clearInterval(progressIntervals.current[playingId]);
      }
      audioElement.play();
      setPlayingId(recordingId);
      
      // Start progress tracking
      progressIntervals.current[recordingId] = setInterval(() => {
        setAudioProgress(prev => ({
          ...prev,
          [recordingId]: audioElement.currentTime
        }));
      }, 100);
    }
  };

  const handleAudioEnded = (recordingId) => {
    if (playingId === recordingId) {
      setPlayingId(null);
      clearInterval(progressIntervals.current[recordingId]);
      setAudioProgress(prev => ({
        ...prev,
        [recordingId]: 0
      }));
    }
  };

  const handleProgressClick = (e, recordingId) => {
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const audioElement = audioRefs.current[recordingId];
    
    if (audioElement) {
      const newTime = percentage * audioDurations[recordingId];
      audioElement.currentTime = newTime;
      setAudioProgress(prev => ({
        ...prev,
        [recordingId]: newTime
      }));
    }
  };

  const handleLoadedMetadata = (recordingId) => {
    const audioElement = audioRefs.current[recordingId];
    if (audioElement) {
      const loadDuration = () => {
        const duration = audioElement.duration;
        if (isFinite(duration) && !isNaN(duration) && (!audioDurations[recordingId] || audioDurations[recordingId] !== duration)) {
          setAudioDurations(prev => ({
            ...prev,
            [recordingId]: duration
          }));
        }
      };

      loadDuration(); // Try to load duration immediately
      audioElement.addEventListener('canplay', loadDuration); // Also try when audio is ready to play
      return () => {
        audioElement.removeEventListener('canplay', loadDuration);
      };
    }
  };

  const handleDownload = async (recording) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001${recording.url}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to download recording');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${recording.title || 'recording'}.mp3`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleArtworkChange = async (recordingId, e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('artwork', file);

      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/recordings/${recordingId}/artwork`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to update artwork');
      }

      // Refresh recordings to show updated artwork
      fetchRecordings();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="recordings-container loading">Loading...</div>;
  }

  if (error) {
    return <div className="recordings-container error">{error}</div>;
  }

  return (
    <div className="recordings-container">
      <h1>My Recordings</h1>
      {rssFeedUrl && (
        <div className="rss-section">
          <p>Subscribe to your recordings:</p>
          <div className="rss-url-container">
            <input
              type="text"
              value={rssFeedUrl}
              readOnly
              className="rss-url"
            />
            <button
              className="copy-button"
              onClick={() => {
                navigator.clipboard.writeText(rssFeedUrl);
                alert('RSS feed URL copied to clipboard!');
              }}
            >
              Copy RSS URL
            </button>
          </div>
        </div>
      )}
      {recordings.length === 0 ? (
        <p className="no-recordings">No recordings found. Start recording to see them here!</p>
      ) : (
        <div className="recordings-list">
          {recordings.map((recording) => (
            <div key={recording._id} className="recording-item">
              <div className="recording-info">
                <div className="recording-header">
                  {recording.artworkUrl ? (
                    <div className="recording-artwork">
                      <img src={`http://localhost:5001${recording.artworkUrl}`} alt="Recording artwork" />
                      <button 
                        className="change-artwork-button"
                        onClick={() => document.getElementById(`artwork-input-${recording._id}`).click()}
                      >
                        Change Artwork
                      </button>
                      <input
                        id={`artwork-input-${recording._id}`}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleArtworkChange(recording._id, e)}
                        style={{ display: 'none' }}
                      />
                    </div>
                  ) : (
                    <div className="recording-artwork-placeholder">
                      <button 
                        className="add-artwork-button"
                        onClick={() => document.getElementById(`artwork-input-${recording._id}`).click()}
                      >
                        Add Artwork
                      </button>
                      <input
                        id={`artwork-input-${recording._id}`}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleArtworkChange(recording._id, e)}
                        style={{ display: 'none' }}
                      />
                    </div>
                  )}
                  <div className="recording-title-section">
                    <h3>{recording.title || 'Untitled Recording'}</h3>
                    <p className="recording-date">{formatDate(recording.createdAt)}</p>
                  </div>
                </div>
                <div className="recording-description">
                  {editingId === recording._id ? (
                    <div className="description-edit">
                      <textarea
                        value={description || recording.description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Add a description..."
                      />
                      <div className="description-actions">
                        <button onClick={() => handleUpdateDescription(recording._id)}>Save</button>
                        <button onClick={() => {
                          setEditingId(null);
                          setDescription('');
                        }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="description-display">
                      <p>{recording.description || 'No description'}</p>
                      <button onClick={() => {
                        setEditingId(recording._id);
                        setDescription(recording.description || '');
                      }}>Edit Description</button>
                    </div>
                  )}
                </div>
              </div>
              <div className="recording-controls">
                <button 
                  className={`play-pause-button ${playingId === recording._id ? 'playing' : ''}`}
                  onClick={() => handlePlayPause(recording._id)}
                >
                  {playingId === recording._id ? 'Pause' : 'Play'}
                </button>
                
                <div className="audio-progress">
                  <div 
                    className="progress-bar"
                    onClick={(e) => handleProgressClick(e, recording._id)}
                  >
                    <div 
                      className="progress-fill"
                      style={{ 
                        width: `${(audioProgress[recording._id] || 0) / (audioDurations[recording._id] || 1) * 100}%` 
                      }}
                    />
                  </div>
                  <div className="time-display">
                    <span>{formatTime(audioProgress[recording._id] || 0)}</span>
                    <span>{formatTime(audioDurations[recording._id] || 0)}</span>
                  </div>
                </div>

                <audio
                  ref={el => {
                    audioRefs.current[recording._id] = el;
                    if (el) {
                      el.preload = "metadata";
                      handleLoadedMetadata(recording._id);
                    }
                  }}
                  src={`http://localhost:5001${recording.url}`}
                  onEnded={() => handleAudioEnded(recording._id)}
                  preload="metadata"
                  style={{ display: 'none' }}
                />
                
                <button 
                  className="download-button"
                  onClick={() => handleDownload(recording)}
                >
                  Download
                </button>
                <button 
                  className="delete-button"
                  onClick={() => handleDelete(recording._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Recordings; 