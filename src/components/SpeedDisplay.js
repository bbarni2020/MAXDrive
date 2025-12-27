import React, { useState } from 'react';
import '../styles/SpeedDisplay.css';

function SpeedDisplay({ obdConnected, speed }) {
  const speedThreshold = 120;
  const isHighSpeed = speed >= speedThreshold;
  const isDevMode = process.env.REACT_APP_DEV_MODE === 'true';

  return (
    <div className="speed-display">
      <div className="speed-value">
        <span className={`speed-number ${isHighSpeed ? 'high-speed' : ''}`}>
          {Math.round(speed)}
        </span>
        <span className="speed-unit">km/h</span>
      </div>
      
      <div className="speed-status">
        <div className="status-indicator">
          <span className={`status-dot ${obdConnected ? 'connected' : 'disconnected'}`}></span>
          <span className="status-text">{obdConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
        {isDevMode && (
          <div className="dev-indicator">
            <span className="dev-badge">DEV</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default SpeedDisplay;
