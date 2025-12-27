class AndroidAppBridge {
  constructor() {
    this.isAndroid = typeof window.Android !== 'undefined';
    this.apps = [];
  }

  async getInstalledApps() {
    if (this.isAndroid && window.Android && window.Android.getInstalledApps) {
      try {
        const appsJson = window.Android.getInstalledApps();
        this.apps = JSON.parse(appsJson);
        return this.apps;
      } catch (error) {
        console.warn('Could not fetch Android apps:', error);
        return this.getFallbackApps();
      }
    }
    
    return this.getFallbackApps();
  }

  launchApp(packageName) {
    if (this.isAndroid && window.Android && window.Android.launchApp) {
      window.Android.launchApp(packageName);
    } else {
      console.warn('Cannot launch app:', packageName, '- not in Android WebView');
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
    if (this.isAndroid && window.Android && window.Android.getAppVersion) {
      try {
        return window.Android.getAppVersion();
      } catch (_) {
        return '';
      }
    }
    return '';
  }

  async downloadAndInstallApk(url) {
    if (this.isAndroid && window.Android && window.Android.downloadAndInstallApk) {
      try {
        return window.Android.downloadAndInstallApk(url);
      } catch (e) {
        console.warn('APK install failed:', e);
        return false;
      }
    }
    try {
      window.open(url, '_blank');
    } catch (_) {}
    return false;
  }
}

const androidBridge = new AndroidAppBridge();

export default androidBridge;
