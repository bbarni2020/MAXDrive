import { Geolocation } from '@capacitor/geolocation';

class GPSConnector {
  constructor() {
    this.speed = 0;
    this.connected = false;
    this.callbacks = [];
    this.watchId = null;
    this.lastPosition = null;
    this.lastTimestamp = null;
  }

  async connect() {
    try {
      const permission = await Geolocation.checkPermissions();
      if (permission.location !== 'granted') {
        await Geolocation.requestPermissions();
      }

      this.watchId = await Geolocation.watchPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 1000
      }, (position, err) => {
        if (err) {
          this.connected = false;
          this.speed = 0;
          this.notifyCallbacks();
          return;
        }

        this.connected = true;
        this.calculateSpeed(position);
        this.notifyCallbacks();
      });

    } catch (error) {
      this.connected = false;
      this.speed = 0;
      this.notifyCallbacks();
    }
  }

  calculateSpeed(position) {
    if (!this.lastPosition) {
      this.lastPosition = position;
      this.lastTimestamp = position.timestamp;
      return;
    }

    const distance = this.getDistance(
      this.lastPosition.coords.latitude,
      this.lastPosition.coords.longitude,
      position.coords.latitude,
      position.coords.longitude
    );

    const timeDiff = (position.timestamp - this.lastTimestamp) / 1000;
    const speedMps = distance / timeDiff;
    this.speed = Math.round(speedMps * 3.6);

    this.lastPosition = position;
    this.lastTimestamp = position.timestamp;
  }

  getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  disconnect() {
    if (this.watchId) {
      Geolocation.clearWatch({ id: this.watchId });
      this.watchId = null;
    }
    this.connected = false;
    this.speed = 0;
    this.notifyCallbacks();
  }

  subscribe(callback) {
    this.callbacks.push(callback);
  }

  unsubscribe(callback) {
    this.callbacks = this.callbacks.filter(cb => cb !== callback);
  }

  notifyCallbacks() {
    this.callbacks.forEach(callback => callback({
      speed: this.speed,
      connected: this.connected
    }));
  }
}

const gpsConnector = new GPSConnector();
export default gpsConnector;