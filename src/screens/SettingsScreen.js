import React from 'react';
import '../styles/SettingsScreen.css';

function SettingsScreen({ onNavigate }) {
  const settingsOptions = [
    {
      id: 'app-assignments',
      title: 'App Assignments',
      icon: '🔗',
      description: 'Configure which apps open for Navigation, Radio, and CarPlay buttons'
    }
  ];

  return (
    <div className="settings-screen">
      <div className="settings-header">
        <button
          className="back-button"
          onClick={() => onNavigate('home')}
        >
          <span className="back-icon">←</span>
          <span className="back-label">Home</span>
        </button>
        <h1 className="settings-title">Settings</h1>
      </div>

      <div className="settings-grid">
        {settingsOptions.map((option) => (
          <div key={option.id} className="settings-card" onClick={() => onNavigate('app-assignments')}>
            <div className="settings-icon">{option.icon}</div>
            <div className="settings-content">
              <h2 className="settings-card-title">{option.title}</h2>
              <p className="settings-description">{option.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SettingsScreen;