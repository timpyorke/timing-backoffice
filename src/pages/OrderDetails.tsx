import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '@/services/api';
import { Order, OrderStatus } from '@/types';

interface ApiUpdateResponse {
  success: boolean;
  data: Partial<Order>;
  message?: string;
}
import { useLanguage } from '@/contexts/LanguageContext';
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
  const { language, t } = useLanguage();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [renderKey, setRenderKey] = useState(0);
  const fetchingRef = useRef(false);
  

  const formatDate = (dateInput: string | Date | null | undefined): string => {
    if (!dateInput) return t('common.na');
    const date = new Date(dateInput);
    const locale = language === 'th' ? 'th-TH' : 'en-US';
    return isNaN(date.getTime()) ? t('common.na') : date.toLocaleString(locale);
  };

  const formatDateOnly = (dateInput: string | Date | null | undefined): string => {
    if (!dateInput) return t('common.na');
    const date = new Date(dateInput);
    const locale = language === 'th' ? 'th-TH' : 'en-US';
    return isNaN(date.getTime()) ? t('common.na') : date.toLocaleDateString(locale);
  };

  const formatTimeOnly = (dateInput: string | Date | null | undefined): string => {
    if (!dateInput) return t('common.na');
    const date = new Date(dateInput);
    const locale = language === 'th' ? 'th-TH' : 'en-US';
    return isNaN(date.getTime()) ? t('common.na') : date.toLocaleTimeString(locale);
  };

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id || fetchingRef.current) return;
      
      fetchingRef.current = true;
      
      try {
        const fetchedOrder = await apiService.getOrder(id);
        setOrder(fetchedOrder);
      } catch (error) {
        console.error('Failed to fetch order:', error);
        toast.error('Failed to load order details');
        navigate('/orders');
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    };

    fetchOrder();
  }, [id, navigate]);

  // Monitor order state changes
  useEffect(() => {
    if (order) {
      console.log('📊 ORDER STATE CHANGED:', {
        id: order.id,
        status: order.status,
        updated_at: order.updated_at,
        renderKey: renderKey
      });
    }
  }, [order, renderKey]);


  const updateOrderStatus = async (newStatus: OrderStatus) => {
    if (!order) return;
    
    console.log('🔄 UPDATE STATUS - BEFORE:', {
      currentStatus: order.status,
      requestedStatus: newStatus,
      orderId: order.id
    });
    
    setUpdating(true);
    
    try {
      const apiResponse = await apiService.updateOrderStatus(order.id, newStatus);
      console.log('📡 API RESPONSE:', apiResponse);
      
      // Extract data from nested response structure
      // Handle both nested {success, data, message} and direct Order response
      const isNestedResponse = 'data' in apiResponse && 'success' in apiResponse;
      const responseData = isNestedResponse 
        ? (apiResponse as unknown as ApiUpdateResponse).data 
        : apiResponse;
      console.log('📊 RESPONSE DATA:', responseData);
      
      // Use the actual status from API response, not what we requested
      const actualStatus = responseData?.status || newStatus;
      
      console.log('💾 CREATING NEW ORDER STATE:', {
        originalOrder: order,
        responseData: responseData,
        actualStatus: actualStatus
      });
      
      // Create completely new order object to force React re-render
      const newOrderState: Order = {
        id: String(responseData?.id || order.id),
        customer_info: responseData?.customer_info || order.customer_info,
        items: order.items, // Keep existing items since API doesn't return them
        total: responseData?.total ? Number(responseData.total) : order.total,
        status: actualStatus, // Use the actual status from API
        created_at: responseData?.created_at || order.created_at,
        updated_at: responseData?.updated_at || new Date().toISOString(),
        // Copy any other existing fields, update with API response if available
        ...(order.specialInstructions && { specialInstructions: order.specialInstructions }),
        ...(responseData?.notes && { notes: responseData.notes }),
        ...(order.estimatedTime && { estimatedTime: order.estimatedTime }),
        ...(responseData?.customer_id && { customer_id: responseData.customer_id }),
        ...(responseData?.original_total && { original_total: responseData.original_total }),
        ...(responseData?.discount_amount && { discount_amount: responseData.discount_amount })
      };
      
      console.log('💾 FINAL NEW ORDER STATE:', newOrderState);
      
      // Set the new order state
      setOrder(newOrderState);
      
      // Wait a moment for state to update, then force re-render
      setTimeout(() => {
        setRenderKey(prev => prev + 1);
        console.log('🔄 FORCED RE-RENDER:', {
          oldStatus: order.status,
          newStatus: actualStatus,
          renderKey: renderKey + 1
        });
      }, 50);
      
      console.log('✅ UPDATE STATUS - COMPLETE:', {
        oldStatus: order.status,
        newStatus: actualStatus,
        stateSet: true
      });
      
      toast.success(`Order status updated to ${actualStatus}`);
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
          <h3>Order #${String(order.id).slice(-6)}</h3>
        </div>
        
        <div class="order-info">
          <p><strong>Customer:</strong> ${order.customer_info?.name || 'N/A'}</p>
          ${order.customer_info?.phone ? `<p><strong>Phone:</strong> ${order.customer_info.phone}</p>` : ''}
          ${order.customer_info?.email ? `<p><strong>Email:</strong> ${order.customer_info.email}</p>` : ''}
          <p><strong>Status:</strong> ${order.status.toUpperCase()}</p>
          <p><strong>Date:</strong> ${order.created_at ? (isNaN(new Date(order.created_at).getTime()) ? 'N/A' : new Date(order.created_at).toLocaleString()) : 'N/A'}</p>
        </div>
        
        <div class="items">
          <h4>Items:</h4>
          ${(order.items || []).map((item) => {
            const menuId = item.menu_id;
            return `
            <div class="item">
              <span>${item.quantity}x ${item.menu_name || `Menu Item #${menuId}`}</span>
              <span>฿${(Number(item.price) * item.quantity).toFixed(2)}</span>
            </div>
            ${item.customizations && Object.keys(item.customizations).length > 0 ? 
              Object.entries(item.customizations).map(([key, values]) => 
                values && values.length > 0 ? `<div style="margin-left: 20px; font-size: 12px; color: #666;">
                  ${key}: ${Array.isArray(values) ? values.join(', ') : values}
                </div>` : ''
              ).join('') : ''
            }`;
          }).join('')}
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
            <span>฿${getDisplayTotal().toFixed(2)}</span>
          </div>
        </div>
        
        <div class="footer">
          <p>Thank you for your business!</p>
          <p>Printed: ${new Date().toLocaleString('th-TH')}</p>
        </div>
      </body>
      </html>
    `;

    // Create a clean document structure
    printWindow.document.open();
    printWindow.document.close();
    printWindow.document.body.innerHTML = printContent;
    printWindow.focus();
    printWindow.print();
  };

  const getStatusColor = (status: OrderStatus): string => {
    switch (status) {
      case 'pending': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'preparing': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ready': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return <AlertCircle className="h-5 w-5" />;
      case 'preparing': return <Clock className="h-5 w-5" />;
      case 'ready': return <CheckCircle className="h-5 w-5" />;
      case 'completed': return <CheckCircle className="h-5 w-5" />;
      default: return <AlertCircle className="h-5 w-5" />;
    }
  };

  const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
    switch (currentStatus) {
      case 'pending': return 'preparing';
      case 'preparing': return 'ready';
      case 'ready': return 'completed';
      default: return null;
    }
  };

  const getStatusAction = (status: OrderStatus): string => {
    switch (status) {
      case 'pending': return 'Start Preparing';
      case 'preparing': return 'Mark Ready';
      case 'ready': return 'Complete Order';
      default: return '';
    }
  };

  const getStatusButtonColor = (status: OrderStatus): string => {
    switch (status) {
      case 'pending': return 'bg-blue-600 hover:bg-blue-700 text-white';
      case 'preparing': return 'bg-yellow-600 hover:bg-yellow-700 text-white';
      case 'ready': return 'bg-green-600 hover:bg-green-700 text-white';
      default: return 'bg-gray-600 hover:bg-gray-700 text-white';
    }
  };

  const isStatusCompleted = (currentStatus: OrderStatus, targetStatus: OrderStatus): boolean => {
    const statusOrder = ['pending', 'preparing', 'ready', 'completed'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const targetIndex = statusOrder.indexOf(targetStatus);
    return currentIndex >= targetIndex;
  };

  // Calculate total from items if total is missing or incorrect
  const getDisplayTotal = (): number => {
    if (order?.total && Number(order.total) > 0) {
      return Number(order.total);
    }
    
    // Fallback: calculate from items
    if (order?.items && Array.isArray(order.items)) {
      return order.items.reduce((sum, item) => {
        const price = Number(item.price || 0);
        const quantity = Number(item.quantity || 0);
        return sum + (price * quantity);
      }, 0);
    }
    
    return 0;
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
            onClick={() => navigate('/orders')}
            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            Order #{String(order.id).slice(-6)}
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
              <div className={`flex items-center ${isStatusCompleted(order.status, 'pending') ? 'text-green-600' : 'text-gray-400'}`}>
                <CheckCircle className="h-4 w-4 mr-3" />
                <span className="text-sm">Order Received</span>
                <span className="ml-auto text-xs text-gray-500">
                  {formatDate(order.created_at)}
                </span>
              </div>
              <div className={`flex items-center ${isStatusCompleted(order.status, 'preparing') ? 'text-green-600' : 'text-gray-400'}`}>
                <Clock className="h-4 w-4 mr-3" />
                <span className="text-sm">Preparing</span>
              </div>
              <div className={`flex items-center ${isStatusCompleted(order.status, 'ready') ? 'text-green-600' : 'text-gray-400'}`}>
                <CheckCircle className="h-4 w-4 mr-3" />
                <span className="text-sm">Ready for Pickup</span>
              </div>
              <div className={`flex items-center ${isStatusCompleted(order.status, 'completed') ? 'text-green-600' : 'text-gray-400'}`}>
                <CheckCircle className="h-4 w-4 mr-3" />
                <span className="text-sm">Completed</span>
              </div>
            </div>

            {/* Status Action Button */}
            {(() => {
              const currentStatus = order.status;
              const nextStatus = getNextStatus(currentStatus);
              const buttonText = getStatusAction(currentStatus);
              
              console.log('🔘 BUTTON RENDER:', {
                currentStatus,
                nextStatus,
                buttonText,
                updating
              });
              
              return nextStatus ? (
                <div key={`button-${currentStatus}-${renderKey}`} className="mt-6">
                  <button
                    onClick={() => updateOrderStatus(nextStatus)}
                    disabled={updating}
                    className={`w-full px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 ${getStatusButtonColor(currentStatus)}`}
                  >
                    {updating ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Updating...
                      </span>
                    ) : (
                      buttonText
                    )}
                  </button>
                </div>
              ) : null;
            })()}
          </div>

          {/* Order Items */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
            
            <div className="space-y-4">
              {(!order.items || order.items.length === 0) ? (
                <div className="text-center py-4 text-gray-500">
                  No items found for this order
                </div>
              ) : (
                order.items.map((item, index) => (
                  <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {item.quantity || 0}x {item.menu_name || `Menu Item #${item.menu_id || 'Unknown'}`}
                        </h3>
                        {item.customizations && Object.keys(item.customizations).length > 0 && (
                          <div className="mt-1 space-y-1">
                            {Object.entries(item.customizations).map(([key, values]) => {
                              // Skip empty values
                              if (!values || (Array.isArray(values) && values.length === 0) || values === '') return null;
                              
                              return (
                                <p key={key} className="text-sm text-gray-600 capitalize">
                                  <span className="font-medium">{key}:</span> {Array.isArray(values) ? values.join(', ') : values}
                                </p>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">฿{(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}</p>
                        <p className="text-sm text-gray-500">฿{Number(item.price || 0).toFixed(2)} each</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Total Amount</span>
                <span className="text-lg font-bold text-gray-900">฿{getDisplayTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Special Instructions and Notes */}
          {(order.specialInstructions || order.notes) && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {order.specialInstructions ? 'Special Instructions' : 'Notes'}
              </h2>
              {order.specialInstructions && (
                <div className="mb-4">
                  <h3 className="font-medium text-gray-900 mb-2">Special Instructions:</h3>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-md">{order.specialInstructions}</p>
                </div>
              )}
              {order.notes && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Notes:</h3>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-md">{order.notes}</p>
                </div>
              )}
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
                <span className="text-gray-900">{order.customer_info?.name || 'N/A'}</span>
              </div>
              
              {order.customer_info?.phone && (
                <div className="flex items-center">
                  <Phone className="h-4 w-4 text-gray-400 mr-3" />
                  <a 
                    href={`tel:${order.customer_info.phone}`}
                    className="text-primary-600 hover:text-primary-800 underline"
                  >
                    {order.customer_info.phone}
                  </a>
                </div>
              )}
              
              {order.customer_info?.email && (
                <div className="flex items-center">
                  <User className="h-4 w-4 text-gray-400 mr-3" />
                  <a 
                    href={`mailto:${order.customer_info.email}`}
                    className="text-primary-600 hover:text-primary-800 underline"
                  >
                    {order.customer_info.email}
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
                  <p className="text-sm text-gray-500">{formatDateOnly(order.created_at)}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-900">Order Time</p>
                  <p className="text-sm text-gray-500">{formatTimeOnly(order.created_at)}</p>
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