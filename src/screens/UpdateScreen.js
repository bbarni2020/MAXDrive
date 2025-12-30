import React from 'react';
import '../styles/UpdateScreen.css';
function UpdateScreen({ version, apkUrl, onCancel, onComplete, onMinimize, onProgressUpdate }) {
  const [status, setStatus] = React.useState('preparing');
  const [progress, setProgress] = React.useState(0);
  const [error, setError] = React.useState(null);
  const updateStarted = React.useRef(false);
  React.useEffect(() => {
    return () => {
      if (window.onDownloadProgress) {
        delete window.onDownloadProgress;
      }
    };
  }, []);

  React.useEffect(() => {
    if (updateStarted.current) return;
    updateStarted.current = true;
    
    window.onDownloadProgress = (downloadProgress) => {
      if (typeof downloadProgress === 'number') {
        setProgress(Math.min(downloadProgress, 99));
      }
    };
    
    const executeUpdate = async () => {
      try {
        if (!apkUrl) {
          setError('No APK URL provided');
          setStatus('error');
          return;
        }
        if (process.env.NODE_ENV === 'development') {
          setStatus('downloading');
          setProgress(0);
          let currentProgress = 0;
          const interval = setInterval(() => {
            currentProgress += 1;
            setProgress(Math.min(currentProgress, 99));
            if (currentProgress >= 99) {
              clearInterval(interval);
              setProgress(95);
              setStatus('installing');
              setTimeout(() => {
                setProgress(100);
                setStatus('completed');
                if (onComplete) {
                  setTimeout(() => {
                    if (typeof window.Android?.restartApp === 'function') {
                      window.Android.restartApp();
                    } else {
                      window.location.reload();
                    }
                  }, 2000);
                }
              }, 2000);
            }
          }, 300);
        } else {
          setStatus('downloading');
          setProgress(0);
          
          window.onDownloadProgress = (downloadProgress) => {
            if (typeof downloadProgress === 'number') {
              setProgress(Math.min(downloadProgress, 99));
              if (downloadProgress >= 100) {
                setProgress(100);
                setStatus('installing');
              }
            }
          };
          
          const installSuccess = await window.Android?.downloadAndInstallApk?.(apkUrl);
          if (!installSuccess) {
            setError('Failed to download and install APK. Please check your connection and try again.');
            setStatus('error');
            return;
          }
          
          await new Promise(resolve => setTimeout(resolve, 2000));
          setStatus('completed');
          if (onComplete) {
            setTimeout(() => {
              if (typeof window.Android?.restartApp === 'function') {
                window.Android.restartApp();
              } else {
                window.location.reload();
              }
            }, 2000);
          }
        }
      } catch (err) {
        setError(err?.message || 'An unexpected error occurred during update');
        setStatus('error');
      }
    };
    executeUpdate();
  }, [onComplete, apkUrl, version]);

  return (
    <div className="redesign-fullscreen">
      <button className="minimize-button" onClick={onMinimize} title="Minimize"><span>−</span></button>
      {status !== 'error' && status !== 'completed' && (
        <>
          <div className="update-info-area">
            <div className="update-header-left">
              <h1>System Update</h1>
              <p className="update-version-text">Version {version}</p>
              <div className="status-label">
                {status === 'preparing' && 'Preparing update...'}
                {status === 'downloading' && 'Downloading...'}
                {status === 'installing' && 'Installing update...'}
              </div>
              <div className="update-info-text">Do not close the application or turn off your device</div>
              <button className="cancel-button" onClick={onCancel} disabled={status !== 'preparing'}>Cancel</button>
            </div>
          </div>
          <div className="update-progress-bar-fullscreen">
            <div className="progress-bar-fullscreen">
              <div className="progress-fill-fullscreen" style={{ width: `${progress}%` }} />
            </div>
            <div className="progress-text-fullscreen">{progress}%</div>
          </div>
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
            <button className="retry-button" onClick={() => { setStatus('preparing'); setProgress(0); setError(null); }}>Retry</button>
            <button className="cancel-button" onClick={onCancel}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UpdateScreen;
