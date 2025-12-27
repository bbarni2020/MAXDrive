import React from 'react';
import '../styles/QuickLaunch.css';

function QuickLaunch({ app }) {
  return (
    <div className="quick-launch" style={{ backgroundColor: app.color }}>
      <div className="quick-launch-icon">{app.icon}</div>
      <div className="quick-launch-name">{app.name}</div>
    </div>
  );
}

export default QuickLaunch;
