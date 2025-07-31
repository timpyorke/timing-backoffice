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
      const response = await apiService.getOrders(filters);
      console.log('Orders API Response:', response); // Debug log
      
      // Handle different response structures
      let fetchedOrders: Order[] = [];
      if (Array.isArray(response)) {
        fetchedOrders = response;
      } else if (response && typeof response === 'object') {
        const responseObj = response as any;
        if (Array.isArray(responseObj.data)) {
          fetchedOrders = responseObj.data;
        } else if (responseObj.orders && Array.isArray(responseObj.orders)) {
          fetchedOrders = responseObj.orders;
        } else if (responseObj.items && Array.isArray(responseObj.items)) {
          fetchedOrders = responseObj.items;
        } else {
          console.warn('Unexpected orders response structure:', response);
          fetchedOrders = [];
        }
      } else {
        console.warn('Unexpected orders response type:', typeof response);
        fetchedOrders = [];
      }
      
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
        Array.isArray(prev) ? prev.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus, updatedAt: new Date() }
            : order
        ) : []
      );
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error('Failed to update order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const getStatusColor = (status: OrderStatus): string => {
    switch (status) {
      case 'pending': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-yellow-100 text-yellow-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return <AlertCircle className="h-4 w-4" />;
      case 'preparing': return <Clock className="h-4 w-4" />;
      case 'ready': return <CheckCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
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
      case 'pending': return 'Start Preparing';
      case 'preparing': return 'Mark Ready';
      case 'ready': return 'Complete Order';
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

  const filteredOrders = Array.isArray(orders) ? orders.filter(order => {
    if (statusFilter === 'all') return true;
    return order.status === statusFilter;
  }) : [];

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
              <option value="pending">New Orders</option>
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
                  Order #{String(order.id).slice(-6)}
                </h3>
                <p className="text-sm text-gray-600">{order.customer_info.name}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                  {getStatusIcon(order.status)}
                  <span className="ml-1 capitalize">{order.status}</span>
                </span>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{item.quantity}x Beverage #{item.beverage_id}</span>
                  <span>฿{Number(item.price).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-bold text-gray-900">
                Total: ฿{Number(order.total).toFixed(2)}
              </span>
              <span className="text-sm text-gray-500">
                {order.createdAt ? (isNaN(new Date(order.createdAt).getTime()) ? 'N/A' : new Date(order.createdAt).toLocaleTimeString('th-TH')) : 'N/A'}
              </span>
            </div>

            {order.customer_info.phone && (
              <div className="flex items-center text-sm text-gray-600 mb-4">
                <Phone className="h-4 w-4 mr-2" />
                <a 
                  href={`tel:${order.customer_info.phone}`}
                  className="hover:text-primary-600 underline"
                >
                  {order.customer_info.phone}
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
                  className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${getStatusButtonColor(order.status)}`}
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