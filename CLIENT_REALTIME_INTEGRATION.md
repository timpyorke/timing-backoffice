# Real-Time Order Integration Guide for Client Applications

## 🎯 Overview
This guide provides everything needed to integrate real-time order features with the Timing API. The system supports WebSocket connections for live updates and comprehensive order management.

## 🚀 Quick Start Integration Prompt

### For Frontend Developers

```
I need to integrate real-time order tracking with my [React/Vue/Angular/Native] application. 

**Backend API Details:**
- Base URL: http://localhost:8000 (or your deployed URL)
- WebSocket URL: ws://localhost:8000/admin
- Authentication: JWT Bearer tokens

**Required Features:**
1. Real-time order status updates
2. Live order notifications for admins
3. Customer order tracking
4. Admin dashboard with live updates

**Current API Endpoints:**
- POST /api/orders - Create new order
- GET /api/orders/:id/status - Check order status
- PUT /api/admin/orders/:id/status - Update order status (admin)
- GET /api/admin/orders - Get all orders (admin)

**WebSocket Events:**
- newOrder - New order created
- orderStatusUpdate - Order status changed
- connection - Client connected
- disconnect - Client disconnected

Please provide:
1. WebSocket client setup code
2. Real-time order status component
3. Admin notification system
4. Order tracking interface
5. Error handling and reconnection logic
```

## 📡 WebSocket Integration Examples

### JavaScript/TypeScript WebSocket Client

```javascript
class TimingOrderClient {
  constructor(baseUrl = 'ws://localhost:8000', token = null) {
    this.baseUrl = baseUrl;
    this.token = token;
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect() {
    const wsUrl = `${this.baseUrl}/admin?token=${this.token}`;
    this.socket = new WebSocket(wsUrl);
    
    this.socket.onopen = () => {
      console.log('Connected to Timing API');
      this.reconnectAttempts = 0;
    };
    
    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleMessage(data);
    };
    
    this.socket.onclose = () => {
      this.handleReconnect();
    };
    
    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  handleMessage(data) {
    switch (data.type) {
      case 'newOrder':
        this.onNewOrder(data.order);
        break;
      case 'orderStatusUpdate':
        this.onOrderStatusUpdate(data.order, data.status);
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  }

  onNewOrder(order) {
    // Handle new order notification
    console.log('New order received:', order);
  }

  onOrderStatusUpdate(order, status) {
    // Handle order status update
    console.log('Order status updated:', order.id, status);
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect();
      }, 2000 * this.reconnectAttempts);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
    }
  }
}
```

### React Hook Implementation

```javascript
import { useState, useEffect, useRef } from 'react';

export const useTimingOrders = (token) => {
  const [orders, setOrders] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [newOrderNotification, setNewOrderNotification] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token) return;

    const connectWebSocket = () => {
      const ws = new WebSocket(`ws://localhost:8000/admin?token=${token}`);
      socketRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus('connected');
        console.log('Connected to Timing API');
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'newOrder':
            setOrders(prev => [data.order, ...prev]);
            setNewOrderNotification(data.order);
            // Clear notification after 5 seconds
            setTimeout(() => setNewOrderNotification(null), 5000);
            break;
            
          case 'orderStatusUpdate':
            setOrders(prev => 
              prev.map(order => 
                order.id === data.order.id 
                  ? { ...order, status: data.status, updated_at: new Date().toISOString() }
                  : order
              )
            );
            break;
        }
      };

      ws.onclose = () => {
        setConnectionStatus('disconnected');
        // Reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
      };
    };

    connectWebSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [token]);

  const updateOrderStatus = async (orderId, status) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update order status');
      }
      
      // WebSocket will handle the real-time update
      return await response.json();
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  };

  return {
    orders,
    connectionStatus,
    newOrderNotification,
    updateOrderStatus
  };
};
```

## 🎨 React Components

### Order Status Badge Component

```jsx
const OrderStatusBadge = ({ status }) => {
  const statusConfig = {
    pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
    preparing: { color: 'bg-blue-100 text-blue-800', text: 'Preparing' },
    ready: { color: 'bg-green-100 text-green-800', text: 'Ready' },
    completed: { color: 'bg-gray-100 text-gray-800', text: 'Completed' },
    cancelled: { color: 'bg-red-100 text-red-800', text: 'Cancelled' }
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      {config.text}
    </span>
  );
};
```

### Real-Time Order Dashboard

```jsx
import { useTimingOrders } from './hooks/useTimingOrders';

const OrderDashboard = ({ token }) => {
  const { orders, connectionStatus, newOrderNotification, updateOrderStatus } = useTimingOrders(token);

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
    } catch (error) {
      alert('Failed to update order status');
    }
  };

  return (
    <div className="p-6">
      {/* Connection Status */}
      <div className="mb-4">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          connectionStatus === 'connected' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {connectionStatus === 'connected' ? '🟢 Connected' : '🔴 Disconnected'}
        </span>
      </div>

      {/* New Order Notification */}
      {newOrderNotification && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-bold text-blue-800">🆕 New Order!</h3>
          <p>Order #{newOrderNotification.id} from {newOrderNotification.customer_info.name}</p>
        </div>
      )}

      {/* Orders List */}
      <div className="space-y-4">
        {orders.map(order => (
          <div key={order.id} className="border rounded-lg p-4 bg-white shadow">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-bold">Order #{order.id}</h3>
                <p className="text-gray-600">{order.customer_info.name}</p>
              </div>
              <OrderStatusBadge status={order.status} />
            </div>
            
            <div className="mb-3">
              <p className="text-sm text-gray-500">
                Created: {new Date(order.created_at).toLocaleString()}
              </p>
              <p className="font-semibold">Total: ฿{order.total}</p>
            </div>

            {/* Status Update Buttons */}
            <div className="flex gap-2 flex-wrap">
              {['pending', 'preparing', 'ready', 'completed'].map(status => (
                <button
                  key={status}
                  onClick={() => handleStatusUpdate(order.id, status)}
                  disabled={order.status === status}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    order.status === status
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Customer Order Tracking

```jsx
const OrderTracking = ({ orderId }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${orderId}/status`);
        const data = await response.json();
        setOrder(data.data);
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchOrder, 30000);
    
    return () => clearInterval(interval);
  }, [orderId]);

  if (loading) return <div>Loading order details...</div>;
  if (!order) return <div>Order not found</div>;

  const statusSteps = [
    { key: 'pending', label: 'Order Received', icon: '📝' },
    { key: 'preparing', label: 'Preparing', icon: '👨‍🍳' },
    { key: 'ready', label: 'Ready for Pickup', icon: '✅' },
    { key: 'completed', label: 'Completed', icon: '🎉' }
  ];

  const currentStepIndex = statusSteps.findIndex(step => step.key === order.status);

  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">Order #{order.id}</h2>
      
      <div className="mb-6">
        <h3 className="font-semibold mb-2">Customer</h3>
        <p>{order.customer_info.name}</p>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold mb-2">Status Progress</h3>
        <div className="space-y-4">
          {statusSteps.map((step, index) => (
            <div key={step.key} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                index <= currentStepIndex 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {index <= currentStepIndex ? '✓' : step.icon}
              </div>
              <div className="ml-3">
                <p className={`font-medium ${
                  index <= currentStepIndex ? 'text-green-700' : 'text-gray-500'
                }`}>
                  {step.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Items</h3>
        <div className="space-y-2">
          {order.items.map(item => (
            <div key={item.id} className="flex justify-between">
              <span>{item.quantity}x {item.menu_name}</span>
              <span>฿{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="border-t pt-2 mt-2">
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>฿{order.total}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
```

## 📱 Mobile Integration (React Native)

```javascript
// For React Native WebSocket
import { useEffect, useState } from 'react';

export const useTimingOrdersNative = (token) => {
  const [orders, setOrders] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  useEffect(() => {
    if (!token) return;

    const ws = new WebSocket(`ws://your-api-url.com/admin?token=${token}`);

    ws.onopen = () => {
      setConnectionStatus('connected');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'newOrder') {
        setOrders(prev => [data.order, ...prev]);
        // Show push notification
        showLocalNotification('New Order', `Order #${data.order.id} received`);
      } else if (data.type === 'orderStatusUpdate') {
        setOrders(prev => 
          prev.map(order => 
            order.id === data.order.id 
              ? { ...order, status: data.status }
              : order
          )
        );
      }
    };

    ws.onclose = () => {
      setConnectionStatus('disconnected');
    };

    return () => ws.close();
  }, [token]);

  return { orders, connectionStatus };
};
```

## 🔧 Environment Configuration

```javascript
// config/api.js
export const API_CONFIG = {
  development: {
    baseUrl: 'http://localhost:8000',
    wsUrl: 'ws://localhost:8000'
  },
  production: {
    baseUrl: 'https://your-api.com',
    wsUrl: 'wss://your-api.com'
  }
};

export const getApiConfig = () => {
  return API_CONFIG[process.env.NODE_ENV] || API_CONFIG.development;
};
```

## ✅ Testing the Integration

```javascript
// Test WebSocket connection
const testConnection = () => {
  const client = new TimingOrderClient('ws://localhost:8000', 'your-jwt-token');
  
  client.onNewOrder = (order) => {
    console.log('✅ New order received:', order);
  };
  
  client.onOrderStatusUpdate = (order, status) => {
    console.log('✅ Order status updated:', order.id, status);
  };
  
  client.connect();
  
  // Test after 5 seconds
  setTimeout(() => {
    console.log('Connection status:', client.socket.readyState);
  }, 5000);
};
```

## 🎯 Integration Checklist

- [ ] WebSocket client setup
- [ ] Authentication with JWT tokens
- [ ] Real-time order notifications
- [ ] Order status updates
- [ ] Error handling and reconnection
- [ ] Mobile push notifications (if applicable)
- [ ] Offline state management
- [ ] Loading states and UI feedback
- [ ] Order tracking interface
- [ ] Admin dashboard integration

## 🚀 Next Steps

1. **Copy the WebSocket client code** for your framework
2. **Set up authentication** with the login endpoint
3. **Implement the UI components** for your design system
4. **Test the real-time features** with the running API
5. **Add error handling** and reconnection logic
6. **Deploy and monitor** the integration

## 📞 Support

For additional help with integration:
- Check the API documentation at `/api-docs`
- Review the WebSocket stats at `/api/admin/websocket/stats`
- Test endpoints with the provided Postman collection

Happy coding! 🎉