import React, { useState, useEffect } from 'react';
import { checkForUpdate, performUpdate } from '../utils/updater';
import UpdateBanner from '../components/UpdateBanner';
import '../styles/SettingsScreen.css';
import obdConnector from '../utils/obdConnector';
import androidBridge from '../utils/androidBridge';

function SettingsScreen({ onNavigate }) {
  const [recording, setRecording] = useState(false);
  const [obdLogs, setObdLogs] = useState([]);
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

      <div className="settings-grid">
        {settingsOptions.map((option) => (
          <div
            key={option.id}
            className="settings-card"
            onClick={() => {
              if (option.id === 'obd-logs') return;
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
        <div className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="panel-title">OBD Logs</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="update-button" onClick={handleToggleRecording}>{recording ? 'Stop' : 'Start'} Recording</button>
              <button className="cancel-button" onClick={handleSaveLogs} disabled={obdLogs.length === 0}>Save Logs</button>
            </div>
          </div>
          <div className="logs-container" style={{ height: 160 }}>
            <div className="logs-header">OBD stream</div>
            <div className="logs-content" style={{ padding: 8, overflowY: 'auto', fontFamily: 'monospace', fontSize: 12 }}>
              {obdLogs.length === 0 ? (
                <div style={{ color: '#8e9399' }}>No logs recorded</div>
              ) : (
                obdLogs.slice(-200).map((l, i) => (
                  <div key={i} className="log-line info">{l}</div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">Version</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="update-button" onClick={handleExportVersion}>Export Version</button>
            <div style={{ color: '#8e9399' }}>{version ? `v${version}` : ''}</div>
            {updateInfo && updateInfo.available && (
              <button className="update-button" onClick={handleUpdate} disabled={updating} style={{ marginLeft: 8 }}>
                {updating ? 'Updating...' : 'Update'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsScreen;