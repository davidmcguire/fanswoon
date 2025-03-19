import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle, FaEnvelope, FaUser, FaExternalLinkAlt } from 'react-icons/fa';
import './UploadResult.css';

const UploadResult = () => {
  const location = useLocation();
  const { status, details } = location.state || { status: 'error', details: { message: 'No sending information available' } };
  
  const isSuccess = status === 'success';
  
  return (
    <div className="upload-result-container">
      <div className={`result-card ${isSuccess ? 'success' : 'error'}`}>
        <div className="result-header">
          {isSuccess ? (
            <>
              <FaCheckCircle className="icon success" />
              <h2>Send Successful!</h2>
            </>
          ) : (
            <>
              <FaTimesCircle className="icon error" />
              <h2>Send Failed</h2>
            </>
          )}
        </div>
        
        <div className="result-content">
          {isSuccess ? (
            <>
              <div className="detail-item">
                <strong>Title:</strong> {details.title}
              </div>
              {details.description && (
                <div className="detail-item">
                  <strong>Description:</strong> {details.description}
                </div>
              )}
              <div className="detail-item">
                <strong>File:</strong> {details.fileName}
              </div>
              <div className="detail-item">
                <strong>Size:</strong> {details.fileSize}
              </div>
              <div className="detail-item">
                <strong>Sent:</strong> {details.uploadDate}
              </div>
              
              {/* Sharing information */}
              {details.shareWith && (
                <div className="sharing-details">
                  <h3>Sharing Information</h3>
                  <div className="detail-item">
                    <strong>Shared with:</strong> {details.shareWith}
                    {details.shareType === 'email' ? (
                      <FaEnvelope className="sharing-icon" />
                    ) : (
                      <FaUser className="sharing-icon" />
                    )}
                  </div>
                  
                  {details.compressionStatus && (
                    <div className="detail-item">
                      <strong>Compression:</strong> {details.compressionStatus}
                    </div>
                  )}
                  
                  {details.sharingStatus && (
                    <div className="detail-item">
                      <strong>Status:</strong> {details.sharingStatus}
                    </div>
                  )}
                  
                  {details.sharingWarning && (
                    <div className="detail-item warning">
                      <strong>Warning:</strong> {details.sharingWarning}
                    </div>
                  )}
                  
                  {/* Email preview link for test emails */}
                  {details.previewUrl && (
                    <div className="detail-item preview-link">
                      <strong>Test Email:</strong>
                      <a href={details.previewUrl} target="_blank" rel="noopener noreferrer">
                        View Email Preview <FaExternalLinkAlt />
                      </a>
                      <div className="note">
                        (This is a test email preview. In production, real emails will be sent.)
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="error-message">
                {details.message}
              </div>
              {details.suggestion && (
                <div className="suggestion">
                  {details.suggestion}
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="result-actions">
          <Link to="/upload" className="btn primary">
            {isSuccess ? 'Send Another' : 'Try Again'}
          </Link>
          <Link to="/audio-history" className="btn secondary">
            My Audio History
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UploadResult; 