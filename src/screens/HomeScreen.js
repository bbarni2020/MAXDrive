import React, { useState, useEffect } from 'react';
import Car3D from '../components/Car3D';
import SpeedDisplay from '../components/SpeedDisplay';
import RPMGauge from '../components/RPMGauge';
import obdConnector from '../utils/obdConnector';
import { checkForUpdate, performUpdate } from '../utils/updater';
import UpdateBanner from '../components/UpdateBanner';
import '../styles/HomeScreen.css';

function HomeScreen({ onNavigate }) {
  const [speed, setSpeed] = useState(0);
  const [rpm, setRPM] = useState(0);
  const [obdConnected, setObdConnected] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);

  useEffect(() => {
    obdConnector.connect();

    const handleOBDUpdate = (data) => {
      setSpeed(data.speed);
      setObdConnected(data.connected);
      setRPM(data.speed * 35 + Math.random() * 200);
    };

    obdConnector.subscribe(handleOBDUpdate);

    return () => {
      obdConnector.unsubscribe(handleOBDUpdate);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const info = await checkForUpdate();
      if (mounted && info && info.available) setUpdateInfo(info);
    })();
    return () => { mounted = false; };
  }, []);

  const navItems = [
    { id: 1, name: 'Navigation', icon: '🗺' },
    { id: 2, name: 'Music', icon: '♫' },
    { id: 3, name: 'Phone', icon: '☎' },
    { id: 4, name: 'Apps', icon: '⊞', action: () => onNavigate('apps') },
  ];

  return (
    <div className="home-screen">
      <div className="dashboard-main">
        <div className="gauge-left">
          <RPMGauge rpm={rpm} />
        </div>

        <div className="car-center">
          <Car3D />
        </div>

        <div className="gauge-right">
          <SpeedDisplay obdConnected={obdConnected} speed={speed} />
        </div>
      </div>

      {updateInfo && updateInfo.available && (
        <UpdateBanner
          version={updateInfo.latest}
          onUpdate={() => performUpdate(updateInfo.apkUrl)}
        />
      )}

      <div className="nav-bar">
        {navItems.map(item => (
          <button 
            key={item.id}
            className="nav-item"
            onClick={item.action || null}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default HomeScreen;
