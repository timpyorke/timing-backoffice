import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import { apiService } from '@/services/api';
import { DailySales, SalesInsights } from '@/types';
import {
  ShoppingCart,
  Clock,
  CheckCircle,
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  Eye,
  RefreshCw
} from 'lucide-react';
import ConnectionStatus from '@/components/ConnectionStatus';
import OrderStatusBadge from '@/components/OrderStatusBadge';

const Dashboard: React.FC = () => {
  const [, setSalesData] = useState<SalesInsights | null>(null);
  const [todaySales, setTodaySales] = useState<DailySales | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const {
    orders,
    connectionStatus,
    connect,
    refreshOrders
  } = useRealtimeOrders({
    enableNotifications: true,
    autoConnect: true
  });

  // Get recent orders (last 10)
  const recentOrders = orders.slice(0, 10);

  // Calculate order stats
  const orderStats = {
    pending: orders.filter(o => o.status === 'pending').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    completed: orders.filter(o => o.status === 'completed').length,
  };

  const fetchDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch sales insights for the last 7 days
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      // Fetch data separately to handle individual failures
      try {
        const salesResponse = await apiService.getSalesInsights({ start_date: startDate, end_date: endDate });
        console.log('Sales response:', salesResponse);
        setSalesData(salesResponse);
      } catch (salesError) {
        console.warn('Failed to fetch sales insights:', salesError);
        setSalesData(null);
      }

      try {
        const todayResponse = await apiService.getDailySales(today);
        console.log('Today response:', todayResponse);
        
        // Handle different response structures for daily sales
        if (todayResponse && typeof todayResponse === 'object') {
          // Check if it's wrapped in a data property
          if ('data' in todayResponse) {
            setTodaySales(todayResponse.data as DailySales);
          } else {
            setTodaySales(todayResponse as DailySales);
          }
        } else {
          console.warn('Unexpected today sales response structure:', todayResponse);
          setTodaySales(null);
        }
      } catch (todayError) {
        console.warn('Failed to fetch today sales:', todayError);
        setTodaySales(null);
      }
      
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Set empty data on error
      setTodaySales(null);
      setSalesData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchDashboardData(),
      refreshOrders()
    ]);
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
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <ConnectionStatus
            status={connectionStatus}
            onRetry={connect}
            size="sm"
          />
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Today's Revenue */}
        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Today's Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ฿{(todaySales?.totalRevenue || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Today's Orders */}
        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ShoppingCart className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Today's Orders</p>
              <p className="text-2xl font-bold text-gray-900">
                {todaySales?.totalOrders || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Average Order Value */}
        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg. Order Value</p>
              <p className="text-2xl font-bold text-gray-900">
                ฿{(todaySales?.averageOrderValue || 0).toFixed(0)}
              </p>
            </div>
          </div>
        </div>

        {/* Total Active Orders */}
        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Orders</p>
              <p className="text-2xl font-bold text-gray-900">
                {orderStats.pending + orderStats.preparing + orderStats.ready}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Order Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-blue-600">{orderStats.pending}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Preparing</p>
              <p className="text-2xl font-bold text-yellow-600">{orderStats.preparing}</p>
            </div>
            <Users className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Ready</p>
              <p className="text-2xl font-bold text-green-600">{orderStats.ready}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-gray-600">{orderStats.completed}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-gray-500" />
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Recent Orders</h3>
            <Link
              to="/orders"
              className="text-primary-600 hover:text-primary-500 text-sm font-medium"
            >
              View all
            </Link>
          </div>
        </div>
        <div className="overflow-hidden">
          {recentOrders.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <ShoppingCart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-sm font-medium text-gray-900">No orders yet</h3>
              <p className="text-sm text-gray-500">Orders will appear here when customers place them.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {recentOrders.map((order) => (
                <div key={order.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Order #{String(order.id).slice(-6)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {order.customer_info.name}
                        </p>
                      </div>
                      <OrderStatusBadge status={order.status} size="sm" />
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          ฿{Number(order.total).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {order.created_at 
                            ? new Date(order.created_at).toLocaleTimeString('th-TH')
                            : 'N/A'
                          }
                        </p>
                      </div>
                      <Link
                        to={`/orders/${order.id}`}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/orders"
          className="card p-6 hover:bg-gray-50 transition-colors group"
        >
          <div className="flex items-center">
            <ShoppingCart className="h-8 w-8 text-primary-600 group-hover:text-primary-700" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Manage Orders</h3>
              <p className="text-sm text-gray-500">View and update order status</p>
            </div>
          </div>
        </Link>

        <Link
          to="/menu"
          className="card p-6 hover:bg-gray-50 transition-colors group"
        >
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-primary-600 group-hover:text-primary-700" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Menu Management</h3>
              <p className="text-sm text-gray-500">Update menu items and prices</p>
            </div>
          </div>
        </Link>

        <Link
          to="/settings"
          className="card p-6 hover:bg-gray-50 transition-colors group"
        >
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-primary-600 group-hover:text-primary-700" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Settings</h3>
              <p className="text-sm text-gray-500">Configure app settings</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;