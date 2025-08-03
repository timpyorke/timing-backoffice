import React, { useState, useEffect } from 'react';
import { Order } from '@/types';
import { apiService } from '@/services/api';
import { Clock, User, Phone, CheckCircle } from 'lucide-react';

interface OrderTrackingProps {
  orderId: string;
  refreshInterval?: number; // in milliseconds
}

const OrderTracking: React.FC<OrderTrackingProps> = ({ 
  orderId, 
  refreshInterval = 30000 // 30 seconds default
}) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setError(null);
        const response = await apiService.getOrder(orderId);
        
        // Handle different response structures
        let orderData: Order | null = null;
        if (response && typeof response === 'object') {
          if ('data' in response) {
            orderData = (response as any).data;
          } else {
            orderData = response as Order;
          }
        }
        
        setOrder(orderData);
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
    
    // Set up polling for updates
    const interval = setInterval(fetchOrder, refreshInterval);
    
    return () => clearInterval(interval);
  }, [orderId, refreshInterval]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-2">
          {error || 'Order not found'}
        </div>
        <button
          onClick={() => window.location.reload()}
          className="text-blue-600 hover:text-blue-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  const statusSteps = [
    { key: 'pending', label: 'Order Received', icon: '📝', description: 'Your order has been received and is being processed' },
    { key: 'preparing', label: 'Preparing', icon: '👨‍🍳', description: 'Your order is being prepared with care' },
    { key: 'ready', label: 'Ready for Pickup', icon: '✅', description: 'Your order is ready! Please come to collect it' },
    { key: 'completed', label: 'Completed', icon: '🎉', description: 'Order completed. Thank you for your business!' }
  ];

  const currentStepIndex = statusSteps.findIndex(step => step.key === order.status);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Order #{String(order.id).slice(-6)}
        </h2>
        <p className="text-gray-600">
          Placed on {order.created_at 
            ? new Date(order.created_at).toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })
            : 'Unknown'
          }
        </p>
      </div>

      {/* Customer Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Customer Information</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-gray-500" />
            <span className="text-gray-900">{order.customer_info.name}</span>
          </div>
          {order.customer_info.phone && (
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">{order.customer_info.phone}</span>
            </div>
          )}
        </div>
      </div>

      {/* Status Progress */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-6">Order Status</h3>
        <div className="space-y-6">
          {statusSteps.map((step, index) => {
            const isCompleted = index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;
            
            return (
              <div key={step.key} className="relative flex items-start">
                {/* Progress Line */}
                {index < statusSteps.length - 1 && (
                  <div className={`absolute left-4 top-8 w-0.5 h-12 ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
                
                {/* Status Icon */}
                <div className={`
                  relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${isCompleted 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-200 text-gray-600'
                  }
                  ${isCurrent ? 'ring-4 ring-green-100' : ''}
                `}>
                  {isCompleted ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <span>{step.icon}</span>
                  )}
                </div>
                
                {/* Status Content */}
                <div className="ml-4 flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className={`font-medium ${
                      isCompleted ? 'text-green-700' : 'text-gray-500'
                    }`}>
                      {step.label}
                    </h4>
                    {isCurrent && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Current
                      </span>
                    )}
                  </div>
                  <p className={`text-sm mt-1 ${
                    isCompleted ? 'text-gray-700' : 'text-gray-500'
                  }`}>
                    {step.description}
                  </p>
                  {isCurrent && order.status === 'preparing' && (
                    <div className="mt-2 flex items-center space-x-1 text-sm text-blue-600">
                      <Clock className="h-4 w-4" />
                      <span>Estimated completion: {order.estimatedTime || 15} minutes</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Order Details</h3>
        <div className="space-y-3">
          {order.items?.map((item, index) => (
            <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">
                    {item.quantity}x {item.menu_name}
                  </span>
                </div>
                {item.customizations && Object.keys(item.customizations).length > 0 && (
                  <div className="text-sm text-gray-500 mt-1">
                    {Object.entries(item.customizations).map(([key, value]) => (
                      <span key={key} className="mr-2">
                        {key}: {Array.isArray(value) ? value.join(', ') : value}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <span className="font-medium text-gray-900">
                ฿{(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
        
        {/* Special Instructions */}
        {order.specialInstructions && (
          <div className="mt-4 p-3 bg-yellow-50 rounded-md">
            <p className="text-sm font-medium text-yellow-800">Special Instructions:</p>
            <p className="text-sm text-yellow-700 mt-1">{order.specialInstructions}</p>
          </div>
        )}
        
        {/* Total */}
        <div className="border-t pt-4 mt-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-gray-900">Total</span>
            <span className="text-lg font-bold text-green-600">
              ฿{Number(order.total).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Auto-refresh indicator */}
      <div className="text-center text-sm text-gray-500">
        <Clock className="h-4 w-4 inline mr-1" />
        Updates automatically every {refreshInterval / 1000} seconds
      </div>
    </div>
  );
};

export default OrderTracking;