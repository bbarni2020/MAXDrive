import React from 'react';
import '../styles/UpdateBanner.css';

function UpdateBanner({ version, onUpdate }) {
  return (
    <div className="update-banner">
      <span className="update-text">Update available</span>
      <span className="update-version">{version}</span>
      <button className="update-button" onClick={onUpdate}>Update</button>
    </div>
  );
}

export default UpdateBanner;
