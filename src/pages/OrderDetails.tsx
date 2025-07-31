import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '@/services/api';
import { Order, OrderStatus } from '@/types';
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Phone,
  Printer,
  Calendar,
  DollarSign,
  User
} from 'lucide-react';
import { toast } from 'sonner';

const OrderDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;
      
      try {
        const orders = await apiService.getOrders();
        const foundOrder = orders.find(o => o.id === id);
        if (foundOrder) {
          setOrder(foundOrder);
        } else {
          toast.error('Order not found');
          navigate('/');
        }
      } catch (error) {
        console.error('Failed to fetch order:', error);
        toast.error('Failed to load order details');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, navigate]);

  const updateOrderStatus = async (newStatus: OrderStatus) => {
    if (!order) return;
    
    setUpdating(true);
    try {
      const updatedOrder = await apiService.updateOrderStatus(order.id, newStatus);
      setOrder(updatedOrder);
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error('Failed to update order status:', error);
      toast.error('Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const handlePrint = () => {
    if (!order) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Order #${order.id.slice(-6)}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 20px; }
          .order-info { margin-bottom: 15px; }
          .items { margin: 20px 0; }
          .item { display: flex; justify-content: space-between; margin: 5px 0; }
          .total { font-weight: bold; border-top: 1px solid #ccc; padding-top: 10px; }
          .footer { margin-top: 20px; text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>Timing Coffee Shop</h2>
          <h3>Order #${order.id.slice(-6)}</h3>
        </div>
        
        <div class="order-info">
          <p><strong>Customer:</strong> ${order.customerName}</p>
          ${order.customerPhone ? `<p><strong>Phone:</strong> ${order.customerPhone}</p>` : ''}
          <p><strong>Status:</strong> ${order.status.toUpperCase()}</p>
          <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
        </div>
        
        <div class="items">
          <h4>Items:</h4>
          ${order.items.map(item => `
            <div class="item">
              <span>${item.quantity}x ${item.name}</span>
              <span>$${(item.price * item.quantity).toFixed(2)}</span>
            </div>
            ${item.customizations.length > 0 ? 
              item.customizations.map(custom => 
                `<div style="margin-left: 20px; font-size: 12px; color: #666;">
                  ${custom.name}: ${custom.value}
                  ${custom.additionalPrice > 0 ? ` (+$${custom.additionalPrice.toFixed(2)})` : ''}
                </div>`
              ).join('') : ''
            }
          `).join('')}
        </div>
        
        ${order.specialInstructions ? `
          <div class="order-info">
            <p><strong>Special Instructions:</strong></p>
            <p>${order.specialInstructions}</p>
          </div>
        ` : ''}
        
        <div class="total">
          <div class="item">
            <span>Total Amount:</span>
            <span>$${order.totalAmount.toFixed(2)}</span>
          </div>
        </div>
        
        <div class="footer">
          <p>Thank you for your business!</p>
          <p>Printed: ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const getStatusColor = (status: OrderStatus): string => {
    switch (status) {
      case 'received': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'preparing': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ready': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'received': return <AlertCircle className="h-5 w-5" />;
      case 'preparing': return <Clock className="h-5 w-5" />;
      case 'ready': return <CheckCircle className="h-5 w-5" />;
      case 'completed': return <CheckCircle className="h-5 w-5" />;
      default: return <AlertCircle className="h-5 w-5" />;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            Order #{order.id.slice(-6)}
          </h1>
        </div>
        <button
          onClick={handlePrint}
          className="btn-secondary flex items-center space-x-2"
        >
          <Printer className="h-4 w-4" />
          <span>Print</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Card */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Order Status</h2>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                {getStatusIcon(order.status)}
                <span className="ml-2 capitalize">{order.status}</span>
              </div>
            </div>
            
            {/* Status Timeline */}
            <div className="space-y-3">
              <div className={`flex items-center ${order.status === 'received' || order.status === 'preparing' || order.status === 'ready' || order.status === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
                <CheckCircle className="h-4 w-4 mr-3" />
                <span className="text-sm">Order Received</span>
                <span className="ml-auto text-xs text-gray-500">
                  {new Date(order.createdAt).toLocaleString()}
                </span>
              </div>
              <div className={`flex items-center ${order.status === 'preparing' || order.status === 'ready' || order.status === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
                <Clock className="h-4 w-4 mr-3" />
                <span className="text-sm">Preparing</span>
              </div>
              <div className={`flex items-center ${order.status === 'ready' || order.status === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
                <CheckCircle className="h-4 w-4 mr-3" />
                <span className="text-sm">Ready for Pickup</span>
              </div>
              <div className={`flex items-center ${order.status === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
                <CheckCircle className="h-4 w-4 mr-3" />
                <span className="text-sm">Completed</span>
              </div>
            </div>

            {getNextStatus(order.status) && (
              <div className="mt-6">
                <button
                  onClick={() => updateOrderStatus(getNextStatus(order.status)!)}
                  disabled={updating}
                  className="btn-primary w-full disabled:opacity-50"
                >
                  {updating ? 'Updating...' : getStatusAction(order.status)}
                </button>
              </div>
            )}
          </div>

          {/* Order Items */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
            
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {item.quantity}x {item.name}
                      </h3>
                      {item.customizations.length > 0 && (
                        <div className="mt-1 space-y-1">
                          {item.customizations.map((custom) => (
                            <p key={custom.id} className="text-sm text-gray-600">
                              {custom.name}: {custom.value}
                              {custom.additionalPrice > 0 && (
                                <span className="text-green-600"> (+${custom.additionalPrice.toFixed(2)})</span>
                              )}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                      <p className="text-sm text-gray-500">${item.price.toFixed(2)} each</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Total Amount</span>
                <span className="text-lg font-bold text-gray-900">${order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Special Instructions */}
          {order.specialInstructions && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Special Instructions</h2>
              <p className="text-gray-700 bg-gray-50 p-4 rounded-md">{order.specialInstructions}</p>
            </div>
          )}
        </div>

        {/* Customer Information */}
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <User className="h-4 w-4 text-gray-400 mr-3" />
                <span className="text-gray-900">{order.customerName}</span>
              </div>
              
              {order.customerPhone && (
                <div className="flex items-center">
                  <Phone className="h-4 w-4 text-gray-400 mr-3" />
                  <a 
                    href={`tel:${order.customerPhone}`}
                    className="text-primary-600 hover:text-primary-800 underline"
                  >
                    {order.customerPhone}
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h2>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-900">Order Date</p>
                  <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-900">Order Time</p>
                  <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleTimeString()}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-900">Payment</p>
                  <p className="text-sm text-gray-500">Cash on Pickup</p>
                </div>
              </div>

              {order.estimatedTime && (
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-900">Estimated Time</p>
                    <p className="text-sm text-gray-500">{order.estimatedTime} minutes</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;