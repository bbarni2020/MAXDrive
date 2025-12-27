import React from 'react';
import '../styles/AppCard.css';

function AppCard({ app, onClick }) {
  return (
    <div className="app-card" onClick={onClick}>
      <div className="app-card-icon-wrap">
        <div className="app-card-icon">{app.icon}</div>
      </div>
      <div className="app-card-info">
        <h3 className="app-card-name">{app.name}</h3>
      </div>
    </div>
  );
}

export default AppCard;
