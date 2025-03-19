import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CircleProgressBar from '../components/CircleProgressBar';
import './Upload.css';

const Upload = () => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [shareWith, setShareWith] = useState('');
  const [shareType, setShareType] = useState('email');
  const [appUsers, setAppUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch users from the app when component mounts
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5001/api/users', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setAppUsers(data);
        }
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };
    
    fetchUsers();
  }, []);

  useEffect(() => {
    // Filter users based on input
    if (shareType === 'user' && shareWith) {
      const filtered = appUsers.filter(user => 
        user.name.toLowerCase().includes(shareWith.toLowerCase()) ||
        (user.email && user.email.toLowerCase().includes(shareWith.toLowerCase()))
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers([]);
    }
  }, [shareWith, shareType, appUsers]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('audio/')) {
      setFile(droppedFile);
      setError(null);
    } else {
      setError('Please select an audio file');
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type.startsWith('audio/')) {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('Please select an audio file');
    }
  };

  const handleSelectUser = (user) => {
    setShareWith(user.email || user.name);
    setShowUserDropdown(false);
  };

  const handleSend = async () => {
    if (!file) {
      setError('Please select an audio file');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      
      // Create form data
      const formData = new FormData();
      formData.append('audio', file);
      formData.append('title', title);
      formData.append('description', description);
      
      if (shareWith) {
        formData.append('shareWith', shareWith);
        formData.append('shareType', shareType);
      }
      
      // Use XMLHttpRequest for better reliability
      const uploadWithXHR = () => {
        return new Promise((resolve, reject) => {
          // Get the authentication token
          const token = localStorage.getItem('token');
          if (!token) {
            reject(new Error('You must be logged in to send audio'));
            return;
          }
          
          const xhr = new XMLHttpRequest();
          
          // Set up progress tracking
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100);
              setUploadProgress(progress);
            }
          });
          
          // Set up completion handler
          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const data = JSON.parse(xhr.responseText);
                resolve(data);
              } catch (e) {
                reject(new Error('Invalid response from server'));
              }
            } else {
              try {
                const errorData = JSON.parse(xhr.responseText);
                reject(new Error(errorData.message || `Server error: ${xhr.status}`));
              } catch (e) {
                reject(new Error(`Server error: ${xhr.status}`));
              }
            }
          });
          
          // Set up error handler
          xhr.addEventListener('error', () => {
            reject(new Error('Network error occurred during sending'));
          });
          
          // Set up abort handler
          xhr.addEventListener('abort', () => {
            reject(new Error('Sending was aborted'));
          });
          
          // Open and send the request
          xhr.open('POST', 'http://localhost:5001/api/recordings/upload');
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          xhr.send(formData);
        });
      };
      
      const data = await uploadWithXHR();
      
      // Prepare success details
      const successDetails = {
        title: title || 'Untitled Audio',
        description: description || '',
        fileName: file.name,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        uploadDate: new Date().toLocaleString()
      };
      
      // Add sharing details if provided
      if (shareWith) {
        successDetails.shareWith = shareWith;
        successDetails.shareType = shareType;
        
        // Add sharing status from server response
        if (data.sharingStatus) {
          if (data.sharingStatus.success) {
            if (shareType === 'email') {
              successDetails.compressionStatus = data.sharingStatus.compressionStatus || 'Audio processed for email';
              successDetails.sharingStatus = data.sharingStatus.emailStatus || 'Email prepared for sending';
              
              // Add preview URL for test emails (Ethereal)
              if (data.sharingStatus.previewUrl) {
                successDetails.previewUrl = data.sharingStatus.previewUrl;
              }
            } else {
              successDetails.sharingStatus = `Shared with user: ${data.sharingStatus.recipient}`;
            }
          } else {
            // Sharing attempted but failed
            successDetails.sharingWarning = data.sharingStatus.error || 'There was an issue with sharing';
          }
        }
      }
      
      // Navigate to result page with success status and details
      navigate('/upload/result', { 
        state: { 
          status: 'success',
          details: successDetails
        } 
      });
      
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.message || 'Error sending file');
      setIsUploading(false);
      
      // Navigate to result page with error details
      navigate('/upload/result', { 
        state: { 
          status: 'error',
          details: {
            message: error.message || 'Network error occurred during sending',
            suggestion: 'Please check your internet connection and try again. If the problem persists, contact support.'
          }
        } 
      });
    }
  };

  return (
    <div className="upload-container">
      <h1>Send Audio</h1>
      <div 
        className={`upload-area ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="audio/*"
          style={{ display: 'none' }}
        />
        {file ? (
          <div className="file-info">
            <p className="file-name">{file.name}</p>
            <button className="remove-file" onClick={(e) => {
              e.stopPropagation();
              setFile(null);
            }}>Remove</button>
          </div>
        ) : (
          <div className="upload-prompt">
            <p>Drag and drop an audio file here</p>
            <p>or click to select a file</p>
          </div>
        )}
      </div>

      {isUploading ? (
        <div className="upload-progress">
          <CircleProgressBar progress={uploadProgress} />
          <p className="send-status">
            {uploadProgress < 100 ? 'Sending...' : 'Processing...'}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSend} className="upload-form">
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title for your audio"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter a description (optional)"
            />
          </div>

          <div className="form-group">
            <label>Share With (Optional)</label>
            <div className="share-options">
              <div className="share-type-selector">
                <label>
                  <input
                    type="radio"
                    name="shareType"
                    value="email"
                    checked={shareType === 'email'}
                    onChange={() => setShareType('email')}
                  />
                  Email
                </label>
                <label>
                  <input
                    type="radio"
                    name="shareType"
                    value="user"
                    checked={shareType === 'user'}
                    onChange={() => setShareType('user')}
                  />
                  App User
                </label>
              </div>
              
              <div className="share-input-container">
                <input
                  type="text"
                  value={shareWith}
                  onChange={(e) => {
                    setShareWith(e.target.value);
                    if (shareType === 'user') {
                      setShowUserDropdown(true);
                    }
                  }}
                  onFocus={() => {
                    if (shareType === 'user' && shareWith) {
                      setShowUserDropdown(true);
                    }
                  }}
                  onBlur={() => {
                    // Delay hiding to allow for clicks on the dropdown
                    setTimeout(() => setShowUserDropdown(false), 200);
                  }}
                  placeholder={shareType === 'email' ? "Enter email address" : "Search for a user"}
                />
                
                {showUserDropdown && filteredUsers.length > 0 && (
                  <div className="user-dropdown">
                    {filteredUsers.map(user => (
                      <div 
                        key={user._id} 
                        className="user-item"
                        onMouseDown={() => handleSelectUser(user)}
                      >
                        {user.name} {user.email ? `(${user.email})` : ''}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="share-info">
                {shareType === 'email' && (
                  <p className="info-text">
                    <small>Audio will be processed for email sharing.</small>
                  </p>
                )}
                {shareType === 'user' && (
                  <p className="info-text">
                    <small>Original audio quality will be preserved when sharing with app users.</small>
                  </p>
                )}
              </div>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button 
            type="submit" 
            className="send-button"
            disabled={!file || isUploading}
          >
            Send Audio
          </button>
        </form>
      )}
    </div>
  );
};

export default Upload; 