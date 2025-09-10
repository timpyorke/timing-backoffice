import { useState, useEffect, useRef, useCallback } from 'react';
import { Order, OrderStatus } from '@/types';
import { apiService } from '@/services/api';
import { toast } from 'sonner';

export interface UseOrdersOptions {
  autoRefreshInterval?: number; // in seconds, 0 means disabled
  date?: string; // YYYY-MM-DD; optional server-side date filter
}

export interface UseOrdersReturn {
  orders: Order[];
  loading: boolean;
  error: string | null;
  refreshOrders: () => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
}

export const useOrders = (options: UseOrdersOptions = {}): UseOrdersReturn => {
  const {
    autoRefreshInterval = 0, // disabled by default
    date
  } = options;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const autoRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);


  // Track last refresh time to prevent too frequent calls
  const lastRefreshTimeRef = useRef<number>(0);
  const REFRESH_DEBOUNCE_MS = 1000; // Minimum 1 second between refreshes

  // Fetch orders from API
  const refreshOrders = useCallback(async () => {
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTimeRef.current;
    
    // Debounce rapid successive calls
    if (timeSinceLastRefresh < REFRESH_DEBOUNCE_MS) {
      console.log(`Hook: Debouncing refresh call (${timeSinceLastRefresh}ms since last refresh)`);
      return;
    }
    
    lastRefreshTimeRef.current = now;
    
    try {
      setError(null);
      const fetchedOrders = await apiService.getOrders({ date });
      
      // The API service now handles response structure parsing and normalization
      // We should receive a clean array of Order objects
      if (Array.isArray(fetchedOrders)) {
        console.log(`Hook: Successfully loaded ${fetchedOrders.length} orders`);
        setOrders(fetchedOrders);
      } else {
        console.warn('Hook: Expected orders array but got:', typeof fetchedOrders, fetchedOrders);
        setOrders([]);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError('Failed to fetch orders');
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [date]);

  // Update order status via API
  const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus) => {
    console.log(`Hook: Starting update for order ${orderId} to ${status}`);
    
    try {
      const updatedOrder = await apiService.updateOrderStatus(orderId, status);
      console.log(`Hook: API call successful for order ${orderId}`, updatedOrder);
      
      // Update local state with the response from API (more reliable than optimistic update)
      setOrders(prev =>
        prev.map(order =>
          order.id === orderId
            ? { ...order, ...updatedOrder, status, updated_at: new Date().toISOString() }
            : order
        )
      );
      
      toast.success(`Order status updated to ${status}`);
      console.log(`Hook: Successfully updated order ${orderId} to ${status}`);
    } catch (err) {
      console.error('Hook: Failed to update order status:', err);
      
      // More detailed error logging
      if (err instanceof Error) {
        console.error('Error details:', {
          message: err.message,
          name: err.name,
          stack: err.stack
        });
      }
      
      // Check if it's a specific API error
      if (typeof err === 'object' && err !== null && 'message' in err) {
        toast.error(`Failed to update order: ${err.message}`);
      } else {
        toast.error('Failed to update order status');
      }
      
      throw err;
    }
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
  }, [autoRefreshInterval, date]); // keep interval in sync with date filter without depending on refreshOrders

  // Initial setup
  useEffect(() => {
    // Load initial orders
    refreshOrders();

    // Cleanup on unmount
    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
    };
  }, [refreshOrders]);

  return {
    orders,
    loading,
    error,
    refreshOrders,
    updateOrderStatus,
  };
};
