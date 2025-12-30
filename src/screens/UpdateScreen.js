import React, { useState, useEffect, useRef } from 'react';
import '../styles/UpdateScreen.css';
import androidBridge from '../utils/androidBridge';

function UpdateScreen({ version, apkUrl, onCancel, onComplete, onMinimize, onProgressUpdate }) {
  const [status, setStatus] = useState('preparing');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const updateStarted = useRef(false);

  const updateStatus = (newStatus) => {
    setStatus(newStatus);
    if (onProgressUpdate) {
      onProgressUpdate(progress, newStatus);
    }
  };

  const updateProgress = (newProgress) => {
    setProgress(newProgress);
    if (onProgressUpdate) {
      onProgressUpdate(newProgress, status);
    }
  };

  useEffect(() => {
    if (updateStarted.current) return;
    updateStarted.current = true;
    const executeUpdate = async () => {
      try {
        if (!apkUrl) {
          setError('No APK URL provided');
          updateStatus('error');
          return;
        }
        updateStatus('downloading');
        updateProgress(0);
        androidBridge.registerDownloadProgressCallback((downloadProgress) => {
          if (typeof downloadProgress === 'number') {
            updateProgress(Math.min(downloadProgress, 99));
          }
        });
        const installSuccess = await androidBridge.downloadAndInstallApk(apkUrl);
        if (!installSuccess) {
          setError('Failed to download and install APK. Please check your connection and try again.');
          updateStatus('error');
          return;
        }
        updateProgress(95);
        updateStatus('installing');
        await new Promise(resolve => setTimeout(resolve, 2000));
        updateProgress(100);
        updateStatus('completed');
        if (onComplete) {
          setTimeout(() => {
            if (typeof window.Android?.restartApp === 'function') {
              window.Android.restartApp();
            } else {
              window.location.reload();
            }
          }, 2000);
        }
      } catch (err) {
        setError(err?.message || 'An unexpected error occurred during update');
        updateStatus('error');
      }
    };
    executeUpdate();
  }, [onComplete, apkUrl, version, updateProgress, updateStatus]);

  return (
    <div className="update-screen">
      <div className="update-container">
        {status !== 'error' && status !== 'completed' && (
          <>
            <div className="update-header">
              <h1>System Update</h1>
              <p className="update-version-text">Version {version}</p>
              <button className="minimize-button" onClick={onMinimize} title="Minimize">
                <span>−</span>
              </button>
            </div>

            <div className="update-visual">
              <div className={`update-icon ${status}`}>
                {status === 'preparing' && <span className="icon-preparing">⚙</span>}
                {status === 'downloading' && <span className="icon-downloading">⬇</span>}
                {status === 'installing' && <span className="icon-installing">📦</span>}
              </div>
            </div>

            <div className="status-text">
              <p className="status-label">
                {status === 'preparing' && 'Preparing update...'}
                {status === 'downloading' && 'Downloading...'}
                {status === 'installing' && 'Installing update...'}
              </p>
            </div>

            <div className="progress-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="progress-text">{progress}%</p>
            </div>

            <div className="update-info">
              <p>Do not close the application or turn off your device</p>
            </div>



            <button 
              className="cancel-button"
              onClick={onCancel}
              disabled={status !== 'preparing'}
            >
              Cancel
            </button>
          </>
        )}

        {status === 'completed' && (
          <div className="completion-container">
            <div className="success-icon">✓</div>
            <h2>Update Complete</h2>
            <p>Your system has been updated successfully</p>
            <p className="new-version">Version {version} is now installed</p>
            <p className="restart-info">Restarting application...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="error-container">
            <div className="error-icon">⚠</div>
            <h2>Update Failed</h2>
            <div className="error-details">
              <p className="error-message">{error}</p>
            </div>
            <div className="error-actions">
              <button 
                className="retry-button"
                onClick={() => {
                  setStatus('preparing');
                  setProgress(0);
                  setError(null);
                }}
              >
                Retry
              </button>
              <button 
                className="cancel-button"
                onClick={onCancel}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UpdateScreen;
