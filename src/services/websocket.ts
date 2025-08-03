import { io, Socket } from 'socket.io-client';
import { Order, OrderStatus } from '@/types';

export interface WebSocketCallbacks {
  onNewOrder?: (order: Order) => void;
  onOrderStatusUpdate?: (order: Order, status: OrderStatus) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
}

class TimingWebSocketClient {
  private socket: Socket | null = null;
  private baseUrl: string;
  private token: string | null = null;
  private callbacks: WebSocketCallbacks = {};

  constructor() {
    // Get base URL from environment or default to localhost
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    // Use the base URL without any path modifications for Socket.IO
    this.baseUrl = apiUrl.replace('/api', '');
  }

  setCallbacks(callbacks: WebSocketCallbacks) {
    this.callbacks = callbacks;
  }

  async connect() {
    try {
      // Get current token from localStorage
      this.token = localStorage.getItem('token');
      
      if (!this.token) {
        console.error('❌ No authentication token found');
        this.callbacks.onError?.(new Error('No authentication token found'));
        return;
      }

      const wsUrl = `${this.baseUrl}/admin`;
      console.log('🔌 Connecting to Socket.IO admin namespace:', wsUrl);
      console.log('🔑 Using token:', this.token.substring(0, 20) + '...');
      
      // Connect to the admin namespace with authentication
      this.socket = io(wsUrl, {
        auth: {
          token: this.token
        },
        query: {
          token: this.token  // Fallback for backend compatibility
        },
        transports: ['websocket', 'polling'],
        timeout: 10000
      });
      
      this.socket.on('connect', () => {
        console.log('✅ Socket.IO connected to admin namespace');
        console.log('🆔 Socket ID:', this.socket?.id);
        this.callbacks.onConnect?.();
      });
      
      this.socket.on('disconnect', (reason) => {
        console.log('🔌 Socket.IO disconnected:', reason);
        this.callbacks.onDisconnect?.();
      });
      
      this.socket.on('connect_error', (error) => {
        console.error('❌ Socket.IO connection error:', error);
        console.error('Error details:', error.message);
        this.callbacks.onError?.(error);
      });
      
      // Listen for order events
      this.socket.on('new_order', (data) => {
        console.log('New order received:', data);
        if (data.order) {
          this.callbacks.onNewOrder?.(data.order);
        }
      });
      
      this.socket.on('order_status_update', (data) => {
        console.log('Order status update received:', data);
        if (data.order) {
          this.callbacks.onOrderStatusUpdate?.(data.order, data.order.status);
        }
      });
      
      this.socket.on('connected', (data) => {
        console.log('Connection confirmed:', data);
      });
      
    } catch (error) {
      console.error('Failed to connect Socket.IO:', error);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected === true;
  }

  getConnectionStatus(): 'connecting' | 'connected' | 'disconnected' | 'error' {
    if (!this.socket) return 'disconnected';
    
    if (this.socket.connected) {
      return 'connected';
    } else if (this.socket.disconnected) {
      return 'disconnected';
    } else {
      return 'connecting';
    }
  }
}

export const timingWebSocket = new TimingWebSocketClient();