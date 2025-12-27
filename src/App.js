import { useState } from 'react';
import HomeScreen from './screens/HomeScreen';
import SettingsScreen from './screens/SettingsScreen';
import AppAssignmentsScreen from './screens/AppAssignmentsScreen';
import UpdateScreen from './screens/UpdateScreen';
import UpdateActivity from './components/UpdateActivity';
import './App.css';

function App() {
  const [activeScreen, setActiveScreen] = useState('home');
  const [updateData, setUpdateData] = useState(null);
  const [updateMinimized, setUpdateMinimized] = useState(false);
  const [updateProgress, setUpdateProgress] = useState({ progress: 0, status: 'preparing' });

  const handleStartUpdate = (version, apkUrl) => {
    setUpdateData({ version, apkUrl });
    setActiveScreen('update');
    setUpdateMinimized(false);
  };

  const handleUpdateCancel = () => {
    setUpdateData(null);
    setUpdateMinimized(false);
    setActiveScreen('home');
  };

  const handleUpdateComplete = () => {
    setUpdateData(null);
    setUpdateMinimized(false);
    setActiveScreen('home');
  };

  const handleMinimize = () => {
    setUpdateMinimized(true);
    setActiveScreen('home');
  };

  const handleExpand = () => {
    setUpdateMinimized(false);
    setActiveScreen('update');
  };

  const handleProgressUpdate = (progress, status) => {
    setUpdateProgress({ progress, status });
  };

  return (
    <div className="app-container">
      <div style={{ display: activeScreen === 'home' ? 'block' : 'none' }}>
        <HomeScreen onNavigate={setActiveScreen} onStartUpdate={handleStartUpdate} />
      </div>
      <div style={{ display: activeScreen === 'settings' ? 'block' : 'none' }}>
        <SettingsScreen onNavigate={setActiveScreen} />
      </div>
      <div style={{ display: activeScreen === 'app-assignments' ? 'block' : 'none' }}>
        <AppAssignmentsScreen onNavigate={setActiveScreen} />
      </div>
      {activeScreen === 'update' && updateData && !updateMinimized && (
        <UpdateScreen
          version={updateData.version}
          apkUrl={updateData.apkUrl}
          onCancel={handleUpdateCancel}
          onComplete={handleUpdateComplete}
          onMinimize={handleMinimize}
          onProgressUpdate={handleProgressUpdate}
        />
      )}
      {updateData && updateMinimized && (
        <UpdateActivity
          version={updateData.version}
          progress={updateProgress.progress}
          status={updateProgress.status}
          onExpand={handleExpand}
        />
      )}
    </div>
  );
}

export default App;
