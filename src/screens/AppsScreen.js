import React, { useState } from 'react';
import AppCard from '../components/AppCard';
import '../styles/AppsScreen.css';

function AppsScreen({ onNavigate }) {
  const [searchQuery, setSearchQuery] = useState('');

  const allApps = [
    { id: 1, name: 'Music Player', icon: '♫', category: 'Entertainment', color: '#dc2626' },
    { id: 2, name: 'Phone', icon: '☎', category: 'Communication', color: '#991b1b' },
    { id: 3, name: 'Maps Navigation', icon: '🗺', category: 'Navigation', color: '#b91c1c' },
    { id: 4, name: 'Messages', icon: '💬', category: 'Communication', color: '#ef4444' },
    { id: 5, name: 'Settings', icon: '⚙', category: 'System', color: '#7f1d1d' },
    { id: 6, name: 'Climate Control', icon: '❄', category: 'Vehicle', color: '#991b1b' },
    { id: 7, name: 'Diagnostics', icon: '🔧', category: 'Vehicle', color: '#dc2626' },
    { id: 8, name: 'Camera', icon: '📷', category: 'Vehicle', color: '#b91c1c' },
  ];

  const filteredApps = allApps.filter(app =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="apps-screen">
      <div className="apps-header">
        <button 
          className="back-button"
          onClick={() => onNavigate('home')}
        >
          ← Home
        </button>
        <h1 className="apps-title">Applications</h1>
      </div>

      <div className="search-section">
        <input
          type="text"
          className="search-input"
          placeholder="Search apps..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="apps-grid">
        {filteredApps.length > 0 ? (
          filteredApps.map(app => (
            <AppCard key={app.id} app={app} />
          ))
        ) : (
          <div className="no-results">
            <p>No apps found</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AppsScreen;
