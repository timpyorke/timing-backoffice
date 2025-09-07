import React, { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import { SalesInsights, TopSellingItemsResponse } from '@/types';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Calendar,
  Download,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice } from '@/utils/format';

const Sales: React.FC = () => {
  const [salesInsights, setSalesInsights] = useState<SalesInsights | null>(null);
  const [topItems, setTopItems] = useState<TopSellingItemsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [refreshing, setRefreshing] = useState(false);
  const [topItemsLimit, setTopItemsLimit] = useState<number>(5);

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      const [insightsResponse, topItemsResponse] = await Promise.all([
        apiService.getSalesInsights({ start_date: startDate, end_date: endDate }),
        apiService.getTopSellingItems({ start_date: startDate, end_date: endDate, limit: topItemsLimit })
      ]);
      
      setSalesInsights(insightsResponse);
      setTopItems(topItemsResponse);
    } catch (error) {
      console.error('Failed to fetch sales data:', error);
      toast.error('Failed to fetch sales data. Please check your API connection.');
      setSalesInsights(null);
      setTopItems(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, [startDate, endDate, topItemsLimit]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSalesData();
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTopItemsLimit(Number(e.target.value));
  };

  const exportSalesData = () => {
    if (!salesInsights || !topItems) return;

    const csvContent = [
      ['Sales Insights Report'],
      ['Period', `${salesInsights.period.start_date} to ${salesInsights.period.end_date}`],
      [''],
      ['Summary Metrics', ''],
      ['Total Orders', salesInsights.data.summary.total_orders.toString()],
      ['Total Revenue', `฿${formatPrice(salesInsights.data.summary.total_revenue)}`],
      ['Average Order Value', `฿${formatPrice(salesInsights.data.summary.average_order_value)}`],
      ['Completed Orders', salesInsights.data.summary.completed_orders.toString()],
      ['Pending Orders', salesInsights.data.summary.pending_orders.toString()],
      ['Preparing Orders', salesInsights.data.summary.preparing_orders.toString()],
      ['Ready Orders', salesInsights.data.summary.ready_orders.toString()],
      ['Cancelled Orders', salesInsights.data.summary.cancelled_orders.toString()],
      ['Completion Rate', `${salesInsights.data.summary.completion_rate}%`],
      [''],
      ['Top Selling Items', ''],
      ['Rank', 'Item Name', 'Category', 'Quantity Sold', 'Revenue', 'Percentage of Sales'],
      ...topItems.data.map((item, index) => [
        (index + 1).toString(),
        item.menu_name,
        item.category,
        item.total_quantity_sold.toString(),
        `฿${formatPrice(item.total_revenue)}`,
        `${item.percentage_of_total_sales.toFixed(2)}%`
      ])
    ];

    const csvString = csvContent.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-insights-${startDate}-to-${endDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success('Sales insights report exported successfully');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Derived metrics excluding cancelled orders where possible
  const summary = salesInsights?.data.summary;
  const ordersExclCancelled = summary ? (summary.total_orders - summary.cancelled_orders) : 0;
  const revenueExclCancelled = summary ? (summary.completed_revenue) : 0;
  const avgValueExcl = summary && summary.completed_orders > 0
    ? (summary.completed_revenue / summary.completed_orders)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900">Sales Insights Dashboard</h1>
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <input
              type="date"
              value={startDate}
              onChange={handleStartDateChange}
              className="input text-sm"
              placeholder="Start Date"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={endDate}
              onChange={handleEndDateChange}
              className="input text-sm"
              placeholder="End Date"
            />
          </div>
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4 text-gray-500" />
            <select
              value={topItemsLimit}
              onChange={handleLimitChange}
              className="input text-sm"
            >
              <option value={5}>Top 5</option>
              <option value={10}>Top 10</option>
              <option value={20}>Top 20</option>
              <option value={50}>Top 50</option>
            </select>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-secondary flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          {salesInsights && topItems && (
            <button
              onClick={exportSalesData}
              className="btn-primary flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          )}
        </div>
      </div>

      {salesInsights && topItems ? (
        <>
          {/* Period Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span className="text-blue-800 font-medium">
                Sales Period: {new Date(salesInsights.period.start_date).toLocaleDateString('en-US')} - {new Date(salesInsights.period.end_date).toLocaleDateString('en-US')}
              </span>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ShoppingCart className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{ordersExclCancelled}</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">฿{formatPrice(revenueExclCancelled)}</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Avg Order Value</p>
                  <p className="text-2xl font-bold text-gray-900">฿{formatPrice(avgValueExcl)}</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <CheckCircle className="h-8 w-8 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Completion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{salesInsights.data.summary.completion_rate}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="card p-4 text-center">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-xl font-bold text-gray-900">{salesInsights.data.summary.completed_orders}</p>
            </div>
            <div className="card p-4 text-center">
              <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-xl font-bold text-gray-900">{salesInsights.data.summary.pending_orders}</p>
            </div>
            <div className="card p-4 text-center">
              <Package className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-500">Preparing</p>
              <p className="text-xl font-bold text-gray-900">{salesInsights.data.summary.preparing_orders}</p>
            </div>
            <div className="card p-4 text-center">
              <ShoppingCart className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-500">Ready</p>
              <p className="text-xl font-bold text-gray-900">{salesInsights.data.summary.ready_orders}</p>
            </div>
            <div className="card p-4 text-center">
              <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-500">Cancelled</p>
              <p className="text-xl font-bold text-gray-900">{salesInsights.data.summary.cancelled_orders}</p>
            </div>
          </div>

          {/* Top Selling Items */}
          <div className="card p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Top {topItemsLimit} Selling Items</h2>
              <span className="text-sm text-gray-500">{topItems.count} items found</span>
            </div>
            
            {topItems.data && topItems.data.length > 0 ? (
              <div className="space-y-4">
                {topItems.data.map((item, index) => (
                  <div key={item.menu_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary-100 text-primary-800 text-sm font-medium">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-shrink-0">
                        {item.image_url ? (
                          <img 
                            src={item.image_url} 
                            alt={item.menu_name}
                            className="h-12 w-12 rounded-lg object-cover object-center"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{item.menu_name}</h3>
                        <p className="text-sm text-gray-500">{item.category}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-xs text-gray-500">
                            {item.total_quantity_sold} sold in {item.number_of_orders} orders
                          </span>
                          <span className="text-xs text-blue-600 font-medium">
                            {item.percentage_of_total_sales.toFixed(1)}% of sales
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        ฿{formatPrice(item.total_revenue)}
                      </p>
                      <p className="text-xs text-gray-500">total revenue</p>
                      <p className="text-xs text-gray-500">
                        ฿{formatPrice(item.average_price)} avg price
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No sales data</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No items were sold in the selected period.
                </p>
              </div>
            )}
          </div>

          {/* Daily Breakdown */}
          {salesInsights.data.daily_breakdown && salesInsights.data.daily_breakdown.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Daily Breakdown</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Order</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {salesInsights.data.daily_breakdown.map((day, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {new Date(day.order_date).toLocaleDateString('en-US')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {day.total_orders}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ฿{formatPrice(day.total_revenue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ฿{formatPrice(day.average_order_value)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {day.completed_orders}/{day.total_orders}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-1">
                            {parseInt(day.pending_orders) > 0 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                {day.pending_orders} pending
                              </span>
                            )}
                            {parseInt(day.preparing_orders) > 0 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {day.preparing_orders} preparing
                              </span>
                            )}
                            {parseInt(day.ready_orders) > 0 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                {day.ready_orders} ready
                              </span>
                            )}
                            {parseInt(day.cancelled_orders) > 0 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                {day.cancelled_orders} cancelled
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Additional Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Insights</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Completed Revenue</span>
                  <span className="text-sm font-medium text-gray-900">
                    ฿{formatPrice(salesInsights.data.summary.completed_revenue)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Best selling category</span>
                  <span className="text-sm font-medium text-gray-900">
                    {topItems.data.length > 0 ? topItems.data[0].category : 'N/A'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Highest revenue item</span>
                  <span className="text-sm font-medium text-gray-900">
                    {topItems.data.length > 0 
                      ? topItems.data.reduce((max, item) => item.total_revenue > max.total_revenue ? item : max, topItems.data[0]).menu_name
                      : 'N/A'
                    }
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Top item share</span>
                  <span className="text-sm font-medium text-gray-900">
                    {topItems.data.length > 0 ? `${topItems.data[0].percentage_of_total_sales.toFixed(1)}%` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Performance</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Completion Rate</span>
                  <span className="text-sm font-medium text-green-600">
                    {salesInsights.data.summary.completion_rate}%
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Cancelled Rate</span>
                  <span className="text-sm font-medium text-red-600">
                    {salesInsights.data.summary.total_orders > 0 
                      ? ((salesInsights.data.summary.cancelled_orders / salesInsights.data.summary.total_orders) * 100).toFixed(1)
                      : '0'
                    }%
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${parseFloat(salesInsights.data.summary.completion_rate)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 text-center">Order completion progress</p>

                <div className="mt-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">{salesInsights.data.summary.completed_orders}</p>
                  <p className="text-sm text-gray-500">Orders completed successfully</p>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No sales data available</h3>
          <p className="mt-1 text-sm text-gray-500">
            No sales data found for the selected period. Try adjusting your date range.
          </p>
          <div className="mt-4">
            <button
              onClick={handleRefresh}
              className="btn-primary"
            >
              Retry Loading Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
