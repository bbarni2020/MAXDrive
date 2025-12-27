import { useState } from 'react';
import HomeScreen from './screens/HomeScreen';
import AppsScreen from './screens/AppsScreen';
import './App.css';

function App() {
  const [activeScreen, setActiveScreen] = useState('home');

  return (
    <div className="app-container">
      {activeScreen === 'home' && <HomeScreen onNavigate={setActiveScreen} />}
      {activeScreen === 'apps' && <AppsScreen onNavigate={setActiveScreen} />}
    </div>
  );
}

export default App;
