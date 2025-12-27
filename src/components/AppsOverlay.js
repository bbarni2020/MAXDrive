import React, { useState, useEffect, useCallback } from 'react';
import AppCard from './AppCard';
import androidBridge from '../utils/androidBridge';
import '../styles/AppsOverlay.css';

function AppsOverlay({ onClose, onNavigate }) {
  const [allApps, setAllApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isClosing, setIsClosing] = useState(false);

  const loadApps = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apps = await androidBridge.getInstalledApps();
      const filteredApps = Array.isArray(apps) ? apps.filter(app => app.packageName !== 'com.maxdrive.app') : [];
      const settingsApp = {
        packageName: 'com.maxdrive.settings',
        name: 'Settings',
        icon: '⚙️'
      };
      const allAppsWithSettings = [settingsApp, ...filteredApps].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setAllApps(allAppsWithSettings);
    } catch (err) {
      setError('Failed to load apps');
      setAllApps([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApps();
  }, [loadApps]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300); // Match animation duration
  }, [onClose]);

  const handleAppClick = useCallback((app) => {
    if (app?.packageName === 'com.maxdrive.settings') {
      onNavigate('settings');
      handleClose();
    } else if (app?.packageName) {
      androidBridge.launchApp(app.packageName);
      handleClose();
    }
  }, [handleClose, onNavigate]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div className={`apps-overlay ${isClosing ? 'closing' : ''}`} onClick={handleOverlayClick}>
      <div className={`apps-menu ${isClosing ? 'closing' : ''}`}>
        <div className="apps-header">
          <h2 className="apps-title">Apps</h2>
          <button className="close-button" onClick={handleClose}>✕</button>
        </div>

        <div className="apps-content">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading apps...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <p>{error}</p>
              <button onClick={loadApps} className="retry-button">Retry</button>
            </div>
          ) : allApps.length > 0 ? (
            <div className="apps-grid">
              {allApps.map((app) => (
                <AppCard key={app.packageName} app={app} onClick={handleAppClick} compact={true} />
              ))}
            </div>
          ) : (
            <div className="no-results">
              <p>No apps found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AppsOverlay;