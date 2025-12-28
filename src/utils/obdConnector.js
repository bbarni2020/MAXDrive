class OBDConnector {
  constructor() {
    this.connected = false;
    this.socket = null;
    this.speed = 0;
    this.rpm = 0;
    this.callbacks = [];
    this.devMode = process.env.REACT_APP_DEV_MODE === 'true';
    this.devInterval = null;
    this.androidBridgeAvailable = typeof window !== 'undefined' && typeof window.Android !== 'undefined';
    this._onOBDData = null;
  }

  startDevMode() {
    this.connected = true;
    this.notifyCallbacks();
    if (this.devInterval) clearInterval(this.devInterval);
    this.devInterval = setInterval(() => {
      const currentSpeed = this.speed;
      const change = (Math.random() - 0.5) * 15;
      let newSpeed = currentSpeed + change;
      newSpeed = Math.max(0, Math.min(200, newSpeed));
      if (Math.random() > 0.8) {
        newSpeed = Math.random() * 60;
      }
      this.speed = Math.round(newSpeed);
      // Simulate RPM as 800-4000 based on speed
      this.rpm = Math.round(800 + this.speed * 20 + Math.random() * 200);
      this.notifyCallbacks();
    }, 800);
  }

  stopDevMode() {
    if (this.devInterval) {
      clearInterval(this.devInterval);
      this.devInterval = null;
    }
    this.connected = false;
    this.speed = 0;
    this.notifyCallbacks();
  }

  connect(host = 'localhost', port = 35000) {
    if (this.devMode) {
      this.startDevMode();
      return;
    }

    if (this.androidBridgeAvailable && window.Android && window.Android.startObd) {
      try {
        const started = window.Android.startObd('');
        if (started) {
          this.connected = true;
          this.setupAndroidCallback();
          this.notifyCallbacks();
          return;
        }
      } catch (e) {}
    }

    try {
      const wsUrl = `ws://${host}:${port}`;
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.connected = true;
        this.notifyCallbacks();
      };

      this.socket.onmessage = (event) => {
        this.parseOBDData(event.data);
      };

      this.socket.onerror = (error) => {
        this.connected = false;
        this.notifyCallbacks();
      };

      this.socket.onclose = () => {
        this.connected = false;
        this.notifyCallbacks();
        setTimeout(() => this.connect(host, port), 5000);
      };
    } catch (error) {
      console.warn('OBD Connection failed:', error);
    }
  }

  setupAndroidCallback() {
    if (this._onOBDData) return;
    this._onOBDData = (payload) => {
      try {
        this.parseOBDData(payload);
      } catch (e) {}
    };
    window.onOBDData = this._onOBDData;
  }

  parseOBDData(data) {
    try {
      const parsed = JSON.parse(data);
      if (parsed.speed !== undefined) {
        this.speed = parseFloat(parsed.speed);
      }
      if (parsed.rpm !== undefined) {
        this.rpm = parseFloat(parsed.rpm);
      }
      this.notifyCallbacks();
    } catch (e) {
      const speedMatch = data.match(/speed[:\s]+(\d+\.?\d*)/i);
      if (speedMatch) {
        this.speed = parseFloat(speedMatch[1]);
      }
      const rpmMatch = data.match(/rpm[:\s]+(\d+\.?\d*)/i);
      if (rpmMatch) {
        this.rpm = parseFloat(rpmMatch[1]);
      }
      this.notifyCallbacks();
    }
  }

  requestSpeed() {
    if (this.connected && this.socket) {
      this.socket.send(JSON.stringify({ command: 'SPEED' }));
    }
  }

  stopAndroid() {
    if (this.androidBridgeAvailable && window.Android && window.Android.stopObd) {
      try { window.Android.stopObd(); } catch (e) {}
    }
    if (this._onOBDData) {
      try { delete window.onOBDData; } catch (e) {}
      this._onOBDData = null;
    }
    this.connected = false;
    this.notifyCallbacks();
  }

  subscribe(callback) {
    this.callbacks.push(callback);
  }

  unsubscribe(callback) {
    this.callbacks = this.callbacks.filter(cb => cb !== callback);
  }

  notifyCallbacks() {
    this.callbacks.forEach(cb => cb({
      connected: this.connected,
      speed: this.speed,
      rpm: this.rpm
    }));
  }

  disconnect() {
    if (this.devMode) {
      this.stopDevMode();
    }
    if (this.androidBridgeAvailable) {
      this.stopAndroid();
    }
    if (this.socket) {
      this.socket.close();
    }
  }

  getSpeed() {
    return this.speed;
  }

  getRPM() {
    return this.rpm;
  }

  isConnected() {
    return this.connected;
  }
}

const obdConnector = new OBDConnector();

export default obdConnector;
