import React from 'react';
import { OrderStatus, normalizeOrderStatus } from '@/types';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ChefHat,
  XCircle 
} from 'lucide-react';

interface OrderStatusBadgeProps {
  status: OrderStatus | string; // Allow string to handle API responses
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ 
  status, 
  showIcon = true, 
  size = 'md' 
}) => {
  const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          text: 'Pending',
          icon: <AlertCircle className="h-4 w-4" />
        };
      case 'preparing':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          text: 'Preparing',
          icon: <ChefHat className="h-4 w-4" />
        };
      case 'ready':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          text: 'Ready',
          icon: <CheckCircle className="h-4 w-4" />
        };
      case 'completed':
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          text: 'Completed',
          icon: <CheckCircle className="h-4 w-4" />
        };
      case 'cancelled':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          text: 'Cancelled',
          icon: <XCircle className="h-4 w-4" />
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          text: 'Unknown',
          icon: <Clock className="h-4 w-4" />
        };
    }
  };

  const getSizeClasses = (size: 'sm' | 'md' | 'lg') => {
    switch (size) {
      case 'sm':
        return 'px-2 py-0.5 text-xs';
      case 'lg':
        return 'px-4 py-2 text-base';
      default:
        return 'px-2.5 py-0.5 text-sm';
    }
  };

  // Normalize the status to handle API responses that might be capitalized
  const normalizedStatus = typeof status === 'string' ? normalizeOrderStatus(status) : status;
  const config = getStatusConfig(normalizedStatus);
  const sizeClasses = getSizeClasses(size);

  return (
    <span className={`
      inline-flex items-center rounded-full font-medium border
      ${config.color} ${sizeClasses}
    `}>
      {showIcon && (
        <span className="mr-1">
          {config.icon}
        </span>
      )}
      <span>{config.text}</span>
    </span>
  );
};

export default OrderStatusBadge;