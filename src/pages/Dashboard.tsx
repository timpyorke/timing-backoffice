import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useOrders } from '@/hooks/useOrders';
import { apiService } from '@/services/api';
import { DailySales, SalesInsights, DailyBreakResponse } from '@/types';
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
import OrderStatusBadge from '@/components/OrderStatusBadge';
import { formatPrice } from '@/utils/format';

const Dashboard: React.FC = () => {
  const [, setSalesData] = useState<SalesInsights | null>(null);
  const [todaySales, setTodaySales] = useState<DailySales | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dailyBreak, setDailyBreak] = useState<DailyBreakResponse['data'] | null>(null);
  const [showFireworks, setShowFireworks] = useState(false);
  const fireworksTimeoutRef = useRef<number | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const { orders } = useOrders({ date: todayStr });

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
        
        // Handle new API response structure: { success: true, data: DailySales }
        if (todayResponse && typeof todayResponse === 'object') {
          const response = todayResponse as any;
          if (response.success && response.data) {
            setTodaySales(response.data as DailySales);
          } else if ('data' in response) {
            setTodaySales(response.data as DailySales);
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

      // Fetch daily break comparison (today vs yesterday)
      try {
        const breakResponse = await apiService.getDailyBreak();
        if (breakResponse && breakResponse.success && breakResponse.data) {
          setDailyBreak(breakResponse.data);
          if (breakResponse.data.brokeRecord) {
            setShowFireworks(true);
            if (fireworksTimeoutRef.current) {
              clearTimeout(fireworksTimeoutRef.current);
            }
            fireworksTimeoutRef.current = window.setTimeout(() => setShowFireworks(false), 2500);
          }
        } else {
          setDailyBreak(null);
        }
      } catch (e) {
        console.warn('Failed to fetch daily break:', e);
        setDailyBreak(null);
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
    return () => {
      if (fireworksTimeoutRef.current) {
        clearTimeout(fireworksTimeoutRef.current);
      }
    };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Only refresh dashboard data, orders are handled by useRealtimeOrders hook
    await fetchDashboardData();
  };

  const headerDateDisplay = React.useMemo(
    () => new Date().toLocaleDateString(undefined, { dateStyle: 'medium' }),
    []
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Record-broken confetti overlay */}
      {showFireworks && (
        <div className="fixed inset-0 pointer-events-none z-40">
          <div className="fireworks-container">
            {Array.from({ length: 9 }).map((_, i) => (
              <span key={i} className={`firework firework-${i + 1}`} />
            ))}
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">
            <span className="inline-block bg-primary-100 text-primary-800 px-3 py-1 rounded-lg">{headerDateDisplay}</span>
          </h1>
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
                {(() => {
                  const ordersRevenue = Array.isArray(orders)
                    ? orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + (Number(o.total) || 0), 0)
                    : 0;
                  return `฿${formatPrice(ordersRevenue)}`;
                })()}
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
                {todaySales?.completed_orders ?? todaySales?.total_orders ?? (todaySales as any)?.totalOrders ?? 0}
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
                {(() => {
                  const completedRev = (todaySales as any)?.completed_revenue;
                  const completed = todaySales?.completed_orders;
                  const avg = (typeof completedRev === 'number' && completed && completed > 0)
                    ? (completedRev / completed)
                    : (todaySales?.averageOrderValue || (todaySales?.total_revenue && todaySales?.total_orders ? todaySales.total_revenue / todaySales.total_orders : 0));
                  return `฿${formatPrice(Number(avg))}`;
                })()}
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

      {/* Tea Cup Progress: Today vs Yesterday */}
      {dailyBreak && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className={`text-3xl ${dailyBreak.brokeRecord ? 'animate-wiggle' : ''}`}>🍵</span>
              <div>
                <p className="text-sm font-medium text-gray-500">Tea Cup Progress</p>
                <p className="text-base text-gray-700">
                  Today {dailyBreak.todayCount} / Yesterday {dailyBreak.yesterdayCount}
                  {dailyBreak.brokeRecord && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Record!</span>
                  )}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-2xl font-bold ${dailyBreak.brokeRecord ? 'text-green-600' : 'text-gray-900'}`}>
                {dailyBreak.difference >= 0 ? '+' : ''}{dailyBreak.difference}
              </p>
              <p className="text-xs text-gray-500">vs yesterday</p>
            </div>
          </div>
          <div className="mt-2">
            {(() => {
              const target = Math.max(1, dailyBreak.yesterdayCount);
              const pctRaw = (dailyBreak.todayCount / target) * 100;
              const pct = Math.min(100, Math.max(0, Math.round(pctRaw)));
              return (
                <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${dailyBreak.brokeRecord ? 'bg-green-500' : 'bg-primary-500'} transition-all duration-700`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              );
            })()}
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0</span>
              <span>{dailyBreak.yesterdayCount} to break</span>
            </div>
          </div>
        </div>
      )}

      {/* Completion Rate */}
      {todaySales?.completion_rate && (
        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {todaySales.completion_rate}%
              </p>
              <p className="text-sm text-gray-600">
                {todaySales.completed_orders} of {todaySales.total_orders} completed
              </p>
            </div>
          </div>
        </div>
      )}

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
                          ฿{formatPrice(Number(order.total))}
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
