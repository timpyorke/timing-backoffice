export interface Order {
  order: any;
  data: any;
  id: string;
  customer_info: {
    name: string;
    email?: string;
    phone: string;
  };
  items: OrderItem[];
  status: OrderStatus;
  total: number;
  createdAt: Date;
  updatedAt: Date;
  estimatedTime?: number;
  specialInstructions?: string;
}

export interface OrderItem {
  menu_id: number;
  menu_name: string;
  quantity: number;
  price: number;
  customizations?: {
    size?: string;
    extras?: string[];
    [key: string]: any;
  };
}

export interface Customization {
  id: string;
  name: string;
  value: string;
  additionalPrice: number;
}

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  base_price: number;
  category: string;
  image_url?: string;
  active: boolean;
  customizations?: {
    sizes?: string[];
    milk?: string[];
    extras?: string[];
    [key: string]: string[] | undefined;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomizationOption {
  id: string;
  name: string;
  type: 'select' | 'multiselect' | 'text';
  options: string[];
  required: boolean;
  additionalPrice?: number;
}

export interface DailySales {
  date: string;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  topItems: {
    name: string;
    quantity: number;
    revenue: number;
  }[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'staff';
  createdAt: Date;
}

export interface NotificationPayload {
  orderId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}