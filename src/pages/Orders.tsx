import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { OrderStatus } from '@/types';
import { useOrders } from '@/hooks/useOrders';
import { safeStorage } from '@/utils/safeStorage';
import {
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle,
  Phone,
  Eye,
  Filter,
  Plus
} from 'lucide-react';
import NoBackendMessage from '@/components/NoBackendMessage';
import OrderStatusBadge from '@/components/OrderStatusBadge';

const Orders: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Get auto refresh interval from settings
  const getAutoRefreshInterval = (): number => {
    try {
      const settings = safeStorage.getItem('app_settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        return parsed.autoRefreshInterval || 0;
      }
    } catch (error) {
      console.error('Failed to parse app settings:', error);
    }
    return 0; // disabled by default
  };

  const [autoRefreshInterval, setAutoRefreshInterval] = useState(getAutoRefreshInterval());

  // Display today's date in the header
  const todayDisplay = useMemo(
    () => new Date().toLocaleDateString(undefined, { dateStyle: 'medium' }),
    []
  );


  // Use orders hook
  const {
    orders,
    loading,
    error: apiError,
    refreshOrders,
    updateOrderStatus: realtimeUpdateOrderStatus
  } = useOrders({
    autoRefreshInterval
  });

  // Listen for settings changes to update auto refresh interval
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'app_settings' && e.newValue) {
        try {
          const newSettings = JSON.parse(e.newValue);
          setAutoRefreshInterval(newSettings.autoRefreshInterval || 0);
        } catch (error) {
          console.error('Failed to parse updated settings:', error);
        }
      }
    };

    const handleSettingsChanged = (e: CustomEvent) => {
      const newSettings = e.detail;
      setAutoRefreshInterval(newSettings.autoRefreshInterval || 0);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('settingsChanged', handleSettingsChanged as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('settingsChanged', handleSettingsChanged as EventListener);
    };
  }, []);


  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshOrders();
    } finally {
      setRefreshing(false);
    }
  };

  const [updatingOrderIds, setUpdatingOrderIds] = useState<Set<string>>(new Set());

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    // Prevent multiple simultaneous updates for the same order
    if (updatingOrderIds.has(orderId)) {
      console.warn('Order update already in progress for:', orderId);
      return;
    }

    setUpdatingOrderIds(prev => new Set([...prev, orderId]));

    try {
      console.log(`Updating order ${orderId} from status to ${newStatus}`);
      await realtimeUpdateOrderStatus(orderId, newStatus);
      console.log(`Successfully updated order ${orderId} to ${newStatus}`);
    } catch (error) {
      console.error('Failed to update order status:', error);
      // Additional error details
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
    } finally {
      setUpdatingOrderIds(prev => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }
  };



  const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
    switch (currentStatus) {
      case 'pending': return 'preparing';
      case 'preparing': return 'ready';
      case 'ready': return 'completed';
      default: return null;
    }
  };

  const getStatusAction = (status: OrderStatus): string => {
    switch (status) {
      case 'pending': return 'Start';
      case 'preparing': return 'Ready';
      case 'ready': return 'Complete';
      default: return '';
    }
  };

  const getStatusButtonColor = (status: OrderStatus): string => {
    switch (status) {
      case 'pending': return 'bg-blue-600 hover:bg-blue-700 text-white';
      case 'preparing': return 'bg-yellow-600 hover:bg-yellow-700 text-white';
      case 'ready': return 'bg-green-600 hover:bg-green-700 text-white';
      default: return 'bg-gray-600 hover:bg-gray-700 text-white';
    }
  };

  // Debug logging for order display issues
  console.log(`Orders Component: Loaded ${orders?.length || 0} orders, filtering by "${statusFilter}"`);

  const filteredOrders = Array.isArray(orders) ? orders.filter(order => {
    if (statusFilter === 'all') return true;
    return order.status === statusFilter;
  }) : [];

  console.log(`Orders Component: Displaying ${filteredOrders.length} orders after filtering`);

  const ordersByStatus = {
    received: Array.isArray(filteredOrders) ? filteredOrders.filter(o => o.status === 'pending') : [],
    preparing: Array.isArray(filteredOrders) ? filteredOrders.filter(o => o.status === 'preparing') : [],
    ready: Array.isArray(filteredOrders) ? filteredOrders.filter(o => o.status === 'ready') : [],
    completed: Array.isArray(filteredOrders) ? filteredOrders.filter(o => o.status === 'completed') : [],
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">Orders Dashboard</h1>
          <span className="text-sm text-gray-600">Date: {todayDisplay}</span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
              className="input py-1"
            >
              <option value="all">All Orders</option>
              <option value="pending">New Orders</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <Link to="/orders/new" className="btn-primary flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>New Order</span>
          </Link>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-primary flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertCircle className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">New Orders</p>
              <p className="text-2xl font-bold text-gray-900">{ordersByStatus.received.length}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Preparing</p>
              <p className="text-2xl font-bold text-gray-900">{ordersByStatus.preparing.length}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Ready</p>
              <p className="text-2xl font-bold text-gray-900">{ordersByStatus.ready.length}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-gray-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{ordersByStatus.completed.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Grid - more dense on tablets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredOrders.map((order) => (
          <div key={order.id} className="card p-6 hover:shadow-md transition-shadow flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Order #{String(order.id).slice(-6)}
                </h3>
                <p className="text-sm text-gray-600">{order.customer_info.name}</p>
                {order.customer_info.phone && (
                  <p className="text-xs text-gray-500 flex items-center mt-1">
                    <Phone className="h-3 w-3 mr-1" />
                    <a
                      href={`tel:${order.customer_info.phone}`}
                      className="hover:text-primary-600 underline"
                    >
                      {order.customer_info.phone}
                    </a>
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <OrderStatusBadge status={order.status} />
              </div>
            </div>

            <div className="space-y-2 mb-4 flex-1">
              {(order.items || []).map((item, index) => {
                const displayName = item?.menu_name || `Menu Item #${item?.menu_id}`;
                return (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="truncate mr-2">{item?.quantity || 0}x {displayName}</span>
                    <span className="flex-shrink-0">฿{Number(item?.price || 0).toFixed(2)}</span>
                  </div>
                );
              })}
            </div>

            <div className="mb-4">
              {(() => {
                const original = order?.original_total;
                const discountRaw = order?.discount_amount;
                const hasOriginal = original !== undefined && original !== null && !isNaN(Number(original));
                const discount = discountRaw !== undefined && discountRaw !== null ? Number(discountRaw) : 0;
                const subtotal = hasOriginal
                  ? Number(original)
                  : (Array.isArray(order.items) ? order.items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0) : 0);
                const totalFromOrder = order?.total !== undefined && order?.total !== null ? Number(order.total) : NaN;
                const displayTotal = !isNaN(totalFromOrder) && totalFromOrder >= 0
                  ? totalFromOrder
                  : Number((subtotal - Math.max(0, Number.isNaN(discount) ? 0 : discount)).toFixed(2));
                return (
                  <div className="text-lg font-bold text-gray-900">
                    Total: ฿{displayTotal.toFixed(2)}
                  </div>
                );
              })()}
              <div className="text-sm text-gray-500 mt-1">
                Order at: {order.created_at ? (() => {
                  const date = typeof order.created_at === 'string' ? new Date(order.created_at) : order.created_at;
                  return isNaN(date.getTime())
                    ? 'N/A'
                    : date.toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
                })() : 'N/A'}
              </div>
            </div>


            <div className="flex space-x-2 min-h-[2.5rem] mt-auto">
              <Link
                to={`/orders/${order.id}`}
                className="btn-secondary flex-1 flex items-center justify-center space-x-1 whitespace-nowrap text-sm tap-target"
              >
                <Eye className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">View</span>
              </Link>

              {(() => {
                const nextStatus = getNextStatus(order.status);
                const isUpdating = updatingOrderIds.has(order.id);
                return nextStatus && (
                  <button
                    onClick={() => updateOrderStatus(order.id, nextStatus)}
                    disabled={isUpdating}
                    className={`flex-1 px-2 py-2 rounded-md font-medium transition-colors text-sm whitespace-nowrap tap-target ${isUpdating
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : getStatusButtonColor(order.status)
                      }`}
                  >
                    {isUpdating ? (
                      <span className="flex items-center justify-center">
                        <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                        <span className="truncate">Updating...</span>
                      </span>
                    ) : (
                      <span className="truncate">{getStatusAction(order.status)}</span>
                    )}
                  </button>
                );
              })()}
            </div>
          </div>
        ))}
      </div>

      {filteredOrders.length === 0 && !loading && (
        <>
          {apiError ? (
            <NoBackendMessage />
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {statusFilter === 'all'
                  ? 'No orders have been placed yet.'
                  : `No orders with status "${statusFilter}" found.`
                }
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Orders;
