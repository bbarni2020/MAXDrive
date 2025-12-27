import React, { useEffect, useRef, useState } from 'react';
import '../styles/RPMGauge.css';

function RPMGauge({ rpm = 0 }) {
  const maxRPM = 7000;
  const redlineRPM = 6000;
  const [displayRpm, setDisplayRpm] = useState(0);
  const fromRef = useRef(0);
  const toRef = useRef(0);
  const startRef = useRef(0);
  const duration = 500;

  useEffect(() => {
    fromRef.current = displayRpm;
    toRef.current = Math.max(0, Math.min(rpm, maxRPM));
    startRef.current = performance.now();

    let raf;
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
    const step = (now) => {
      const elapsed = now - startRef.current;
      const t = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(t);
      const val = fromRef.current + (toRef.current - fromRef.current) * eased;
      setDisplayRpm(val);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [rpm]);

  const angle = (displayRpm / maxRPM) * 180;
  const isRedline = displayRpm >= redlineRPM;

  return (
    <div className="rpm-gauge">
      <svg viewBox="0 0 200 120" className="rpm-svg">
        <defs>
          <linearGradient id="rpmGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8E9399" />
            <stop offset={`${(redlineRPM / maxRPM) * 100}%`} stopColor="#B1121A" />
            <stop offset={`${(redlineRPM / maxRPM) * 100}%`} stopColor="#E11D2E" />
            <stop offset="100%" stopColor="#E11D2E" />
          </linearGradient>
        </defs>
        
        <path
          d="M 30 110 A 80 80 0 0 1 170 110"
          fill="none"
          stroke="#14161A"
          strokeWidth="12"
          strokeLinecap="round"
        />
        
        <path
          d="M 30 110 A 80 80 0 0 1 170 110"
          fill="none"
          stroke="url(#rpmGradient)"
          strokeWidth="12"
          strokeDasharray={`${(angle / 180) * 251} 251`}
          strokeLinecap="round"
          opacity={rpm > 0 ? 1 : 0.3}
          className={isRedline ? 'rpm-arc redline' : 'rpm-arc'}
        />


        <text 
          x="100" 
          y="95" 
          textAnchor="middle" 
          fontSize="32" 
          fontWeight="600" 
          fill={isRedline ? '#E11D2E' : '#B5B8BD'}
        >
          {Math.round(displayRpm / 100) / 10}
        </text>
        <text 
          x="100" 
          y="110" 
          textAnchor="middle" 
          fontSize="11" 
          fill="#8E9399"
          letterSpacing="1"
        >
          RPM × 1000
        </text>
      </svg>
    </div>
  );
}

export default RPMGauge;
