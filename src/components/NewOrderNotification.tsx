import React from 'react';
import { X, User, Clock, Phone } from 'lucide-react';
import { Order } from '@/types';

interface NewOrderNotificationProps {
  order: Order;
  onClose: () => void;
  onViewOrder?: (orderId: string) => void;
}

const NewOrderNotification: React.FC<NewOrderNotificationProps> = ({ 
  order, 
  onClose,
  onViewOrder 
}) => {
  const handleViewOrder = () => {
    onViewOrder?.(order.id);
    onClose();
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
      <div className="bg-white border border-blue-200 rounded-lg shadow-lg p-4 animate-slide-in-right">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-bold text-sm">🆕</span>
            </div>
            <div>
              <h3 className="font-bold text-blue-800 text-sm">New Order!</h3>
              <p className="text-xs text-gray-600">Order #{String(order.id).slice(-6)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Customer Info */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center space-x-2 text-sm">
            <User className="h-4 w-4 text-gray-500" />
            <span className="font-medium">{order.customer_info.name}</span>
          </div>
          
          {order.customer_info.phone && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Phone className="h-4 w-4 text-gray-500" />
              <span>{order.customer_info.phone}</span>
            </div>
          )}
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="h-4 w-4 text-gray-500" />
            <span>
              {order.created_at 
                ? new Date(order.created_at).toLocaleTimeString('th-TH')
                : 'Just now'
              }
            </span>
          </div>
        </div>

        {/* Order Summary */}
        <div className="border-t pt-2 mb-3">
          <div className="space-y-1">
            {order.items?.slice(0, 2).map((item, index) => (
              <div key={index} className="flex justify-between text-xs">
                <span className="truncate mr-2">
                  {item.quantity}x {item.menu_name}
                </span>
                <span className="text-gray-600">
                  ฿{(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
            
            {order.items && order.items.length > 2 && (
              <div className="text-xs text-gray-500 italic">
                +{order.items.length - 2} more items
              </div>
            )}
          </div>
          
          <div className="flex justify-between items-center mt-2 pt-2 border-t">
            <span className="font-bold text-sm">Total</span>
            <span className="font-bold text-sm text-blue-600">
              ฿{Number(order.total).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <button
            onClick={handleViewOrder}
            className="flex-1 bg-blue-500 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-600 transition-colors"
          >
            View Order
          </button>
          <button
            onClick={onClose}
            className="px-3 py-2 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewOrderNotification;