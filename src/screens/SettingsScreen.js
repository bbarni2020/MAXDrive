import React, { useState, useEffect } from 'react';
import { checkForUpdate, performUpdate } from '../utils/updater';
import UpdateBanner from '../components/UpdateBanner';
import '../styles/SettingsScreen.css';
import obdConnector from '../utils/obdConnector';
import gpsConnector from '../utils/gpsConnector';
import androidBridge from '../utils/androidBridge';

function SettingsScreen({ onNavigate }) {
  const [recording, setRecording] = useState(false);
  const [obdLogs, setObdLogs] = useState([]);
  const [gpsRecording, setGpsRecording] = useState(false);
  const [gpsLogs, setGpsLogs] = useState([]);
  const [version, setVersion] = useState('');
  const [updateInfo, setUpdateInfo] = useState(null);
  const [updating, setUpdating] = useState(false);
  useEffect(() => {
    let mounted = true;
    (async () => {
      const info = await checkForUpdate();
      if (mounted && info && info.available) setUpdateInfo(info);
    })();
    return () => { mounted = false; };
  }, []);
  const handleUpdate = async () => {
    if (!updateInfo?.apkUrl) return;
    setUpdating(true);
    try {
      await performUpdate(updateInfo.apkUrl);
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    if (!recording) return;

    const subscriber = (data) => {
      const entry = `${new Date().toISOString()} | connected:${data.connected} | speed:${data.speed} | rpm:${data.rpm}`;
      setObdLogs(prev => [...prev, entry]);
    };

    obdConnector.subscribe(subscriber);
    return () => obdConnector.unsubscribe(subscriber);
  }, [recording]);

  useEffect(() => {
    if (!gpsRecording) return;

    const subscriber = (data) => {
      const entry = `${new Date().toISOString()} | connected:${data.connected} | speed:${data.speed} | lat:${data.latitude.toFixed(6)} | lon:${data.longitude.toFixed(6)} | acc:${data.accuracy.toFixed(1)}m`;
      setGpsLogs(prev => [...prev, entry]);
    };

    gpsConnector.subscribe(subscriber);
    return () => gpsConnector.unsubscribe(subscriber);
  }, [gpsRecording]);

  const downloadTextFile = (filename, text) => {
    try {
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
    }
  };

  const handleToggleRecording = () => {
    if (recording) {
      setRecording(false);
    } else {
      setObdLogs([]);
      setRecording(true);
      if (!obdConnector.isConnected()) {
        try { obdConnector.connect(); } catch (e) {}
      }
    }
  };

  const handleSaveLogs = () => {
    if (obdLogs.length === 0) return;
    const text = obdLogs.join('\n');
    const filename = `maxdrive-obd-logs-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
    downloadTextFile(filename, text);
  };

  const handleToggleGpsRecording = () => {
    if (gpsRecording) {
      setGpsRecording(false);
      gpsConnector.disableTestMode();
    } else {
      setGpsLogs([]);
      setGpsRecording(true);
      gpsConnector.enableTestMode();
      if (!gpsConnector.connected) {
        try { gpsConnector.connect(); } catch (e) {}
      }
    }
  };

  const handleSaveGpsLogs = () => {
    if (gpsLogs.length === 0) return;
    const text = gpsLogs.join('\n');
    const filename = `maxdrive-gps-logs-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
    downloadTextFile(filename, text);
  };

  const handleExportVersion = async () => {
    try {
      const ver = await androidBridge.getAppVersion();
      setVersion(ver || '');
      const filename = `maxdrive-version-${new Date().toISOString().slice(0,10)}.txt`;
      downloadTextFile(filename, `version: ${ver}`);
    } catch (e) {
    }
  };

  const settingsOptions = [
    {
      id: 'app-assignments',
      title: 'App Assignments',
      icon: '🔗',
      description: 'Configure which apps open for Navigation, Radio, and CarPlay buttons',
      onClick: () => onNavigate('app-assignments')
    },
    {
      id: 'gps-test',
      title: 'GPS Test',
      icon: '📍',
      description: 'Test GPS connection and view location data',
      onClick: () => {}
    },
    {
      id: 'obd-logs',
      title: 'OBD Logs',
      icon: '📟',
      description: 'Record and save raw OBD data stream',
      onClick: () => {}
    },
    {
      id: 'version-export',
      title: 'Version',
      icon: '🔖',
      description: 'Write out current app version from Android',
      onClick: handleExportVersion
    }
  ];

  return (
    <div className="settings-screen">
      {updateInfo && updateInfo.available && (
        <UpdateBanner version={updateInfo.latest} onUpdate={handleUpdate} />
      )}
      <div className="settings-header">
        <button
          className="back-button"
          onClick={() => onNavigate('home')}
        >
          <span className="back-icon">←</span>
          <span className="back-label">Home</span>
        </button>
        <h1 className="settings-title">Settings</h1>
      </div>

      <div className="settings-content">
        <div className="settings-grid">
          {settingsOptions.map((option) => (
            <div
              key={option.id}
              className="settings-card"
              onClick={() => {
                if (option.id === 'obd-logs' || option.id === 'gps-test') return;
                option.onClick && option.onClick();
              }}
            >
              <div className="settings-icon">{option.icon}</div>
              <div className="settings-content">
                <h2 className="settings-card-title">{option.title}</h2>
                <p className="settings-description">{option.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="settings-controls">
          <div className="control-panel">
            <div className="panel-header">
              <div className="panel-title">OBD Logs</div>
              <div className="panel-actions">
                <button className="action-button" onClick={handleToggleRecording}>
                  {recording ? 'Stop' : 'Start'}
                </button>
                <button className="action-button secondary" onClick={handleSaveLogs} disabled={obdLogs.length === 0}>
                  Save
                </button>
              </div>
            </div>
            <div className="logs-container">
              <div className="logs-content">
                {obdLogs.length === 0 ? (
                  <div className="no-data">No logs recorded</div>
                ) : (
                  obdLogs.slice(-50).map((l, i) => (
                    <div key={i} className="log-line">{l}</div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="control-panel">
            <div className="panel-header">
              <div className="panel-title">GPS Test</div>
              <div className="panel-actions">
                <button className="action-button" onClick={handleToggleGpsRecording}>
                  {gpsRecording ? 'Stop' : 'Start'}
                </button>
                <button className="action-button secondary" onClick={handleSaveGpsLogs} disabled={gpsLogs.length === 0}>
                  Save
                </button>
              </div>
            </div>
            <div className="logs-container">
              <div className="logs-content">
                {gpsLogs.length === 0 ? (
                  <div className="no-data">No GPS data recorded</div>
                ) : (
                  gpsLogs.slice(-50).map((l, i) => (
                    <div key={i} className="log-line">{l}</div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="control-panel">
            <div className="panel-header">
              <div className="panel-title">Version</div>
              <div className="panel-actions">
                <button className="action-button" onClick={handleExportVersion}>
                  Export
                </button>
                {updateInfo && updateInfo.available && (
                  <button className="action-button update" onClick={handleUpdate} disabled={updating}>
                    {updating ? 'Updating...' : 'Update'}
                  </button>
                )}
              </div>
            </div>
            <div className="version-info">
              <span className="version-text">{version ? `v${version}` : 'Loading...'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsScreen;