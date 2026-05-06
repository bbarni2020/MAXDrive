import React, { useEffect, useRef, useState } from 'react';
import '../styles/SpeedDisplay.css';

function SpeedDisplay({ gpsConnected, speed }) {
  const speedThreshold = 120;
  const [displaySpeed, setDisplaySpeed] = useState(0);
  const [pulse, setPulse] = useState(false);
  const displayRef = useRef(0);
  const isHighSpeed = displaySpeed >= speedThreshold;
  const isDevMode = process.env.REACT_APP_DEV_MODE === 'true';

  useEffect(() => {
    const clampedSpeed = Math.max(0, Math.min(speed, 350));
    const from = displayRef.current;
    const to = clampedSpeed;
    const duration = 300;
    const start = performance.now();
    let raf;
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
    
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = easeOutCubic(t);
      const val = from + (to - from) * eased;
      setDisplaySpeed(Math.round(val));
      displayRef.current = val;
      if (t < 1) raf = requestAnimationFrame(step);
    };
    
    raf = requestAnimationFrame(step);
    
    if (Math.abs(to - from) > 3) {
      setPulse(true);
      const tid = setTimeout(() => setPulse(false), 250);
      return () => { 
        cancelAnimationFrame(raf); 
        clearTimeout(tid); 
      };
    }
    
    return () => cancelAnimationFrame(raf);
  }, [speed]);

  return (
    <div className="speed-display">
      <div className="speed-value">
        <span className={`speed-number ${isHighSpeed ? 'high-speed' : ''} ${pulse ? 'pulse' : ''}`}>
          {Math.round(displaySpeed)}
        </span>
        <span className="speed-unit">km/h</span>
      </div>
      
      <div className="speed-status">
        <div className="status-indicator">
          <span className={`status-dot ${gpsConnected ? 'connected' : 'disconnected'}`}></span>
          <span className="status-text">{gpsConnected ? 'GPS Connected' : 'GPS Disconnected'}</span>
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
