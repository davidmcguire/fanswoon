import React, { useState, useEffect, useRef } from 'react';
import { FaPlus, FaTrash, FaEdit, FaGripLines, FaLink, FaMusic, FaVideo, FaPodcast, FaGlobe, FaTwitter, FaInstagram, FaFacebook, FaYoutube, FaSoundcloud, FaSpotify, FaDollarSign, FaClock, FaEye } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './Profile.css';
import PaymentSettings from '../components/PaymentSettings';
import PricingOptions from '../components/PricingOptions';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedBio, setEditedBio] = useState('');
  const [editedDisplayName, setEditedDisplayName] = useState('');
  const [editedLocation, setEditedLocation] = useState('');
  const [editedProfession, setEditedProfession] = useState('');
  const [editedProfileTheme, setEditedProfileTheme] = useState('default');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  
  // Media links state
  const [mediaLinks, setMediaLinks] = useState([]);
  const [showAddLinkForm, setShowAddLinkForm] = useState(false);
  const [editingLinkId, setEditingLinkId] = useState(null);
  const [newLink, setNewLink] = useState({
    title: '',
    url: '',
    type: 'website',
    icon: 'link'
  });

  // Pricing options state
  const [pricingOptions, setPricingOptions] = useState([]);
  const [showAddPricingForm, setShowAddPricingForm] = useState(false);
  const [editingPricingId, setEditingPricingId] = useState(null);
  const [newPricingOption, setNewPricingOption] = useState({
    title: '',
    description: '',
    price: '',
    deliveryTime: '7',
    type: 'personal',
    isActive: true
  });
  
  // Requests info state
  const [acceptsRequests, setAcceptsRequests] = useState(false);
  const [requestsInfo, setRequestsInfo] = useState({
    headline: 'Request a personalized audio message',
    description: '',
    responseTime: 7,
    paymentMethods: {
      paypal: false,
      stripe: false,
      paypalEmail: '',
      stripeAccountId: ''
    }
  });
  const [showRequestsInfoForm, setShowRequestsInfoForm] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const userData = await response.json();
      setUser(userData);
      setEditedName(userData.name);
      setEditedBio(userData.bio || '');
      setEditedDisplayName(userData.displayName || '');
      setEditedLocation(userData.location || '');
      setEditedProfession(userData.profession || '');
      setEditedProfileTheme(userData.profileTheme || 'default');
      setImagePreview(userData.picture);
      setMediaLinks(userData.mediaLinks || []);
      setPricingOptions(userData.pricingOptions || []);
      setAcceptsRequests(userData.acceptsRequests || false);
      setRequestsInfo(userData.requestsInfo || {
        headline: 'Request a personalized audio message',
        description: '',
        responseTime: 7,
        paymentMethods: {
          paypal: false,
          stripe: false,
          paypalEmail: '',
          stripeAccountId: ''
        }
      });
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('name', editedName);
      formData.append('bio', editedBio);
      formData.append('displayName', editedDisplayName);
      formData.append('location', editedLocation);
      formData.append('profession', editedProfession);
      formData.append('profileTheme', editedProfileTheme);
      
      if (selectedImage) {
        formData.append('picture', selectedImage);
      }

      const response = await fetch('http://localhost:5001/api/users/profile', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedUser = await response.json();
      setUser(updatedUser);
      setIsEditing(false);
      setSelectedImage(null);
    } catch (err) {
      setError(err.message);
    }
  };

  // Media link functions
  const handleAddLink = async () => {
    try {
      if (!newLink.title || !newLink.url) {
        setError('Title and URL are required');
        return;
      }

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/users/profile/media-links', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newLink)
      });

      if (!response.ok) {
        throw new Error('Failed to add link');
      }

      const addedLink = await response.json();
      setMediaLinks([...mediaLinks, addedLink]);
      setNewLink({
        title: '',
        url: '',
        type: 'website',
        icon: 'link'
      });
      setShowAddLinkForm(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateLink = async () => {
    try {
      if (!newLink.title || !newLink.url) {
        setError('Title and URL are required');
        return;
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/users/profile/media-links/${editingLinkId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newLink)
      });

      if (!response.ok) {
        throw new Error('Failed to update link');
      }

      const updatedLink = await response.json();
      setMediaLinks(mediaLinks.map(link => 
        link._id === editingLinkId ? updatedLink : link
      ));
      setNewLink({
        title: '',
        url: '',
        type: 'website',
        icon: 'link'
      });
      setEditingLinkId(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteLink = async (linkId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/users/profile/media-links/${linkId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete link');
      }

      setMediaLinks(mediaLinks.filter(link => link._id !== linkId));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditLink = (link) => {
    setNewLink({
      title: link.title,
      url: link.url,
      type: link.type,
      icon: link.icon
    });
    setEditingLinkId(link._id);
    setShowAddLinkForm(true);
  };

  const getIconComponent = (type, icon) => {
    switch (type) {
      case 'music':
        return <FaMusic />;
      case 'video':
        return <FaVideo />;
      case 'podcast':
        return <FaPodcast />;
      case 'social':
        switch (icon) {
          case 'twitter':
            return <FaTwitter />;
          case 'instagram':
            return <FaInstagram />;
          case 'facebook':
            return <FaFacebook />;
          case 'youtube':
            return <FaYoutube />;
          case 'soundcloud':
            return <FaSoundcloud />;
          case 'spotify':
            return <FaSpotify />;
          default:
            return <FaLink />;
        }
      case 'website':
      default:
        return <FaGlobe />;
    }
  };

  // Pricing option functions
  const handleAddPricingOption = async () => {
    try {
      if (!newPricingOption.title || !newPricingOption.price) {
        setError('Title and price are required');
        return;
      }

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/users/profile/pricing-options', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newPricingOption)
      });

      if (!response.ok) {
        throw new Error('Failed to add pricing option');
      }

      const addedOption = await response.json();
      setPricingOptions([...pricingOptions, addedOption]);
      setNewPricingOption({
        title: '',
        description: '',
        price: '',
        deliveryTime: '7',
        type: 'personal',
        isActive: true
      });
      setShowAddPricingForm(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdatePricingOption = async () => {
    try {
      if (!newPricingOption.title || !newPricingOption.price) {
        setError('Title and price are required');
        return;
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/users/profile/pricing-options/${editingPricingId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newPricingOption)
      });

      if (!response.ok) {
        throw new Error('Failed to update pricing option');
      }

      const updatedOption = await response.json();
      setPricingOptions(pricingOptions.map(option => 
        option._id === editingPricingId ? updatedOption : option
      ));
      setNewPricingOption({
        title: '',
        description: '',
        price: '',
        deliveryTime: '7',
        type: 'personal',
        isActive: true
      });
      setEditingPricingId(null);
      setShowAddPricingForm(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeletePricingOption = async (optionId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/users/profile/pricing-options/${optionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete pricing option');
      }

      setPricingOptions(pricingOptions.filter(option => option._id !== optionId));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditPricingOption = (option) => {
    setNewPricingOption({
      title: option.title,
      description: option.description || '',
      price: option.price.toString(),
      deliveryTime: option.deliveryTime.toString(),
      type: option.type,
      isActive: option.isActive
    });
    setEditingPricingId(option._id);
    setShowAddPricingForm(true);
  };

  const handleTogglePricingOptionStatus = async (option) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/users/profile/pricing-options/${option._id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isActive: !option.isActive
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update pricing option status');
      }

      const updatedOption = await response.json();
      setPricingOptions(pricingOptions.map(opt => 
        opt._id === option._id ? updatedOption : opt
      ));
    } catch (err) {
      setError(err.message);
    }
  };

  // Requests info functions
  const handleUpdateRequestsInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/users/profile/requests-info', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          headline: requestsInfo.headline,
          description: requestsInfo.description,
          responseTime: requestsInfo.responseTime,
          paymentMethods: JSON.stringify(requestsInfo.paymentMethods)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update requests info');
      }

      const updatedInfo = await response.json();
      setRequestsInfo(updatedInfo);
      setShowRequestsInfoForm(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleAcceptsRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/users/profile', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          acceptsRequests: (!acceptsRequests).toString()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedUser = await response.json();
      setUser(updatedUser);
      setAcceptsRequests(updatedUser.acceptsRequests);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="profile-container loading">Loading...</div>;
  }

  if (error) {
    return <div className="profile-container error">{error}</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>My Profile</h1>
        <div className="profile-header-buttons">
          {!isEditing && (
            <>
              <button 
                className="view-profile-button"
                onClick={() => navigate(`/profile/${user.displayName || user._id}`)}
              >
                <FaEye /> View Public Profile
              </button>
              <button className="edit-button" onClick={() => setIsEditing(true)}>
                Edit Profile
              </button>
            </>
          )}
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-image-section">
          <div className="profile-image">
            {imagePreview ? (
              <img src={imagePreview} alt="Profile" />
            ) : (
              <div className="profile-image-placeholder">
                {user?.name?.[0]?.toUpperCase()}
              </div>
            )}
            {isEditing && (
              <>
                <button
                  className="change-image-button"
                  onClick={() => fileInputRef.current.click()}
                >
                  Change Image
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
              </>
            )}
          </div>
        </div>

        <div className="profile-details">
          {isEditing ? (
            <>
              <div className="form-group">
                <label>Name:</label>
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>
              <div className="form-group">
                <label>Display Name (optional):</label>
                <input
                  type="text"
                  value={editedDisplayName}
                  onChange={(e) => setEditedDisplayName(e.target.value)}
                  placeholder="Enter a display name"
                />
              </div>
              <div className="form-group">
                <label>Location (optional):</label>
                <input
                  type="text"
                  value={editedLocation}
                  onChange={(e) => setEditedLocation(e.target.value)}
                  placeholder="Enter your location"
                />
              </div>
              <div className="form-group">
                <label>Profession (optional):</label>
                <input
                  type="text"
                  value={editedProfession}
                  onChange={(e) => setEditedProfession(e.target.value)}
                  placeholder="Enter your profession"
                />
              </div>
              <div className="form-group">
                <label>Bio:</label>
                <textarea
                  value={editedBio}
                  onChange={(e) => setEditedBio(e.target.value)}
                  placeholder="Tell us about yourself"
                  rows={4}
                />
              </div>
              <div className="form-group">
                <label>Profile Theme:</label>
                <select 
                  value={editedProfileTheme} 
                  onChange={(e) => setEditedProfileTheme(e.target.value)}
                >
                  <option value="default">Default</option>
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                  <option value="colorful">Colorful</option>
                </select>
              </div>
              <div className="profile-actions">
                <button className="save-button" onClick={handleSaveProfile}>
                  Save Changes
                </button>
                <button
                  className="cancel-button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditedName(user.name);
                    setEditedBio(user.bio || '');
                    setEditedDisplayName(user.displayName || '');
                    setEditedLocation(user.location || '');
                    setEditedProfession(user.profession || '');
                    setEditedProfileTheme(user.profileTheme || 'default');
                    setImagePreview(user.picture);
                    setSelectedImage(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <h2>{user.displayName || user.name}</h2>
              {user.profession && <p className="profession">{user.profession}</p>}
              {user.location && <p className="location">{user.location}</p>}
              <p className="bio">{user.bio || 'No bio available'}</p>
            </>
          )}
        </div>
      </div>

      <div className="media-links-section">
        <div className="section-header">
          <h2>My Links</h2>
          <button 
            className="add-link-button"
            onClick={() => {
              setShowAddLinkForm(true);
              setEditingLinkId(null);
              setNewLink({
                title: '',
                url: '',
                type: 'website',
                icon: 'link'
              });
            }}
          >
            <FaPlus /> Add Link
          </button>
        </div>

        {showAddLinkForm && (
          <div className="link-form">
            <h3>{editingLinkId ? 'Edit Link' : 'Add New Link'}</h3>
            <div className="form-group">
              <label>Title:</label>
              <input
                type="text"
                value={newLink.title}
                onChange={(e) => setNewLink({...newLink, title: e.target.value})}
                placeholder="Enter link title"
              />
            </div>
            <div className="form-group">
              <label>URL:</label>
              <input
                type="text"
                value={newLink.url}
                onChange={(e) => setNewLink({...newLink, url: e.target.value})}
                placeholder="Enter URL (https://...)"
              />
            </div>
            <div className="form-group">
              <label>Type:</label>
              <select
                value={newLink.type}
                onChange={(e) => setNewLink({...newLink, type: e.target.value})}
              >
                <option value="website">Website</option>
                <option value="social">Social Media</option>
                <option value="music">Music</option>
                <option value="video">Video</option>
                <option value="podcast">Podcast</option>
                <option value="other">Other</option>
              </select>
            </div>
            {newLink.type === 'social' && (
              <div className="form-group">
                <label>Platform:</label>
                <select
                  value={newLink.icon}
                  onChange={(e) => setNewLink({...newLink, icon: e.target.value})}
                >
                  <option value="twitter">Twitter</option>
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                  <option value="youtube">YouTube</option>
                  <option value="soundcloud">SoundCloud</option>
                  <option value="spotify">Spotify</option>
                  <option value="link">Other</option>
                </select>
              </div>
            )}
            <div className="link-form-actions">
              <button 
                className="save-button"
                onClick={editingLinkId ? handleUpdateLink : handleAddLink}
              >
                {editingLinkId ? 'Update Link' : 'Add Link'}
              </button>
              <button 
                className="cancel-button"
                onClick={() => {
                  setShowAddLinkForm(false);
                  setEditingLinkId(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="links-preview">
          {mediaLinks.length === 0 ? (
            <p className="no-links">No links added yet. Add your first link to create your Linktree-style profile.</p>
          ) : (
            <div className="links-list">
              {mediaLinks.map((link) => (
                <div key={link._id} className="link-item">
                  <div className="link-drag-handle">
                    <FaGripLines />
                  </div>
                  <div className="link-icon">
                    {getIconComponent(link.type, link.icon)}
                  </div>
                  <div className="link-content">
                    <h3>{link.title}</h3>
                    <p className="link-url">{link.url}</p>
                  </div>
                  <div className="link-actions">
                    <button 
                      className="edit-link-button"
                      onClick={() => handleEditLink(link)}
                    >
                      <FaEdit />
                    </button>
                    <button 
                      className="delete-link-button"
                      onClick={() => handleDeleteLink(link._id)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pricing Options Section */}
      <div className="pricing-options-section">
        <div className="section-header">
          <h2>Pricing Options</h2>
          <div className="section-actions">
            <div className="toggle-container">
              <label className="toggle-label">
                Accept Audio Requests:
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={acceptsRequests}
                    onChange={handleToggleAcceptsRequests}
                  />
                  <span className="toggle-slider"></span>
                </div>
              </label>
            </div>
            <button 
              className="add-button"
              onClick={() => {
                setShowAddPricingForm(true);
                setEditingPricingId(null);
                setNewPricingOption({
                  title: '',
                  description: '',
                  price: '',
                  deliveryTime: '7',
                  type: 'personal',
                  isActive: true
                });
              }}
            >
              <FaPlus /> Add Pricing Option
            </button>
          </div>
        </div>

        {showAddPricingForm && (
          <div className="pricing-form">
            <h3>{editingPricingId ? 'Edit Pricing Option' : 'Add New Pricing Option'}</h3>
            <div className="form-group">
              <label>Title:</label>
              <input
                type="text"
                value={newPricingOption.title}
                onChange={(e) => setNewPricingOption({...newPricingOption, title: e.target.value})}
                placeholder="e.g., Basic Package, Premium Shoutout"
              />
            </div>
            <div className="form-group">
              <label>Description:</label>
              <textarea
                value={newPricingOption.description}
                onChange={(e) => setNewPricingOption({...newPricingOption, description: e.target.value})}
                placeholder="Describe what's included in this option"
                rows={3}
              />
            </div>
            <div className="form-row">
              <div className="form-group half">
                <label>Price ($):</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newPricingOption.price}
                  onChange={(e) => setNewPricingOption({...newPricingOption, price: e.target.value})}
                  placeholder="0.00"
                />
              </div>
              <div className="form-group half">
                <label>Delivery Time (days):</label>
                <input
                  type="number"
                  min="1"
                  value={newPricingOption.deliveryTime}
                  onChange={(e) => setNewPricingOption({...newPricingOption, deliveryTime: e.target.value})}
                  placeholder="7"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Type:</label>
              <select
                value={newPricingOption.type}
                onChange={(e) => setNewPricingOption({...newPricingOption, type: e.target.value})}
              >
                <option value="personal">Personal</option>
                <option value="business">Business</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={newPricingOption.isActive}
                  onChange={(e) => setNewPricingOption({...newPricingOption, isActive: e.target.checked})}
                />
                Active (visible to customers)
              </label>
            </div>
            <div className="form-actions">
              <button 
                className="save-button"
                onClick={editingPricingId ? handleUpdatePricingOption : handleAddPricingOption}
              >
                {editingPricingId ? 'Update Option' : 'Add Option'}
              </button>
              <button 
                className="cancel-button"
                onClick={() => {
                  setShowAddPricingForm(false);
                  setEditingPricingId(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="pricing-options-preview">
          {pricingOptions.length === 0 ? (
            <p className="no-options">No pricing options added yet. Add your first option to start accepting audio requests.</p>
          ) : (
            <div className="pricing-options-list">
              {pricingOptions.map((option) => (
                <div key={option._id} className={`pricing-option-item ${!option.isActive ? 'inactive' : ''}`}>
                  <div className="pricing-option-header">
                    <h3>{option.title}</h3>
                    <div className="pricing-option-price">
                      <FaDollarSign />{option.price.toFixed(2)}
                    </div>
                  </div>
                  <div className="pricing-option-details">
                    <p className="pricing-option-description">{option.description || 'No description provided'}</p>
                    <p className="pricing-option-delivery">
                      <FaClock /> Delivery in {option.deliveryTime} days
                    </p>
                    <p className="pricing-option-type">Type: {option.type.charAt(0).toUpperCase() + option.type.slice(1)}</p>
                  </div>
                  <div className="pricing-option-actions">
                    <button 
                      className="toggle-status-button"
                      onClick={() => handleTogglePricingOptionStatus(option)}
                      title={option.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {option.isActive ? 'Active' : 'Inactive'}
                    </button>
                    <button 
                      className="edit-option-button"
                      onClick={() => handleEditPricingOption(option)}
                    >
                      <FaEdit />
                    </button>
                    <button 
                      className="delete-option-button"
                      onClick={() => handleDeletePricingOption(option._id)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {acceptsRequests && (
          <div className="requests-info-section">
            <div className="section-header">
              <h3>Request Settings</h3>
              <button 
                className="edit-button"
                onClick={() => setShowRequestsInfoForm(!showRequestsInfoForm)}
              >
                {showRequestsInfoForm ? 'Cancel' : 'Edit Settings'}
              </button>
            </div>

            {showRequestsInfoForm ? (
              <div className="requests-info-form">
                <div className="form-group">
                  <label>Headline:</label>
                  <input
                    type="text"
                    value={requestsInfo.headline}
                    onChange={(e) => setRequestsInfo({...requestsInfo, headline: e.target.value})}
                    placeholder="Request a personalized audio message"
                  />
                </div>
                <div className="form-group">
                  <label>Description:</label>
                  <textarea
                    value={requestsInfo.description}
                    onChange={(e) => setRequestsInfo({...requestsInfo, description: e.target.value})}
                    placeholder="Describe what customers can expect when requesting audio from you"
                    rows={3}
                  />
                </div>
                <div className="form-group">
                  <label>Response Time (days):</label>
                  <input
                    type="number"
                    min="1"
                    value={requestsInfo.responseTime}
                    onChange={(e) => setRequestsInfo({...requestsInfo, responseTime: parseInt(e.target.value)})}
                  />
                </div>
                <div className="form-group">
                  <h4>Payment Methods</h4>
                  <div className="payment-methods">
                    <div className="payment-method">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={requestsInfo.paymentMethods.paypal}
                          onChange={(e) => setRequestsInfo({
                            ...requestsInfo, 
                            paymentMethods: {
                              ...requestsInfo.paymentMethods,
                              paypal: e.target.checked
                            }
                          })}
                        />
                        Accept PayPal
                      </label>
                      {requestsInfo.paymentMethods.paypal && (
                        <input
                          type="email"
                          value={requestsInfo.paymentMethods.paypalEmail || ''}
                          onChange={(e) => setRequestsInfo({
                            ...requestsInfo, 
                            paymentMethods: {
                              ...requestsInfo.paymentMethods,
                              paypalEmail: e.target.value
                            }
                          })}
                          placeholder="PayPal Email Address"
                        />
                      )}
                    </div>
                    <div className="payment-method">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={requestsInfo.paymentMethods.stripe}
                          onChange={(e) => setRequestsInfo({
                            ...requestsInfo, 
                            paymentMethods: {
                              ...requestsInfo.paymentMethods,
                              stripe: e.target.checked
                            }
                          })}
                        />
                        Accept Stripe
                      </label>
                      {requestsInfo.paymentMethods.stripe && (
                        <input
                          type="text"
                          value={requestsInfo.paymentMethods.stripeAccountId || ''}
                          onChange={(e) => setRequestsInfo({
                            ...requestsInfo, 
                            paymentMethods: {
                              ...requestsInfo.paymentMethods,
                              stripeAccountId: e.target.value
                            }
                          })}
                          placeholder="Stripe Account ID"
                        />
                      )}
                    </div>
                  </div>
                </div>
                <div className="form-actions">
                  <button 
                    className="save-button"
                    onClick={handleUpdateRequestsInfo}
                  >
                    Save Settings
                  </button>
                </div>
              </div>
            ) : (
              <div className="requests-info-preview">
                <h4>{requestsInfo.headline}</h4>
                <p>{requestsInfo.description || 'No description provided'}</p>
                <p>Response time: {requestsInfo.responseTime} days</p>
                <div className="payment-methods-preview">
                  <h4>Payment Methods:</h4>
                  {!requestsInfo.paymentMethods.paypal && !requestsInfo.paymentMethods.stripe ? (
                    <p>No payment methods configured</p>
                  ) : (
                    <ul>
                      {requestsInfo.paymentMethods.paypal && <li>PayPal</li>}
                      {requestsInfo.paymentMethods.stripe && <li>Stripe</li>}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Payment Settings */}
      <div className="profile-section">
        <PaymentSettings user={user} onUpdate={handleSaveProfile} />
      </div>

      {/* Pricing Options */}
      <div className="profile-section">
        <PricingOptions user={user} onUpdate={handleSaveProfile} />
      </div>
    </div>
  );
};

export default Profile; 