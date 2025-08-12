import { Order, MenuItem, DailySales, OrderStatus, SalesInsights, TopSellingItemsResponse, normalizeOrderStatus, ApiStatusUpdateResponse } from '@/types';
import { auth } from '@/services/firebase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

class ApiService {
  private refreshTokenPromise: Promise<string> | null = null;

  // Helper function to normalize order data from API response
  private normalizeOrder(order: unknown): Order {
    if (!order || typeof order !== 'object') {
      throw new Error('Invalid order data received from API');
    }

    const orderData = order as Record<string, unknown>;
    
    return {
      id: orderData.id ? String(orderData.id) : '',
      customer_info: this.normalizeCustomerInfo(orderData.customer_info),
      items: this.normalizeOrderItems(orderData.items),
      total: this.normalizeTotal(orderData.total),
      status: normalizeOrderStatus(orderData.status as string),
      created_at: orderData.created_at as string || new Date().toISOString(),
      updated_at: orderData.updated_at as string || new Date().toISOString(),
      customer_id: orderData.customer_id as string,
      estimatedTime: orderData.estimatedTime as number,
      specialInstructions: orderData.specialInstructions as string,
      notes: orderData.notes as string | null,
      original_total: orderData.original_total as number | string | null,
      discount_amount: orderData.discount_amount as number | string | null,
    };
  }

  private normalizeCustomerInfo(customerInfo: unknown): Order['customer_info'] {
    if (!customerInfo || typeof customerInfo !== 'object') {
      return { name: 'Unknown Customer' };
    }
    
    const info = customerInfo as Record<string, unknown>;
    return {
      name: (info.name as string) || 'Unknown Customer',
      email: info.email as string,
      phone: info.phone as string,
    };
  }

  private normalizeOrderItems(items: unknown): Order['items'] {
    if (!Array.isArray(items)) {
      return [];
    }
    
    return items.map((item: unknown) => {
      if (!item || typeof item !== 'object') {
        throw new Error('Invalid order item data');
      }
      
      const itemData = item as Record<string, unknown>;
      return {
        id: itemData.id as number,
        menu_id: Number(itemData.menu_id) || 0,
        menu_name: (itemData.menu_name as string) || 'Unknown Item',
        menu_description: itemData.menu_description as string,
        menu_description_th: itemData.menu_description_th as string,
        image_url: itemData.image_url as string,
        quantity: Number(itemData.quantity) || 0,
        price: this.normalizeTotal(itemData.price),
        customizations: itemData.customizations as Record<string, unknown>,
      };
    });
  }

  private normalizeTotal(total: unknown): number {
    if (typeof total === 'string') {
      const parsed = parseFloat(total);
      return isNaN(parsed) ? 0 : parsed;
    }
    if (typeof total === 'number') {
      return total;
    }
    return 0;
  }

  // Helper function to normalize array of orders
  private normalizeOrders(orders: unknown[]): Order[] {
    return orders.map(order => this.normalizeOrder(order));
  }

  private async getHeaders(): Promise<HeadersInit> {
    const token = await this.getValidToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async getValidToken(): Promise<string | null> {
    try {
      const user = auth.currentUser;
      if (!user) {
        return localStorage.getItem('token');
      }

      // Check if token needs refresh (Firebase handles this internally)
      const token = await user.getIdToken(false); // false = don't force refresh
      
      // Update localStorage with the current token
      if (token) {
        localStorage.setItem('token', token);
      }
      
      return token;
    } catch (error) {
      console.error('Error getting valid token:', error);
      return localStorage.getItem('token');
    }
  }

  private async refreshToken(): Promise<string> {
    // Prevent multiple simultaneous refresh attempts
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise;
    }

    this.refreshTokenPromise = this.performTokenRefresh();
    
    try {
      const token = await this.refreshTokenPromise;
      return token;
    } finally {
      this.refreshTokenPromise = null;
    }
  }

  private async performTokenRefresh(): Promise<string> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user found');
      }

      // Force refresh the token
      const newToken = await user.getIdToken(true);
      
      if (newToken) {
        localStorage.setItem('token', newToken);
        console.log('Token refreshed successfully');
        return newToken;
      } else {
        throw new Error('Failed to get new token');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Clear invalid tokens
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login if needed
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      throw error;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retries = 3,
    delay = 1000
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    try {
      const headers = await this.getHeaders();
      const response = await fetch(url, {
        headers,
        ...options,
      });

      if (response.status === 429 && retries > 0) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '1', 10);
        const waitTime = retryAfter * 1000 + Math.random() * 1000; // Add jitter
        
        console.warn(`Rate limited. Retrying after ${waitTime / 1000} seconds...`);
        await new Promise(res => setTimeout(res, waitTime));
        
        return this.request(endpoint, options, retries - 1, delay * 2);
      }
      
      if (response.status === 401) {
        console.log('Token expired, attempting refresh...');
        
        try {
          await this.refreshToken();
          
          const newHeaders = await this.getHeaders();
          const retryResponse = await fetch(url, {
            headers: newHeaders,
            ...options,
          });
          
          if (!retryResponse.ok) {
            throw new Error(`API Error: ${retryResponse.status} ${retryResponse.statusText}`);
          }
          
          return retryResponse.json();
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          throw new Error('Authentication failed. Please login again.');
        }
      }

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      if (retries > 0) {
        console.warn(`Request failed. Retrying in ${delay / 1000}s...`, error);
        await new Promise(res => setTimeout(res, delay));
        return this.request(endpoint, options, retries - 1, delay * 2);
      }
      console.error('API request failed after multiple retries:', error);
      throw error;
    }
  }

  async getOrders(filters?: {
    status?: OrderStatus;
    date?: string;
    limit?: number;
  }): Promise<Order[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.date) params.append('date', filters.date);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const queryString = params.toString();
    const endpoint = `/admin/orders${queryString ? `?${queryString}` : ''}`;
    
    const result = await this.request<any>(endpoint);
    
    // Handle different API response structures
    if (Array.isArray(result)) {
      const normalized = this.normalizeOrders(result);
      console.log(`API: Fetched ${normalized.length} orders (direct array)`);
      return normalized;
    } else if (result && result.success && result.data && Array.isArray(result.data.orders)) {
      const normalized = this.normalizeOrders(result.data.orders);
      console.log(`API: Fetched ${normalized.length} orders from success.data.orders structure`);
      return normalized;
    } else if (result && result.data && Array.isArray(result.data)) {
      const normalized = this.normalizeOrders(result.data);
      console.log(`API: Fetched ${normalized.length} orders from data array structure`);
      return normalized;
    } else {
      console.warn('API: Unexpected orders response structure:', result);
      return [];
    }
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order | ApiStatusUpdateResponse> {
    console.log(`API: Updating order ${orderId} to status ${status}`);
    
    try {
      const result = await this.request<ApiStatusUpdateResponse | Order>(`/admin/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      
      console.log(`API: Raw response for order ${orderId}:`, result);
      
      // Check if response is nested format
      if (this.isApiStatusUpdateResponse(result)) {
        // Return the nested response as-is for OrderDetails to handle
        return result;
      } else {
        // If it's a direct Order response, normalize it
        const normalizedOrder = this.normalizeOrder(result);
        console.log(`API: Normalized order ${orderId}:`, normalizedOrder);
        return normalizedOrder;
      }
    } catch (error) {
      console.error(`API: Failed to update order ${orderId}:`, error);
      throw error;
    }
  }

  private isApiStatusUpdateResponse(response: unknown): response is ApiStatusUpdateResponse {
    return typeof response === 'object' && 
           response !== null && 
           'success' in response && 
           'data' in response;
  }

  async getMenuItems(): Promise<MenuItem[]> {
    return this.request('/admin/menu');
  }

  async getMenuItemById(id: string): Promise<MenuItem> {
    return this.request(`/admin/menu/${id}`);
  }

  async createMenuItem(item: Omit<MenuItem, 'id' | 'created_at' | 'updated_at'>): Promise<MenuItem> {
    return this.request('/admin/menu', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  }

  async updateMenuItem(id: string, item: Partial<MenuItem>): Promise<MenuItem> {
    return this.request(`/admin/menu/${id}`, {
      method: 'PUT',
      body: JSON.stringify(item),
    });
  }

  async deleteMenuItem(id: string): Promise<void> {
    return this.request(`/admin/menu/${id}`, {
      method: 'DELETE',
    });
  }

  async getDailySales(date?: string): Promise<DailySales> {
    const endpoint = `/admin/sales/today${date ? `?date=${date}` : ''}`;
    return this.request(endpoint);
  }


  async getOrder(orderId: string): Promise<Order> {
    const result = await this.request<any>(`/admin/orders/${orderId}`);
    
    // Handle new API response structure: { success: true, data: Order }
    if (result && result.success && result.data) {
      return this.normalizeOrder(result.data);
    }
    
    return this.normalizeOrder(result);
  }

  async deleteOrder(orderId: string): Promise<void> {
    return this.request(`/admin/orders/${orderId}`, {
      method: 'DELETE',
    });
  }

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const url = `${API_BASE_URL.replace('/api', '')}/health`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  async getSalesInsights(filters?: {
    start_date?: string;
    end_date?: string;
  }): Promise<SalesInsights> {
    const params = new URLSearchParams();
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    
    const queryString = params.toString();
    const endpoint = `/admin/sales/insights${queryString ? `?${queryString}` : ''}`;
    
    return this.request(endpoint);
  }

  async getTopSellingItems(filters?: {
    start_date?: string;
    end_date?: string;
    limit?: number;
  }): Promise<TopSellingItemsResponse> {
    const params = new URLSearchParams();
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const queryString = params.toString();
    const endpoint = `/admin/sales/top-items${queryString ? `?${queryString}` : ''}`;
    
    return this.request(endpoint);
  }
}

export const apiService = new ApiService();