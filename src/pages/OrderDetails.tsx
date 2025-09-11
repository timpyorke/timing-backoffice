import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '@/services/api';
import { Order, OrderStatus, ApiStatusUpdateResponse } from '@/types';

// Type guard to check if response is nested
function isNestedApiResponse(response: Order | ApiStatusUpdateResponse): response is ApiStatusUpdateResponse {
  return typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    'data' in response &&
    typeof (response as ApiStatusUpdateResponse).success === 'boolean';
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
import { formatPrice } from '@/utils/format';

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



  const updateOrderStatus = async (newStatus: OrderStatus) => {
    if (!order) return;

    setUpdating(true);

    try {
      const apiResponse = await apiService.updateOrderStatus(order.id, newStatus);

      // Extract data from nested response structure using type guard
      // Handle both nested {success, data, message} and direct Order response
      const responseData = isNestedApiResponse(apiResponse)
        ? apiResponse.data
        : apiResponse;

      // Use the actual status from API response, not what we requested
      const actualStatus = responseData?.status || newStatus;

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

      // Set the new order state
      setOrder(newOrderState);

      // Force re-render to ensure UI updates
      setTimeout(() => {
        setRenderKey(prev => prev + 1);
      }, 50);

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
              <span>฿${formatPrice(Number(item.price) * item.quantity)}</span>
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
          <div class="item" style="font-weight: normal;">
            <span>Subtotal:</span>
            <span>฿${formatPrice(getSubtotal())}</span>
          </div>
          ${getDiscountAmount() > 0 ? `
          <div class="item" style="color: #166534; font-weight: normal;">
            <span>Discount:</span>
            <span>-฿${formatPrice(getDiscountAmount())}</span>
          </div>
          ` : ''}
          <div class="item">
            <span>Total Amount:</span>
            <span>฿${formatPrice(getDisplayTotal())}</span>
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

  // Payment image URL is computed inline at render from total

  const getStatusColor = (status: OrderStatus): string => {
    switch (status) {
      case 'pending': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'preparing': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ready': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return <AlertCircle className="h-5 w-5" />;
      case 'preparing': return <Clock className="h-5 w-5" />;
      case 'ready': return <CheckCircle className="h-5 w-5" />;
      case 'completed': return <CheckCircle className="h-5 w-5" />;
      case 'cancelled': return <AlertCircle className="h-5 w-5" />;
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

  // Calculate subtotal, discount, and grand total similar to checkout page
  const getSubtotal = (): number => {
    // Prefer original_total if provided by API
    const original = order?.original_total;
    if (original !== undefined && original !== null) {
      const n = Number(original);
      if (!isNaN(n) && n >= 0) return n;
    }

    // Fallback: calculate from items
    if (order?.items && Array.isArray(order.items)) {
      return order.items.reduce((sum, item) => {
        const price = Number(item.price || 0);
        const quantity = Number(item.quantity || 0);
        return sum + price * quantity;
      }, 0);
    }
    return 0;
  };

  const getDiscountAmount = (): number => {
    const disc = order?.discount_amount;
    if (disc === undefined || disc === null) return 0;
    const n = Number(disc);
    return isNaN(n) ? 0 : Math.max(0, n);
  };

  const getDisplayTotal = (): number => {
    const subtotal = getSubtotal();
    const discount = getDiscountAmount();
    // If discount exists, always use subtotal - discount to mirror checkout
    if (discount > 0) {
      const total = Math.max(0, subtotal - discount);
      return Number(total.toFixed(2));
    }
    // Otherwise, use API total if valid
    if (order?.total !== undefined && order?.total !== null) {
      const t = Number(order.total);
      if (!isNaN(t) && t >= 0) return Number(t.toFixed(2));
    }
    // Fallback to subtotal
    return Number(subtotal.toFixed(2));
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
    <div className="space-y-6 pb-24">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              const canCancel = currentStatus !== 'completed' && currentStatus !== 'cancelled';
              return (
                <div key={`button-${currentStatus}-${renderKey}`} className="mt-6 hidden lg:flex gap-3">
                  {canCancel && (
                    <button
                      onClick={() => {
                        if (confirm('Cancel this order? This cannot be undone.')) {
                          updateOrderStatus('cancelled');
                        }
                      }}
                      disabled={updating}
                      className={`px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 bg-red-600 hover:bg-red-700 text-white`}
                    >
                      {updating ? 'Cancelling...' : 'Cancel Order'}
                    </button>
                  )}
                  {nextStatus && (
                    <button
                      onClick={() => updateOrderStatus(nextStatus)}
                      disabled={updating}
                      className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 ${getStatusButtonColor(currentStatus)}`}
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
                  )}
                </div>
              );
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
                        <p className="font-medium text-gray-900">฿{formatPrice(Number(item.price || 0) * Number(item.quantity || 0))}</p>
                        <p className="text-sm text-gray-500">฿{formatPrice(Number(item.price || 0))} each</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200 space-y-1">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>฿{formatPrice(getSubtotal())}</span>
              </div>
              {getDiscountAmount() > 0 && (
                <div className="flex justify-between text-sm text-green-700">
                  <span>Discount</span>
                  <span>-฿{formatPrice(getDiscountAmount())}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2">
                <span className="text-lg font-semibold text-gray-900">Total Amount</span>
                <span className="text-lg font-bold text-gray-900">฿{formatPrice(getDisplayTotal())}</span>
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

              {order.customer_info?.table_number && (
                <div className="flex items-center">
                  <span className="h-4 w-4 text-gray-400 mr-3">🍽️</span>
                  <span className="text-gray-900">Table: {order.customer_info.table_number}</span>
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

              {/* Thai QR Payment styled block */}
              <div className="mt-2 flex flex-col items-center">
                <div className="h-px w-full max-w-sm bg-gray-200 mb-3"></div>
                <p className="text-base md:text-lg font-bold text-gray-900 text-center mb-3">Payment QR</p>
                <div className="border rounded-lg overflow-hidden w-full max-w-sm bg-white mx-auto">
                  {/* Header brand bar */}
                  <div className="bg-[#103D5B] text-white px-4 py-3 flex items-center justify-center gap-2">
                    {/* Simple placeholder logo */}
                    <div className="h-6 w-6 rounded bg-white/10 flex items-center justify-center text-white text-xs font-bold">QR</div>
                    <div className="text-sm font-semibold tracking-wide">THAI QR PAYMENT</div>
                  </div>
                  {/* PromptPay label */}
                  <div className="px-6 pt-5 flex justify-center">
                    <div className="inline-flex items-center border-2 border-[#1B4E8F] px-4 py-1 rounded">
                      <span className="text-[#1B4E8F] text-sm font-semibold mr-2">Prompt</span>
                      <span className="bg-[#1B4E8F] text-white text-sm font-semibold px-1">Pay</span>
                      <span className="ml-3 text-[#1B4E8F] text-xs">พร้อมเพย์</span>
                    </div>
                  </div>
                  {/* QR with center logo overlay */}
                  <div className="px-6 py-5">
                    <div className="relative mx-auto w-full max-w-[260px] aspect-square bg-white">
                      <img
                        src={(() => {
                          const totalAmount = getDisplayTotal();
                          const amountParam = Number.isInteger(totalAmount)
                            ? String(totalAmount)
                            : String(Number(totalAmount.toFixed(2)));
                          return `https://rub-tung.vercel.app/api/0990995156?amont=${encodeURIComponent(amountParam)}`;
                        })()}
                        alt="Thai QR Payment"
                        className="absolute inset-0 w-full h-full object-contain select-none"
                        onError={(e) => {
                          console.error('Failed to load payment image');
                          (e.target as HTMLImageElement).style.display = 'none';
                          toast.error('Unable to load payment image');
                        }}
                      />
                      {/* Center logo overlay */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="h-14 w-14 rounded-md bg-white border-2 border-[#103D5B] flex items-center justify-center shadow-sm">
                          <div className="h-8 w-8 rounded-md bg-[#19B3A6] flex items-center justify-center text-white text-xs font-bold">PP</div>
                        </div>
                      </div>
                    </div>
                  </div>
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

      {/* Sticky bottom action bar for small/tablet screens */}
      {(() => {
        const currentStatus = order.status;
        const nextStatus = getNextStatus(currentStatus);
        const buttonText = getStatusAction(currentStatus);
        const canCancel = currentStatus !== 'completed' && currentStatus !== 'cancelled';
        return (
          <div className="fixed inset-x-0 bottom-0 z-20 bg-white/95 backdrop-blur border-t border-gray-200 shadow-sm lg:hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-3">
              <div className="flex gap-3">
                {canCancel && (
                  <button
                    onClick={() => {
                      if (confirm('Cancel this order? This cannot be undone.')) {
                        updateOrderStatus('cancelled');
                      }
                    }}
                    disabled={updating}
                    className="tap-target rounded-md font-medium px-4 py-3 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                  >
                    {updating ? 'Cancelling...' : 'Cancel'}
                  </button>
                )}
                {nextStatus && (
                  <button
                    onClick={() => updateOrderStatus(nextStatus)}
                    disabled={updating}
                    className={`flex-1 tap-target rounded-md font-medium transition-colors disabled:opacity-50 px-4 py-3 ${getStatusButtonColor(currentStatus)}`}
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
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default OrderDetails;
