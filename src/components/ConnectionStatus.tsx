import React from 'react';
import { Wifi, WifiOff, AlertTriangle, Loader2 } from 'lucide-react';

interface ConnectionStatusProps {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onRetry?: () => void;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  status, 
  showText = true, 
  size = 'md',
  onRetry 
}) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'connected':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          text: 'Connected',
          icon: <Wifi className="h-4 w-4" />,
          pulse: false
        };
      case 'connecting':
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          text: 'Connecting...',
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          pulse: true
        };
      case 'error':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          text: 'Connection Error',
          icon: <AlertTriangle className="h-4 w-4" />,
          pulse: false
        };
      default: // disconnected
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          text: 'Disconnected',
          icon: <WifiOff className="h-4 w-4" />,
          pulse: false
        };
    }
  };

  const getSizeClasses = (size: 'sm' | 'md' | 'lg') => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs';
      case 'lg':
        return 'px-4 py-2 text-base';
      default:
        return 'px-3 py-1 text-sm';
    }
  };

  const config = getStatusConfig(status);
  const sizeClasses = getSizeClasses(size);

  return (
    <div className="flex items-center space-x-2">
      <span className={`
        inline-flex items-center rounded-full font-medium border
        ${config.color} ${sizeClasses}
        ${config.pulse ? 'animate-pulse' : ''}
      `}>
        <span className="mr-1">
          {config.icon}
        </span>
        {showText && <span>{config.text}</span>}
      </span>
      
      {(status === 'disconnected' || status === 'error') && onRetry && (
        <button
          onClick={onRetry}
          className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
};

export default ConnectionStatus;