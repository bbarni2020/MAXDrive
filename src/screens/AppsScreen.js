import React, { useState, useEffect, useCallback } from 'react';
import AppCard from '../components/AppCard';
import androidBridge from '../utils/androidBridge';
import '../styles/AppsScreen.css';

function AppsScreen({ onNavigate }) {
  const [allApps, setAllApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [error, setError] = useState(null);

  const loadApps = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apps = await androidBridge.getInstalledApps();
      const filteredApps = Array.isArray(apps) ? apps.filter(app => app.packageName !== 'com.maxdrive.app') : [];
      setAllApps(filteredApps.sort((a, b) => (a.name || '').localeCompare(b.name || '')));
    } catch (err) {
      setError('Failed to load apps');
      setAllApps([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApps();
  }, [loadApps]);

  const filteredApps = allApps;

  const pageSize = 8;
  const pageCount = Math.max(1, Math.ceil(filteredApps.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const start = currentPage * pageSize;
  const end = start + pageSize;
  const pagedApps = filteredApps.slice(start, end);

  const nextPage = () => setPage(p => Math.min(p + 1, pageCount - 1));
  const prevPage = () => setPage(p => Math.max(p - 1, 0));
  const goToPage = (idx) => setPage(Math.max(0, Math.min(idx, pageCount - 1)));

  const handleAppClick = useCallback((app) => {
    if (app?.packageName) {
      androidBridge.launchApp(app.packageName);
    }
  }, []);

  return (
    <div className="apps-screen">
      <div className="apps-header">
        <button 
          className="back-button"
          onClick={() => onNavigate('home')}
        >
          <span className="back-icon">←</span>
          <span className="back-label">Home</span>
        </button>
        <h1 className="apps-title">Applications</h1>
      </div>

      {/* Search removed */}

      <div className="apps-grid">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading apps...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
            <button onClick={loadApps} className="retry-button">Retry</button>
          </div>
        ) : pagedApps.length > 0 ? (
          pagedApps.map((app) => (
            <AppCard key={app.packageName} app={app} onClick={handleAppClick} />
          ))
        ) : (
          <div className="no-results">
            <p>No apps found</p>
          </div>
        )}
      </div>

      {!loading && filteredApps.length > 0 && (
        <div className="pager">
          <button className="pager-button" onClick={prevPage} disabled={currentPage === 0}>◀</button>
          <div className="pager-dots">
            {Array.from({ length: pageCount }).map((_, i) => (
              <button
                key={i}
                className={`pager-dot ${i === currentPage ? 'active' : ''}`}
                onClick={() => goToPage(i)}
                aria-label={`Go to page ${i + 1}`}
              />
            ))}
          </div>
          <button className="pager-button" onClick={nextPage} disabled={currentPage === pageCount - 1}>▶</button>
        </div>
      )}
    </div>
  );
}

export default AppsScreen;
