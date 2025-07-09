import { EventEmitter } from './EventEmitter';

interface WebSocketMessage {
  action: string;
  data: any;
}

export class EvolutionWebSocket extends EventEmitter {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectDelay = 3000;
  private pingInterval: number | null = null;

  constructor(private readonly url: string = 'wss://zenoon-agency-n8n.htm57w.easypanel.host/ws') {
    super();
  }

  connect() {
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.startPingInterval();
        this.emit('connected');
      };

      this.ws.onclose = () => {
        this.clearPingInterval();
        this.handleReconnect();
        this.emit('disconnected');
      };

      this.ws.onerror = (error) => {
        console.error('Evolution WebSocket error:', error);
        this.emit('error', error);
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
    } catch (error) {
      console.error('Failed to establish WebSocket connection:', error);
      this.handleReconnect();
    }
  }

  private handleMessage(message: WebSocketMessage) {
    switch (message.action) {
      case 'message':
        this.emit('message', message.data);
        break;
      case 'status':
        this.emit('status', message.data);
        break;
      case 'qr':
        this.emit('qr', message.data);
        break;
      default:
        console.warn('Unknown message action:', message.action);
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => this.connect(), this.reconnectDelay);
    } else {
      this.emit('reconnect_failed');
    }
  }

  private startPingInterval() {
    this.pingInterval = window.setInterval(() => {
      this.send({ action: 'ping' });
    }, 300000);
  }

  private clearPingInterval() {
    if (this.pingInterval !== null) {
      window.clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  disconnect() {
    this.clearPingInterval();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Create a singleton instance
export const evolutionWebSocket = new EvolutionWebSocket();