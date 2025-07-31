import React, { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import { DailySales } from '@/types';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

const Sales: React.FC = () => {
  const [salesData, setSalesData] = useState<DailySales | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [refreshing, setRefreshing] = useState(false);

  const fetchSalesData = async (date?: string) => {
    try {
      const data = await apiService.getDailySales(date);
      setSalesData(data);
    } catch (error) {
      console.error('Failed to fetch sales data:', error);
      toast.error('No backend API available. Please start your API server.');
      // Set null sales data instead of failing
      setSalesData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSalesData(selectedDate);
  }, [selectedDate]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSalesData(selectedDate);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  const exportSalesData = () => {
    if (!salesData) return;

    const csvContent = [
      ['Metric', 'Value'],
      ['Date', salesData.date],
      ['Total Orders', salesData.totalOrders.toString()],
      ['Total Revenue', `฿${Number(salesData.totalRevenue || 0).toFixed(2)}`],
      ['Average Order Value', `฿${Number(salesData.averageOrderValue || 0).toFixed(2)}`],
      [''],
      ['Top Items', ''],
      ['Item Name', 'Quantity Sold', 'Revenue'],
      ...(salesData.topItems || []).map(item => [
        item.name,
        item.quantity.toString(),
        `฿${Number(item.revenue || 0).toFixed(2)}`
      ])
    ];

    const csvString = csvContent.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${salesData.date}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success('Sales report exported successfully');
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
        <h1 className="text-2xl font-bold text-gray-900">Sales Dashboard</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="input"
            />
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-secondary flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          {salesData && (
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

      {salesData ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ShoppingCart className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{salesData.totalOrders}</p>
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
                  <p className="text-2xl font-bold text-gray-900">฿{Number(salesData.totalRevenue || 0).toFixed(2)}</p>
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
                  <p className="text-2xl font-bold text-gray-900">฿{Number(salesData.averageOrderValue || 0).toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Calendar className="h-8 w-8 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Date</p>
                  <p className="text-lg font-bold text-gray-900">
                    {salesData.date ? (isNaN(new Date(salesData.date).getTime()) ? 'N/A' : new Date(salesData.date).toLocaleDateString('th-TH')) : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Items */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Items</h2>
            
            {salesData.topItems && salesData.topItems.length > 0 ? (
              <div className="space-y-4">
                {(salesData.topItems || []).map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary-100 text-primary-800 text-sm font-medium">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{item.name}</h3>
                        <p className="text-sm text-gray-500">
                          {item.quantity} sold
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        ฿{Number(item.revenue || 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No sales data</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No items were sold on this date.
                </p>
              </div>
            )}
          </div>

          {/* Additional Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Sales Insights</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Items per order (avg)</span>
                  <span className="text-sm font-medium text-gray-900">
                    {salesData.totalOrders > 0 
                      ? ((salesData.topItems || []).reduce((sum, item) => sum + (item.quantity || 0), 0) / salesData.totalOrders).toFixed(1)
                      : '0'
                    }
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Best selling item</span>
                  <span className="text-sm font-medium text-gray-900">
                    {salesData.topItems && salesData.topItems.length > 0 ? salesData.topItems[0].name : 'N/A'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Highest revenue item</span>
                  <span className="text-sm font-medium text-gray-900">
                    {salesData.topItems && salesData.topItems.length > 0 
                      ? salesData.topItems.reduce((max, item) => (item.revenue || 0) > (max.revenue || 0) ? item : max, salesData.topItems[0]).name
                      : 'N/A'
                    }
                  </span>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Revenue vs Target</span>
                  <span className="text-sm font-medium text-gray-900">
                    {/* Assuming a daily target of $500 */}
                    {((Number(salesData.totalRevenue || 0) / 500) * 100).toFixed(0)}%
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Orders vs Target</span>
                  <span className="text-sm font-medium text-gray-900">
                    {/* Assuming a daily target of 50 orders */}
                    {((Number(salesData.totalOrders || 0) / 50) * 100).toFixed(0)}%
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (Number(salesData.totalRevenue || 0) / 500) * 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 text-center">Daily revenue progress</p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No sales data available</h3>
          <p className="mt-1 text-sm text-gray-500">
            No sales data found for the selected date.
          </p>
        </div>
      )}
    </div>
  );
};

export default Sales;