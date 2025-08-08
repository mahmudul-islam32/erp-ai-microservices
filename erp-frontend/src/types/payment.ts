export enum PaymentMethod {
  CASH = "cash",
  CREDIT_CARD = "credit_card",
  DEBIT_CARD = "debit_card",
  PAYPAL = "paypal",
  BANK_TRANSFER = "bank_transfer",
  CHECK = "check",
  DIGITAL_WALLET = "digital_wallet",
  STORE_CREDIT = "store_credit",
  GIFT_CARD = "gift_card",
  OTHER = "other"
}

export enum PaymentStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
  REFUNDED = "refunded",
  PARTIALLY_REFUNDED = "partially_refunded",
  AUTHORIZED = "authorized",
  CAPTURED = "captured"
}

export enum CardType {
  VISA = "visa",
  MASTERCARD = "mastercard",
  AMERICAN_EXPRESS = "american_express",
  DISCOVER = "discover",
  OTHER = "other"
}

export enum TransactionType {
  PAYMENT = "payment",
  REFUND = "refund",
  PARTIAL_REFUND = "partial_refund",
  AUTHORIZATION = "authorization",
  CAPTURE = "capture",
  VOID = "void"
}

export interface CardPaymentDetails {
  card_type?: CardType;
  last_four_digits?: string;
  expiry_month?: number;
  expiry_year?: number;
  cardholder_name?: string;
  authorization_code?: string;
  transaction_id?: string;
  gateway_response?: Record<string, any>;
}

export interface CashPaymentDetails {
  amount_tendered: number;
  change_given: number;
  currency: string;
  cash_drawer_id?: string;
  cashier_id?: string;
}

export interface PayPalPaymentDetails {
  paypal_transaction_id?: string;
  payer_email?: string;
  payer_id?: string;
  gateway_response?: Record<string, any>;
}

export interface PaymentGatewayDetails {
  gateway_name: string;
  transaction_id?: string;
  reference_number?: string;
  gateway_response?: Record<string, any>;
  processing_fee?: number;
}

export interface PaymentCreate {
  order_id?: string;
  invoice_id?: string;
  customer_id?: string;
  payment_method: PaymentMethod;
  amount: number;
  payment_date?: string;
  
  // Payment method specific details
  card_details?: CardPaymentDetails;
  cash_details?: CashPaymentDetails;
  paypal_details?: PayPalPaymentDetails;
  gateway_details?: PaymentGatewayDetails;
  
  // Additional fields
  currency?: string;
  exchange_rate?: number;
  reference_number?: string;
  notes?: string;
  receipt_email?: string;
  
  // POS specific fields
  terminal_id?: string;
  cashier_id?: string;
  shift_id?: string;
}

export interface Payment {
  id: string;
  payment_number: string;
  order_id?: string;
  order_number?: string;
  invoice_id?: string;
  invoice_number?: string;
  customer_id?: string;
  customer_name?: string;
  customer_email?: string;
  
  payment_method: PaymentMethod;
  amount: number;
  currency: string;
  exchange_rate?: number;
  status: PaymentStatus;
  transaction_type: TransactionType;
  
  // Payment method specific details
  card_details?: CardPaymentDetails;
  cash_details?: CashPaymentDetails;
  paypal_details?: PayPalPaymentDetails;
  gateway_details?: PaymentGatewayDetails;
  
  // Timestamps
  payment_date: string;
  processed_at?: string;
  authorized_at?: string;
  captured_at?: string;
  
  // Additional info
  reference_number?: string;
  notes?: string;
  receipt_email?: string;
  receipt_url?: string;
  
  // POS specific fields
  terminal_id?: string;
  cashier_id?: string;
  cashier_name?: string;
  shift_id?: string;
  
  // Refund information
  refunded_amount: number;
  refund_transactions: string[];
  
  // Audit fields
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by?: string;
}

export interface RefundCreate {
  payment_id: string;
  amount: number;
  reason: string;
  refund_method?: PaymentMethod;
  notes?: string;
}

export interface Refund {
  id: string;
  refund_number: string;
  payment_id: string;
  payment_number: string;
  order_id?: string;
  customer_id?: string;
  amount: number;
  reason: string;
  refund_method: PaymentMethod;
  status: PaymentStatus;
  processed_at?: string;
  notes?: string;
  created_at: string;
  created_by: string;
}

export interface POSLineItem {
  product_id: string;
  quantity: number;
  unit_price?: number;
  notes?: string;
}

export interface POSTransactionCreate {
  customer_id?: string;
  line_items: POSLineItem[];
  payments: PaymentCreate[];
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  terminal_id?: string;
  cashier_id?: string;
  shift_id?: string;
  notes?: string;
}

export interface POSTransaction {
  id: string;
  transaction_number: string;
  order_id: string;
  customer_id?: string;
  payments: Payment[];
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  change_due: number;
  terminal_id?: string;
  cashier_id?: string;
  cashier_name?: string;
  shift_id?: string;
  transaction_date: string;
  receipt_url?: string;
  created_at: string;
}

export interface PaymentSummary {
  date: string;
  total_payments: number;
  total_amount: number;
  completed_payments: number;
  completed_amount: number;
  by_method: Record<string, {
    count: number;
    amount: number;
  }>;
}

export interface PaymentFilters {
  payment_method?: PaymentMethod;
  status?: PaymentStatus;
  customer_id?: string;
  order_id?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
}
