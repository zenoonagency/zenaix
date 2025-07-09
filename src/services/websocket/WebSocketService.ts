import { EventEmitter } from './EventEmitter';

export class WebSocketService extends EventEmitter {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectDelay = 3000;
  private pingInterval: number | null = null;
  private isConnecting = false;
  private connectionTimeout: number | null = null;
  private shouldReconnect = true;
  private readonly debug: boolean;
  private readonly mockMode: boolean;

  constructor(
    private readonly url: string,
    private readonly options: {
      pingInterval?: number;
      maxReconnectAttempts?: number;
      reconnectDelay?: number;
      connectionTimeout?: number;
      debug?: boolean;
      mockMode?: boolean;
    } = {}
  ) {
    super();
    this.maxReconnectAttempts = options.maxReconnectAttempts || 5;
    this.reconnectDelay = options.reconnectDelay || 3000;
    this.debug = options.debug || false;
    this.mockMode = options.mockMode || false;
  }

  private log(...args: any[]) {
    // Log disabled for production
  }

  private error(...args: any[]) {
    // Error log disabled for production
  }

  connect() {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    if (this.mockMode) {
      this.simulateMockConnection();
      return;
    }

    this.isConnecting = true;
    this.clearConnectionTimeout();
    this.shouldReconnect = true;

    try {
      this.ws = new WebSocket(this.url);

      this.connectionTimeout = window.setTimeout(() => {
        if (this.ws?.readyState !== WebSocket.OPEN) {
          this.ws?.close();
          this.handleReconnect();
        }
      }, this.options.connectionTimeout || 10000);

      this.ws.onopen = () => {
        this.log('Connected');
        this.clearConnectionTimeout();
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.startPingInterval();
        this.emit('connected');
      };

      this.ws.onclose = (event) => {
        this.log('Disconnected', event.code, event.reason);
        this.clearConnectionTimeout();
        this.isConnecting = false;
        this.clearPingInterval();
        
        if (this.shouldReconnect && event.code !== 1000) {
          this.handleReconnect();
        }
        
        this.emit('disconnected');
      };

      this.ws.onerror = (error) => {
        if (this.shouldReconnect) {
          this.error('Connection error:', error);
        }
        this.clearConnectionTimeout();
        this.isConnecting = false;
        this.emit('error', error);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit('message', data);
        } catch (error) {
          this.error('Failed to parse message:', error);
        }
      };
    } catch (error) {
      if (this.shouldReconnect) {
        this.error('Failed to establish connection:', error);
      }
      this.clearConnectionTimeout();
      this.isConnecting = false;
      this.handleReconnect();
    }
  }

  private simulateMockConnection() {
    this.log('Using mock WebSocket connection');
    setTimeout(() => {
      this.emit('connected');
      this.startPingInterval();
    }, 100);
  }

  private clearConnectionTimeout() {
    if (this.connectionTimeout !== null) {
      window.clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
  }

  private handleReconnect() {
    if (!this.shouldReconnect) return;

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      this.log(`Reconnecting (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
      setTimeout(() => this.connect(), delay);
    } else {
      this.log('Max reconnection attempts reached');
      this.emit('reconnect_failed');
    }
  }

  private startPingInterval() {
    if (this.options.pingInterval) {
      this.pingInterval = window.setInterval(() => {
        if (this.mockMode) {
          this.emit('pong');
          return;
        }

        if (this.ws?.readyState === WebSocket.OPEN) {
          this.send({ type: 'ping' });
        }
      }, this.options.pingInterval);
    }
  }

  private clearPingInterval() {
    if (this.pingInterval !== null) {
      window.clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  send(data: any): boolean {
    if (this.mockMode) {
      this.log('Mock mode: simulating message send', data);
      return true;
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(data));
        return true;
      } catch (error) {
        this.error('Failed to send message:', error);
        return false;
      }
    }
    return false;
  }

  disconnect() {
    this.shouldReconnect = false;
    this.clearPingInterval();
    this.clearConnectionTimeout();
    if (this.ws) {
      this.ws.close(1000, 'Closed by client');
      this.ws = null;
    }
  }

  get isConnected(): boolean {
    if (this.mockMode) return true;
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Create singleton instance with improved configuration
export const webSocketService = new WebSocketService(
  'wss://zenoon-agency-n8n.htm57w.easypanel.host/ws',
  {
    pingInterval: 300000,
    maxReconnectAttempts: 5,
    reconnectDelay: 3000,
    connectionTimeout: 10000,
    debug: true,
    mockMode: process.env.NODE_ENV === 'development', // Enable mock mode in development
  }
);