export interface Address {
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export enum CustomerStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
  PROSPECT = "prospect"
}

export enum CustomerType {
  INDIVIDUAL = "individual",
  BUSINESS = "business",
  GOVERNMENT = "government"
}

export enum PaymentTerms {
  NET_15 = "net_15",
  NET_30 = "net_30",
  NET_60 = "net_60",
  NET_90 = "net_90",
  COD = "cod",
  PREPAID = "prepaid"
}

export interface Customer {
  id?: string;
  _id?: string; // MongoDB ObjectId field
  first_name: string;
  last_name: string;
  company_name?: string;
  customer_type: CustomerType;
  email: string;
  phone: string;
  billing_address: Address;
  shipping_address?: Address;
  payment_terms: PaymentTerms;
  credit_limit?: number;
  current_balance?: number;
  status: CustomerStatus;
  created_at?: string;
  updated_at?: string;
  total_orders?: number;
  last_order_date?: string;
  notes?: string;
}

export interface CustomerCreate {
  first_name: string;
  last_name: string;
  company_name?: string;
  customer_type: CustomerType;
  email: string;
  phone: string;
  billing_address: Address;
  shipping_address?: Address;
  payment_terms: PaymentTerms;
  credit_limit?: number;
  notes?: string;
}

export interface Product {
  _id: string;
  id?: string; // Alternative ID field
  sku: string;
  name: string;
  description: string;
  price: number;
  cost: number;
  unit: string;
  isActive: boolean;
  images?: string[];
  categoryId?: string;
}

export enum OrderStatus {
  DRAFT = "draft",
  PENDING = "pending",
  CONFIRMED = "confirmed",
  PROCESSING = "processing",
  SHIPPED = "shipped",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
  RETURNED = "returned"
}

export enum PaymentStatus {
  PENDING = "pending",
  PARTIAL = "partial",
  PAID = "paid",
  OVERDUE = "overdue",
  CANCELLED = "cancelled"
}

export interface OrderItem {
  product_id: string;
  product_name?: string;
  product_sku?: string;
  quantity: number;
  unit_price: number;
  discount_percentage: number;
  total_price: number;
  notes?: string;
}

// Backend API line item structure for creating orders
export interface OrderItemCreate {
  product_id: string;
  quantity: number;
  unit_price?: number;
  discount_percent: number;
  discount_amount: number;
  notes?: string;
}

export interface SalesOrder {
  id?: string;
  _id?: string;  // MongoDB ObjectId as string
  order_number?: string;
  customer_id: string;
  customer_name?: string;
  customer_email?: string;
  customer?: Customer;
  line_items: OrderItem[];  // Changed from 'items' to 'line_items' to match backend
  subtotal: number;
  tax_rate?: number;
  tax_amount: number;
  discount_amount?: number;
  subtotal_discount_percent?: number;
  subtotal_discount_amount?: number;
  shipping_cost?: number;
  total_amount: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  order_date: string;
  expected_delivery_date?: string;
  due_date?: string;
  shipping_date?: string;
  delivery_date?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SalesOrderCreate {
  customer_id: string;
  order_date?: string;
  expected_delivery_date?: string;
  shipping_method?: string;
  shipping_address?: Record<string, string>;
  priority?: string;
  sales_rep_id?: string;
  line_items: OrderItemCreate[];
  subtotal_discount_percent?: number;
  subtotal_discount_amount?: number;
  shipping_cost?: number;
  notes?: string;
  internal_notes?: string;
}

export enum QuoteStatus {
  DRAFT = "draft",
  SENT = "sent",
  VIEWED = "viewed",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
  EXPIRED = "expired",
  CONVERTED = "converted"
}

export interface Quote {
  id?: string;
  quote_number?: string;
  customer_id: string;
  customer_name?: string;
  customer_email?: string;
  customer?: Customer;
  line_items: OrderItem[];  // Changed from 'items' to 'line_items'
  subtotal: number;
  tax_rate?: number;
  tax_amount: number;
  discount_amount?: number;
  subtotal_discount_percent?: number;
  subtotal_discount_amount?: number;
  shipping_cost?: number;
  total_amount: number;
  status: QuoteStatus;
  quote_date: string;
  valid_until?: string;  // Changed from expiry_date to valid_until
  expiry_date?: string;  // Keep for backward compatibility
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface QuoteCreate {
  customer_id: string;
  line_items: OrderItem[];  // Changed from 'items' to 'line_items'
  tax_rate?: number;
  discount_amount?: number;
  expiry_date?: string;
  valid_until?: string;  // Add valid_until to match backend
  notes?: string;
}

export enum InvoiceStatus {
  DRAFT = "draft",
  SENT = "sent",
  VIEWED = "viewed",
  PAID = "paid",
  OVERDUE = "overdue",
  CANCELLED = "cancelled"
}

export interface Invoice {
  id?: string;
  invoice_number?: string;
  customer_id: string;
  customer?: Customer;
  sales_order_id?: string;
  items: OrderItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  status: InvoiceStatus;
  invoice_date: string;
  due_date: string;
  paid_date?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface InvoiceCreate {
  customer_id: string;
  sales_order_id?: string;
  items: OrderItem[];
  tax_rate?: number;
  discount_amount?: number;
  due_date: string;
  notes?: string;
}

export interface SalesAnalytics {
  total_revenue: number;
  total_orders: number;
  total_customers: number;
  average_order_value: number;
  revenue_growth: number;
  orders_growth: number;
  top_customers: Array<{
    customer: Customer;
    total_revenue: number;
    total_orders: number;
  }>;
  top_products: Array<{
    product: Product;
    quantity_sold: number;
    revenue: number;
  }>;
  monthly_revenue: Array<{
    month: string;
    revenue: number;
    orders: number;
  }>;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}
