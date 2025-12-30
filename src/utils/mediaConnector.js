import androidBridge from './androidBridge';

class MediaConnector {
  constructor() {
    this.currentMedia = null;
    this.callbacks = [];
    this.interval = null;
  }

  connect() {
    this.interval = setInterval(() => {
      const media = androidBridge.getCurrentMedia();
      if (media && (JSON.stringify(media) !== JSON.stringify(this.currentMedia))) {
        this.currentMedia = media;
        this.notifyCallbacks();
      }
    }, 1000);
  }

  disconnect() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.currentMedia = null;
  }

  subscribe(callback) {
    this.callbacks.push(callback);
  }

  unsubscribe(callback) {
    this.callbacks = this.callbacks.filter(cb => cb !== callback);
  }

  notifyCallbacks() {
    this.callbacks.forEach(callback => callback(this.currentMedia));
  }
}

const mediaConnector = new MediaConnector();
export default mediaConnector;