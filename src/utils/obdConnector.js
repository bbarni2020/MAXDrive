class OBDConnector {
  constructor() {
    this.connected = false;
    this.socket = null;
    this.speed = 0;
    this.callbacks = [];
    this.devMode = process.env.REACT_APP_DEV_MODE === 'true';
    this.devInterval = null;
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

    try {
      const wsUrl = `ws://${host}:${port}`;
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.connected = true;
        console.log('OBD Connected');
        this.notifyCallbacks();
      };

      this.socket.onmessage = (event) => {
        this.parseOBDData(event.data);
      };

      this.socket.onerror = (error) => {
        console.warn('OBD Connection Error:', error);
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

  parseOBDData(data) {
    try {
      const parsed = JSON.parse(data);
      
      if (parsed.speed !== undefined) {
        this.speed = parseFloat(parsed.speed);
      } else if (parsed.rpm !== undefined) {
        this.notifyCallbacks();
      }
      
      this.notifyCallbacks();
    } catch (e) {
      const speedMatch = data.match(/speed[:\s]+(\d+\.?\d*)/i);
      if (speedMatch) {
        this.speed = parseFloat(speedMatch[1]);
        this.notifyCallbacks();
      }
    }
  }

  requestSpeed() {
    if (this.connected && this.socket) {
      this.socket.send(JSON.stringify({ command: 'SPEED' }));
    }
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
      speed: this.speed
    }));
  }

  disconnect() {
    if (this.devMode) {
      this.stopDevMode();
    }
    if (this.socket) {
      this.socket.close();
    }
  }

  getSpeed() {
    return this.speed;
  }

  isConnected() {
    return this.connected;
  }
}

const obdConnector = new OBDConnector();

export default obdConnector;
