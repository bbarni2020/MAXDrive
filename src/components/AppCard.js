import React from 'react';
import '../styles/AppCard.css';

function AppCard({ app, onClick }) {
  const isBase64Icon = app.icon && app.icon.startsWith('data:image');
  
  return (
    <div className="app-card" onClick={onClick}>
      <div className="app-card-icon-wrap">
        {isBase64Icon ? (
          <img src={app.icon} alt={app.name} className="app-card-icon-img" />
        ) : (
          <div className="app-card-icon">{app.icon || '📱'}</div>
        )}
      </div>
      <div className="app-card-info">
        <h3 className="app-card-name">{app.name}</h3>
      </div>
    </div>
  );
}

export default AppCard;
