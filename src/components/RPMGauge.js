import React from 'react';
import '../styles/RPMGauge.css';

function RPMGauge({ rpm = 0 }) {
  const maxRPM = 7000;
  const redlineRPM = 6000;
  const angle = (rpm / maxRPM) * 180;
  const isRedline = rpm >= redlineRPM;

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
        />

        <text 
          x="100" 
          y="95" 
          textAnchor="middle" 
          fontSize="32" 
          fontWeight="600" 
          fill={isRedline ? '#E11D2E' : '#B5B8BD'}
        >
          {Math.round(rpm / 100) / 10}
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
