import React, { useState, useEffect, useCallback } from 'react';
import androidBridge from '../utils/androidBridge';
import '../styles/AppAssignmentsScreen.css';

function AppAssignmentsScreen({ onNavigate }) {
  const [allApps, setAllApps] = useState([]);
  const [assignments, setAssignments] = useState({
    navigation: null,
    radio: null,
    carplay: null
  });
  const [loading, setLoading] = useState(true);

  const loadApps = useCallback(async () => {
    setLoading(true);
    try {
      const apps = await androidBridge.getInstalledApps();
      const filteredApps = Array.isArray(apps) ? apps.filter(app => app.packageName !== 'com.maxdrive.app') : [];
      setAllApps(filteredApps);
    } catch (err) {
      setAllApps([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApps();
  }, [loadApps]);

  const handleAssignmentChange = (button, appPackageName) => {
    setAssignments(prev => ({
      ...prev,
      [button]: appPackageName
    }));
  };

  const saveAssignments = () => {
    localStorage.setItem('appAssignments', JSON.stringify(assignments));
    onNavigate('settings');
  };

  const buttons = [
    { id: 'navigation', label: 'Navigation', icon: '🗺️' },
    { id: 'radio', label: 'Radio', icon: '📻' },
    { id: 'carplay', label: 'CarPlay', icon: '🚗' }
  ];

  return (
    <div className="app-assignments-screen">
      <div className="assignments-header">
        <button
          className="back-button"
          onClick={() => onNavigate('settings')}
        >
          <span className="back-icon">←</span>
          <span className="back-label">Settings</span>
        </button>
        <h1 className="assignments-title">App Assignments</h1>
        <button className="save-button" onClick={saveAssignments}>
          Save
        </button>
      </div>

      <div className="assignments-content">
        {buttons.map((button) => (
          <div key={button.id} className="assignment-section">
            <div className="assignment-header">
              <span className="assignment-icon">{button.icon}</span>
              <h2 className="assignment-title">{button.label}</h2>
            </div>

            <div className="assignment-grid">
              <div
                className={`assignment-option ${assignments[button.id] === null ? 'selected' : ''}`}
                onClick={() => handleAssignmentChange(button.id, null)}
              >
                <div className="assignment-icon">🚫</div>
                <span className="assignment-label">None</span>
              </div>

              {allApps.map((app) => (
                <div
                  key={app.packageName}
                  className={`assignment-option ${assignments[button.id] === app.packageName ? 'selected' : ''}`}
                  onClick={() => handleAssignmentChange(button.id, app.packageName)}
                >
                  <div className="assignment-icon">
                    {app.icon && app.icon.startsWith('data:image') ? (
                      <img src={app.icon} alt={app.name} className="assignment-app-icon" />
                    ) : (
                      app.icon || '📱'
                    )}
                  </div>
                  <span className="assignment-label">{app.name}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AppAssignmentsScreen;