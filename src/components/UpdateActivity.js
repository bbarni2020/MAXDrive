import React from 'react';
import '../styles/UpdateActivity.css';

function UpdateActivity({ version, progress, status, onExpand }) {
  const getStatusText = () => {
    switch (status) {
      case 'preparing':
        return 'Preparing update...';
      case 'downloading':
        return `Downloading ${progress}%`;
      case 'installing':
        return 'Installing...';
      case 'completed':
        return 'Update complete';
      case 'error':
        return 'Update failed';
      default:
        return 'Updating...';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'preparing':
        return '⚙';
      case 'downloading':
        return '⬇';
      case 'installing':
        return '📦';
      case 'completed':
        return '✓';
      case 'error':
        return '⚠';
      default:
        return '⚙';
    }
  };

  return (
    <div className={`update-activity ${status}`} onClick={onExpand}>
      <div className="activity-content">
        <div className="activity-icon">{getStatusIcon()}</div>
        <div className="activity-info">
          <div className="activity-title">System Update v{version}</div>
          <div className="activity-status">{getStatusText()}</div>
        </div>
        <div className="activity-progress">
          <div className="circular-progress">
            <svg width="40" height="40">
              <circle
                cx="20"
                cy="20"
                r="16"
                fill="none"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="3"
              />
              <circle
                cx="20"
                cy="20"
                r="16"
                fill="none"
                stroke={status === 'error' ? '#F44336' : status === 'completed' ? '#4CAF50' : '#4A90E2'}
                strokeWidth="3"
                strokeDasharray={`${(progress / 100) * 100.5} 100.5`}
                strokeLinecap="round"
                transform="rotate(-90 20 20)"
              />
            </svg>
            <span className="progress-value">{status === 'completed' || status === 'error' ? '' : `${progress}%`}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UpdateActivity;
