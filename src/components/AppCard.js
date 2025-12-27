import React, { useCallback } from 'react';
import '../styles/AppCard.css';

const AppCard = ({ app, onClick, compact = false }) => {
  const handleClick = useCallback(() => {
    onClick(app);
  }, [app, onClick]);

  const isBase64Icon = app?.icon && app.icon.startsWith('data:image');
  
  return (
    <div className={`app-card ${compact ? 'compact' : ''}`} onClick={handleClick} role="button" tabIndex={0}>
      <div className="app-card-icon-wrap">
        {isBase64Icon ? (
          <img src={app.icon} alt={app.name} className="app-card-icon-img" loading="lazy" />
        ) : (
          <div className="app-card-icon">{app.icon || '📱'}</div>
        )}
      </div>
      <div className="app-card-info">
        <h3 className="app-card-name">{app.name}</h3>
      </div>
    </div>
  );
};

export default React.memo(AppCard);
