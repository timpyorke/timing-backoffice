export interface Order {
  id: string;
  customer_info: {
    name: string;
    email?: string;
    phone?: string;
    table_number?: string;
  };
  customer_id?: string;
  items: OrderItem[];
  status: OrderStatus;
  total: number;
  created_at: Date | string;
  updated_at: Date | string;
  estimatedTime?: number;
  specialInstructions?: string;
  notes?: string | null;
  original_total?: number | string | null;
  discount_amount?: number | string | null;
}

export interface ApiStatusUpdateResponse {
  success: boolean;
  data: {
    id: number | string;
    customer_info?: {
      name: string;
      email?: string;
      phone?: string;
      table_number?: string;
    };
    status: OrderStatus;
    total?: string | number;
    created_at?: string;
    updated_at?: string;
    customer_id?: string;
    notes?: string | null;
    original_total?: string | number | null;
    discount_amount?: string | number | null;
  };
  message?: string;
}

export interface OrderItem {
  id?: number;
  menu_id: number;
  menu_name: string;
  menu_description?: string | null;
  menu_description_th?: string | null;
  image_url?: string;
  quantity: number;
  price: number;
  customizations?: {
    size?: string;
    milk?: string;
    extras?: string[];
    sweetness?: string;
    temperature?: string;
    [key: string]: any;
  };
}

// Payload for creating a new order from Admin
export interface CreateOrderInput {
  customer_info: {
    name: string;
    email?: string;
    phone?: string;
    table_number?: string;
  };
  customer_id?: string;
  items: Array<{
    menu_id: number;
    quantity: number;
    price?: number;
    customizations?: Record<string, unknown>;
  }>;
  notes?: string | null;
  specialInstructions?: string;
  estimatedTime?: number;
  discount_amount?: number;
  discount_code?: string;
  original_total?: number;
}

export interface Customization {
  id: string;
  name: string;
  value: string;
  additionalPrice: number;
}

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';

// Helper function to normalize status from API (which might return capitalized values)
export function normalizeOrderStatus(status: string | undefined | null): OrderStatus {
  if (!status) {
    console.warn(`Order status is undefined or null, defaulting to pending`);
    return 'pending';
  }

  const normalized = status.toLowerCase() as OrderStatus;

  // Map common variations
  switch (normalized) {
    case 'pending':
    case 'preparing':
    case 'ready':
    case 'completed':
    case 'cancelled':
      return normalized;
    default:
      console.warn(`Unknown order status: ${status}, defaulting to pending`);
      return 'pending';
  }
}

export interface MenuItem {
  id: string;
  name_en: string;
  name_th: string;
  description_en?: string;
  description_th?: string;
  base_price: number;
  category_en: string;
  category_th: string;
  image_url?: string;
  active: boolean;
  customizations?: {
    sizes?: string[];
    milk?: string[];
    extras?: string[];
    [key: string]: string[] | undefined;
  };
  created_at: Date;
  updated_at: Date;
  // Legacy fields for backward compatibility
  name?: string;
  description?: string;
  category?: string;
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
  total_orders: number;
  total_revenue: number;
  completed_orders: number;
  pending_orders: number;
  completion_rate: string;
  // Legacy fields for backward compatibility
  totalOrders?: number;
  totalRevenue?: number;
  averageOrderValue?: number;
  topItems?: {
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

export interface SalesInsights {
  success: boolean;
  data: {
    summary: {
      total_orders: number;
      total_revenue: number;
      average_order_value: number;
      completed_orders: number;
      pending_orders: number;
      preparing_orders: number;
      ready_orders: number;
      cancelled_orders: number;
      completed_revenue: number;
      completion_rate: string;
    };
    daily_breakdown: DailyBreakdown[];
  };
  period: {
    start_date: string;
    end_date: string;
  };
}

export interface DailyBreakdown {
  total_orders: number;
  total_revenue: number;
  average_order_value: number;
  completed_orders: string;
  pending_orders: string;
  preparing_orders: string;
  ready_orders: string;
  cancelled_orders: string;
  completed_revenue: string;
  order_date: string;
  total_period_orders: string;
}

export interface TopSellingItem {
  menu_id: number;
  menu_name: string;
  category: string;
  base_price: number;
  image_url: string;
  total_quantity_sold: number;
  number_of_orders: number;
  total_revenue: number;
  average_price: number;
  percentage_of_total_sales: number;
}

export interface TopSellingItemsResponse {
  success: boolean;
  data: TopSellingItem[];
  period: {
    start_date: string;
    end_date: string;
  };
  count: number;
}

// Hourly sales breakdown (for curve graph)
export interface HourlyDataPoint {
  hour: number; // 0-23
  items_sold: number;
  orders_count: number;
  revenue: number; // numeric revenue (not string)
}

export interface HourlyTotals {
  items_sold: number;
  orders_count: number;
  revenue: number;
}

export interface HourlySalesResponse {
  success: boolean;
  data: {
    date?: string | null;
    period: {
      start_date: string | null;
      end_date: string | null;
      all_time: boolean;
    };
    hourly: HourlyDataPoint[];
    totals: HourlyTotals;
  };
}

// Inventory & Ingredients
export interface Ingredient {
  id?: number | string;
  name: string;
  unit: string; // e.g., ml, g, pcs
  stock: number;
  created_at?: string;
  updated_at?: string;
}

export interface UpsertIngredientInput {
  name: string;
  unit: string;
  stock?: number;
}

export interface AddStockInput {
  name: string;
  quantity: number;
}

export interface RecipeItemInput {
  ingredient_name: string;
  quantity: number;
}

// Daily break comparison between today and yesterday
export interface DailyBreakResponse {
  success: boolean;
  data: {
    todayCount: number;
    yesterdayCount: number;
    difference: number;
    brokeRecord: boolean;
  };
}
