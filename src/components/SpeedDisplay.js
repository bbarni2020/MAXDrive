import React, { useEffect, useRef, useState } from 'react';
import '../styles/SpeedDisplay.css';

function SpeedDisplay({ obdConnected, speed }) {
  const speedThreshold = 120;
  const [displaySpeed, setDisplaySpeed] = useState(0);
  const [pulse, setPulse] = useState(false);
  const displayRef = useRef(0);
  const isHighSpeed = displaySpeed >= speedThreshold;
  const isDevMode = process.env.REACT_APP_DEV_MODE === 'true';

  useEffect(() => {
    const from = displayRef.current;
    const to = Math.max(0, speed);
    const duration = 400;
    const start = performance.now();
    let raf;
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = easeOutCubic(t);
      const val = from + (to - from) * eased;
      setDisplaySpeed(val);
      displayRef.current = val;
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    if (Math.abs(to - from) > 5) {
      setPulse(true);
      const tid = setTimeout(() => setPulse(false), 300);
      return () => { cancelAnimationFrame(raf); clearTimeout(tid); };
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
