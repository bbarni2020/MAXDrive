import React from 'react';
import '../styles/AppCard.css';

function AppCard({ app }) {
  return (
    <div className="app-card" style={{ backgroundColor: app.color }}>
      <div className="app-card-icon">{app.icon}</div>
      <div className="app-card-info">
        <h3 className="app-card-name">{app.name}</h3>
        <p className="app-card-category">{app.category}</p>
      </div>
    </div>
  );
}

export default AppCard;
