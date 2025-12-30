import React from 'react';
import '../styles/MusicDisplay.css';

function MusicDisplay({ currentMedia, carplayApp }) {
  const hasMedia = currentMedia && (currentMedia.title || currentMedia.artist);
  const title = hasMedia ? (currentMedia.title || 'Unknown Track') : 'CarPlay';
  const artist = hasMedia ? (currentMedia.artist || '') : '';

  const handleClick = () => {
    if (!hasMedia && carplayApp) {
      window.Android?.launchApp(carplayApp);
    }
  };

  return (
    <div className={`music-display ${!hasMedia ? 'clickable' : ''}`} onClick={handleClick}>
      <div className="music-info">
        <div className="music-title">{title}</div>
        {artist && <div className="music-artist">{artist}</div>}
      </div>
    </div>
  );
}

export default MusicDisplay;