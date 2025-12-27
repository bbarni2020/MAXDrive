import { useState } from 'react';
import HomeScreen from './screens/HomeScreen';
import AppsScreen from './screens/AppsScreen';
import './App.css';

function App() {
  const [activeScreen, setActiveScreen] = useState('home');

  return (
    <div className="app-container">
      <div style={{ display: activeScreen === 'home' ? 'block' : 'none' }}>
        <HomeScreen onNavigate={setActiveScreen} />
      </div>
      <div style={{ display: activeScreen === 'apps' ? 'block' : 'none' }}>
        <AppsScreen onNavigate={setActiveScreen} />
      </div>
    </div>
  );
}

export default App;
