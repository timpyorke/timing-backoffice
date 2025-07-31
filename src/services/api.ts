import { Order, MenuItem, DailySales, OrderStatus } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

class ApiService {
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: this.getHeaders(),
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
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
    
    return this.request(endpoint);
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    return this.request(`/admin/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async getMenuItems(): Promise<MenuItem[]> {
    return this.request('/admin/menu');
  }

  async createMenuItem(item: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<MenuItem> {
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

  async uploadMenuImage(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('image', file);
    
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/admin/menu/upload`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getOrder(orderId: string): Promise<Order> {
    return this.request(`/admin/orders/${orderId}`);
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
}

export const apiService = new ApiService();