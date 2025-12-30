import { Geolocation } from '@capacitor/geolocation';

class GPSConnector {
  constructor() {
    this.speed = 0;
    this.connected = false;
    this.callbacks = [];
    this.watchId = null;
    this.retryTimeout = null;
    this.maxRetries = 3;
    this.retryCount = 0;
  }

  async connect() {
    try {
      const permission = await Geolocation.checkPermissions();
      if (permission.location !== 'granted') {
        const requestResult = await Geolocation.requestPermissions();
        if (requestResult.location !== 'granted') {
          this.handleDisconnect();
          return;
        }
      }

      this.watchId = await Geolocation.watchPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 2000
      }, (position, err) => {
        if (err) {
          this.handleError(err);
          return;
        }

        this.handlePosition(position);
      });

      this.connected = true;
      this.retryCount = 0;
      this.notifyCallbacks();
    } catch (error) {
      this.handleDisconnect();
    }
  }

  handlePosition(position) {
    this.retryCount = 0;

    if (position.coords.speed !== null && position.coords.speed >= 0) {
      this.speed = Math.round(position.coords.speed * 3.6);
    } else {
      this.calculateSpeed(position);
    }

    this.notifyCallbacks();
  }

  calculateSpeed(position) {
    if (!this.lastPosition || !this.lastTimestamp) {
      this.lastPosition = position;
      this.lastTimestamp = position.timestamp;
      return;
    }

    if (position.coords.accuracy > 50) {
      return;
    }

    const distance = this.haversineDistance(
      this.lastPosition.coords.latitude,
      this.lastPosition.coords.longitude,
      position.coords.latitude,
      position.coords.longitude
    );

    const timeDiff = (position.timestamp - this.lastTimestamp) / 1000;
    if (timeDiff > 0) {
      const speedMps = distance / timeDiff;
      if (speedMps >= 0 && speedMps < 83.33) {
        this.speed = Math.round(speedMps * 3.6);
      }
    }

    this.lastPosition = position;
    this.lastTimestamp = position.timestamp;
  }

  haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000;
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

  handleError(err) {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.retryTimeout = setTimeout(() => {
        this.reconnect();
      }, 2000 * this.retryCount);
    } else {
      this.handleDisconnect();
    }
  }

  reconnect() {
    this.disconnect();
    this.connect();
  }

  handleDisconnect() {
    this.connected = false;
    this.speed = 0;
    this.notifyCallbacks();
  }

  disconnect() {
    if (this.watchId) {
      Geolocation.clearWatch({ id: this.watchId });
      this.watchId = null;
    }
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
    this.handleDisconnect();
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