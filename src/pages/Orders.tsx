import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '@/services/api';
import { Order, OrderStatus } from '@/types';
import { 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Phone,
  Eye,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';
import NoBackendMessage from '@/components/NoBackendMessage';

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [apiError, setApiError] = useState(false);

  const fetchOrders = async () => {
    try {
      const filters = statusFilter !== 'all' ? { status: statusFilter } : {};
      const fetchedOrders = await apiService.getOrders(filters);
      setOrders(fetchedOrders);
      setApiError(false);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setApiError(true);
      // Set empty orders instead of failing
      setOrders([]);
      if (!refreshing) {
        toast.error('No backend API available. Please start your API server.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await apiService.updateOrderStatus(orderId, newStatus);
      setOrders(prev => 
        prev.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus, updatedAt: new Date() }
            : order
        )
      );
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error('Failed to update order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const getStatusColor = (status: OrderStatus): string => {
    switch (status) {
      case 'received': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-yellow-100 text-yellow-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'received': return <AlertCircle className="h-4 w-4" />;
      case 'preparing': return <Clock className="h-4 w-4" />;
      case 'ready': return <CheckCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
    switch (currentStatus) {
      case 'received': return 'preparing';
      case 'preparing': return 'ready';
      case 'ready': return 'completed';
      default: return null;
    }
  };

  const getStatusAction = (status: OrderStatus): string => {
    switch (status) {
      case 'received': return 'Start Preparing';
      case 'preparing': return 'Mark Ready';
      case 'ready': return 'Complete Order';
      default: return '';
    }
  };

  const filteredOrders = orders.filter(order => {
    if (statusFilter === 'all') return true;
    return order.status === statusFilter;
  });

  const ordersByStatus = {
    received: filteredOrders.filter(o => o.status === 'received'),
    preparing: filteredOrders.filter(o => o.status === 'preparing'),
    ready: filteredOrders.filter(o => o.status === 'ready'),
    completed: filteredOrders.filter(o => o.status === 'completed'),
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
        <h1 className="text-2xl font-bold text-gray-900">Orders Dashboard</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
              className="input py-1"
            >
              <option value="all">All Orders</option>
              <option value="received">New Orders</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="completed">Completed</option>
            </select>
          </div>
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
              <p className="text-sm font-medium text-gray-500">Completed Today</p>
              <p className="text-2xl font-bold text-gray-900">{ordersByStatus.completed.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredOrders.map((order) => (
          <div key={order.id} className="card p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Order #{order.id.slice(-6)}
                </h3>
                <p className="text-sm text-gray-600">{order.customerName}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                  {getStatusIcon(order.status)}
                  <span className="ml-1 capitalize">{order.status}</span>
                </span>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.quantity}x {item.name}</span>
                  <span>${item.price.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-bold text-gray-900">
                Total: ${order.totalAmount.toFixed(2)}
              </span>
              <span className="text-sm text-gray-500">
                {new Date(order.createdAt).toLocaleTimeString()}
              </span>
            </div>

            {order.customerPhone && (
              <div className="flex items-center text-sm text-gray-600 mb-4">
                <Phone className="h-4 w-4 mr-2" />
                <a 
                  href={`tel:${order.customerPhone}`}
                  className="hover:text-primary-600 underline"
                >
                  {order.customerPhone}
                </a>
              </div>
            )}

            <div className="flex space-x-2">
              <Link
                to={`/orders/${order.id}`}
                className="btn-secondary flex-1 flex items-center justify-center space-x-2"
              >
                <Eye className="h-4 w-4" />
                <span>View Details</span>
              </Link>
              
              {getNextStatus(order.status) && (
                <button
                  onClick={() => updateOrderStatus(order.id, getNextStatus(order.status)!)}
                  className="btn-primary flex-1"
                >
                  {getStatusAction(order.status)}
                </button>
              )}
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