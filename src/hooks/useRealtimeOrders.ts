import { useState, useEffect, useRef, useCallback } from 'react';
import { Order, OrderStatus } from '@/types';
import { timingWebSocket, WebSocketCallbacks } from '@/services/websocket';
import { apiService } from '@/services/api';
import { toast } from 'sonner';

export interface UseRealtimeOrdersOptions {
  enableNotifications?: boolean;
  autoConnect?: boolean;
  autoRefreshInterval?: number; // in seconds, 0 means disabled
}

export interface UseRealtimeOrdersReturn {
  orders: Order[];
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  newOrderNotification: Order | null;
  loading: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  refreshOrders: () => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  clearNewOrderNotification: () => void;
}

export const useRealtimeOrders = (options: UseRealtimeOrdersOptions = {}): UseRealtimeOrdersReturn => {
  const {
    enableNotifications = true,
    autoConnect = true,
    autoRefreshInterval = 0 // disabled by default
  } = options;

  const [orders, setOrders] = useState<Order[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [newOrderNotification, setNewOrderNotification] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectionCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clear notification after delay
  const clearNewOrderNotification = useCallback(() => {
    setNewOrderNotification(null);
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
      notificationTimeoutRef.current = null;
    }
  }, []);

  // Set notification with auto-clear
  const setNotificationWithTimeout = useCallback((order: Order) => {
    setNewOrderNotification(order);
    
    // Clear previous timeout if exists
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    
    // Set new timeout to clear notification after 5 seconds
    notificationTimeoutRef.current = setTimeout(() => {
      setNewOrderNotification(null);
    }, 5000);
  }, []);

  // Fetch orders from API
  const refreshOrders = useCallback(async () => {
    try {
      setError(null);
      const fetchedOrders = await apiService.getOrders();
      
      // Handle API response structure: { success: true, data: { orders: [...], count: ... } }
      let ordersArray: Order[] = [];
      if (fetchedOrders && typeof fetchedOrders === 'object') {
        const response = fetchedOrders as any;
        if (response.success && response.data) {
          if (Array.isArray(response.data.orders)) {
            ordersArray = response.data.orders;
          } else if (Array.isArray(response.data)) {
            ordersArray = response.data;
          }
        }
      } else if (Array.isArray(fetchedOrders)) {
        ordersArray = fetchedOrders;
      }
      
      setOrders(ordersArray);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError('Failed to fetch orders');
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  // Update order status via API
  const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus) => {
    try {
      await apiService.updateOrderStatus(orderId, status);
      
      // Optimistically update local state
      setOrders(prev => 
        prev.map(order => 
          order.id === orderId 
            ? { ...order, status, updated_at: new Date() }
            : order
        )
      );
      
      toast.success(`Order status updated to ${status}`);
    } catch (err) {
      console.error('Failed to update order status:', err);
      toast.error('Failed to update order status');
      throw err;
    }
  }, []);

  // WebSocket event handlers
  const handleNewOrder = useCallback((order: Order) => {
    console.log('New order received via WebSocket:', order);
    
    // Add to orders list
    setOrders(prev => {
      // Check if order already exists to avoid duplicates
      const exists = prev.some(existingOrder => existingOrder.id === order.id);
      if (exists) {
        return prev;
      }
      return [order, ...prev];
    });
    
    // Show notification
    if (enableNotifications) {
      setNotificationWithTimeout(order);
      toast.success(`New order #${order.id} received from ${order.customer_info.name}`);
    }
  }, [enableNotifications, setNotificationWithTimeout]);

  const handleOrderStatusUpdate = useCallback((order: Order, status: OrderStatus) => {
    console.log('Order status update received via WebSocket:', order.id, status);
    
    // Update order in list
    setOrders(prev => 
      prev.map(existingOrder => 
        existingOrder.id === order.id 
          ? { ...existingOrder, status, updated_at: new Date() }
          : existingOrder
      )
    );
    
    if (enableNotifications) {
      toast.info(`Order #${order.id} status updated to ${status}`);
    }
  }, [enableNotifications]);

  const handleConnect = useCallback(() => {
    console.log('WebSocket connected');
    setConnectionStatus('connected');
    setError(null);
  }, []);

  const handleDisconnect = useCallback(() => {
    console.log('WebSocket disconnected');
    setConnectionStatus('disconnected');
  }, []);

  const handleError = useCallback((error: Event) => {
    console.error('WebSocket error:', error);
    setConnectionStatus('error');
    setError('WebSocket connection error');
  }, []);

  // Connect to WebSocket
  const connect = useCallback(() => {
    setConnectionStatus('connecting');
    
    const callbacks: WebSocketCallbacks = {
      onNewOrder: handleNewOrder,
      onOrderStatusUpdate: handleOrderStatusUpdate,
      onConnect: handleConnect,
      onDisconnect: handleDisconnect,
      onError: handleError,
    };
    
    timingWebSocket.setCallbacks(callbacks);
    timingWebSocket.connect();
  }, [handleNewOrder, handleOrderStatusUpdate, handleConnect, handleDisconnect, handleError]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    timingWebSocket.disconnect();
    setConnectionStatus('disconnected');
  }, []);

  // Monitor connection status
  useEffect(() => {
    connectionCheckIntervalRef.current = setInterval(() => {
      const status = timingWebSocket.getConnectionStatus();
      setConnectionStatus(status);
    }, 1000);

    return () => {
      if (connectionCheckIntervalRef.current) {
        clearInterval(connectionCheckIntervalRef.current);
      }
    };
  }, []);

  // Auto refresh functionality
  useEffect(() => {
    if (autoRefreshInterval > 0) {
      console.log(`🔄 Setting up auto refresh every ${autoRefreshInterval} seconds`);
      autoRefreshIntervalRef.current = setInterval(() => {
        console.log('🔄 Auto refreshing orders...');
        refreshOrders();
      }, autoRefreshInterval * 1000);
    }

    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
        autoRefreshIntervalRef.current = null;
      }
    };
  }, [autoRefreshInterval, refreshOrders]);

  // Initial setup
  useEffect(() => {
    // Load initial orders
    refreshOrders();
    
    // Auto-connect if enabled
    if (autoConnect) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
      clearNewOrderNotification();
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
    };
  }, [autoConnect, connect, disconnect, refreshOrders, clearNewOrderNotification]);

  return {
    orders,
    connectionStatus,
    newOrderNotification,
    loading,
    error,
    connect,
    disconnect,
    refreshOrders,
    updateOrderStatus,
    clearNewOrderNotification,
  };
};