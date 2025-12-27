import React, { useState, useEffect } from 'react';
import Car3D from '../components/Car3D';
import SpeedDisplay from '../components/SpeedDisplay';
import RPMGauge from '../components/RPMGauge';
import obdConnector from '../utils/obdConnector';
import { checkForUpdate } from '../utils/updater';
import UpdateBanner from '../components/UpdateBanner';
import AppsOverlay from '../components/AppsOverlay';import androidBridge from '../utils/androidBridge';import '../styles/HomeScreen.css';
import { FaMapMarkedAlt, FaBroadcastTower, FaCar, FaThLarge } from 'react-icons/fa';

function HomeScreen({ onNavigate, onStartUpdate }) {
  const [speed, setSpeed] = useState(0);
  const [rpm, setRPM] = useState(0);
  const [obdConnected, setObdConnected] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [showAppsOverlay, setShowAppsOverlay] = useState(false);
  const [appAssignments, setAppAssignments] = useState({
    navigation: null,
    radio: null,
    carplay: null
  });

  useEffect(() => {
    obdConnector.connect();

    const handleOBDUpdate = (data) => {
      setSpeed(data.speed);
      setObdConnected(data.connected);
      setRPM(data.rpm !== undefined ? data.rpm : 0);
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

  useEffect(() => {
    const savedAssignments = localStorage.getItem('appAssignments');
    if (savedAssignments) {
      try {
        setAppAssignments(JSON.parse(savedAssignments));
      } catch (err) {
        console.warn('Failed to parse app assignments:', err);
      }
    }
  }, []);

  const navItems = [
    { 
      id: 1, 
      name: 'Navigation', 
      icon: <FaMapMarkedAlt />, 
      action: () => appAssignments.navigation && androidBridge.launchApp(appAssignments.navigation)
    },
    { 
      id: 2, 
      name: 'Radio', 
      icon: <FaBroadcastTower />, 
      action: () => appAssignments.radio && androidBridge.launchApp(appAssignments.radio)
    },
    { 
      id: 3, 
      name: 'CarPlay', 
      icon: <FaCar />, 
      action: () => appAssignments.carplay && androidBridge.launchApp(appAssignments.carplay)
    },
    { id: 4, name: 'Apps', icon: <FaThLarge />, action: () => setShowAppsOverlay(true) },
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
          onUpdate={() => onStartUpdate(updateInfo.latest, updateInfo.apkUrl)}
        />
      )}

      {showAppsOverlay && (
        <AppsOverlay onClose={() => setShowAppsOverlay(false)} onNavigate={onNavigate} />
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
