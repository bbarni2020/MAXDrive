class AndroidAppBridge {
  constructor() {
    this.isAndroid = typeof window !== 'undefined' && typeof window.Android !== 'undefined';
    this.apps = [];
    this.cacheTimestamp = 0;
    this.cacheDuration = 60000;
  }

  async getInstalledApps() {
    const now = Date.now();
    if (this.apps.length > 0 && (now - this.cacheTimestamp) < this.cacheDuration) {
      return this.apps;
    }

    if (this.isAndroid && window.Android?.getInstalledApps) {
      try {
        const appsJson = window.Android.getInstalledApps();
        const parsed = JSON.parse(appsJson);
        this.apps = Array.isArray(parsed) ? parsed.filter(app => app?.name && app?.packageName) : [];
        this.cacheTimestamp = now;
        return this.apps;
      } catch (error) {
        return this.getFallbackApps();
      }
    }
    
    return this.getFallbackApps();
  }

  launchApp(packageName) {
    if (!packageName) return;
    if (this.isAndroid && window.Android?.launchApp) {
      try {
        window.Android.launchApp(packageName);
      } catch (err) {
        return;
      }
    }
  }

  getFallbackApps() {
    return [
      { name: 'Phone', packageName: 'com.android.dialer', icon: '📞', category: 'Communication' },
      { name: 'Messages', packageName: 'com.android.messaging', icon: '💬', category: 'Communication' },
      { name: 'Maps', packageName: 'com.google.android.apps.maps', icon: '🗺️', category: 'Navigation' },
      { name: 'Music', packageName: 'com.android.music', icon: '♫', category: 'Media' },
      { name: 'Spotify', packageName: 'com.spotify.music', icon: '🎵', category: 'Media' },
      { name: 'YouTube', packageName: 'com.google.android.youtube', icon: '▶️', category: 'Media' },
      { name: 'Camera', packageName: 'com.android.camera', icon: '📷', category: 'Tools' },
      { name: 'Gallery', packageName: 'com.android.gallery3d', icon: '🖼️', category: 'Media' },
      { name: 'Settings', packageName: 'com.android.settings', icon: '⚙️', category: 'System' },
      { name: 'Chrome', packageName: 'com.android.chrome', icon: '🌐', category: 'Internet' },
      { name: 'Calendar', packageName: 'com.google.android.calendar', icon: '📅', category: 'Productivity' },
      { name: 'Contacts', packageName: 'com.android.contacts', icon: '👤', category: 'Communication' },
    ];
  }

  async getAppVersion() {
    if (this.isAndroid && window.Android?.getAppVersion) {
      try {
        const ver = window.Android.getAppVersion();
        console.log('[AndroidBridge] getAppVersion returned:', ver);
        return ver;
      } catch (e) {
        console.warn('[AndroidBridge] getAppVersion error:', e);
        return '';
      }
    }
    console.log('[AndroidBridge] getAppVersion: Not in Android WebView');
    return '';
  }

  async downloadAndInstallApk(url) {
    if (!url) return false;
    if (this.isAndroid && window.Android?.downloadAndInstallApk) {
      try {
        return window.Android.downloadAndInstallApk(url);
      } catch (err) {
        return false;
      }
    }
    try {
      window.open(url, '_blank');
      return true;
    } catch (err) {
      return false;
    }
  }
}

const androidBridge = new AndroidAppBridge();

export default androidBridge;
