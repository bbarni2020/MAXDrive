import React from 'react';
import '../styles/StatusBar.css';

function StatusBar({ time }) {
  const formattedTime = time.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const temperature = 72;
  const batteryLevel = 85;

  return (
    <div className="status-bar">
      <div className="status-left">
        <span className="time">{formattedTime}</span>
      </div>

      <div className="status-center">
        <span className="device-name">MAXDrive</span>
      </div>

      <div className="status-right">
        <span className="temperature">
          <span className="temp-icon">🌡</span>
          {temperature}°
        </span>
        <span className="battery">
          <span className="battery-icon">🔋</span>
          {batteryLevel}%
        </span>
      </div>
    </div>
  );
}

export default StatusBar;
