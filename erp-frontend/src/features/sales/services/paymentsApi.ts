import { salesApi } from '../../../shared/api/client';

export interface Payment {
  id: string;
  order_id: string;
  customer_id: string;
  amount: number;
  payment_method: string;
  payment_status: string;
  transaction_id?: string;
  stripe_payment_intent_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreatePaymentData {
  order_id: string;
  customer_id: string;
  amount: number;
  payment_method: string;
}

export interface StripePaymentIntentData {
  order_id: string;
  customer_id: string;
  amount: number;
}

export interface StripeConfirmPaymentData {
  payment_intent_id: string;
  order_id: string;
}

export const paymentsApi = {
  // Regular payment
  create: async (data: CreatePaymentData): Promise<Payment> => {
    const response = await salesApi.post('/api/v1/payments/', data);
    return response.data;
  },

  // Cash payment
  createCash: async (data: { 
    order_id: string; 
    customer_id?: string; 
    amount: number;
    amount_tendered: number;
    notes?: string;
  }): Promise<Payment> => {
    const response = await salesApi.post('/api/v1/payments/cash', data);
    return response.data;
  },

  // Stripe payment intent
  createStripeIntent: async (data: StripePaymentIntentData): Promise<{ client_secret: string; payment_intent_id: string }> => {
    console.log('Creating Stripe payment intent:', data);
    const response = await salesApi.post('/api/v1/payments/stripe/create-intent', data);
    console.log('Stripe intent response:', response.data);
    return response.data;
  },

  // Confirm Stripe payment
  confirmStripePayment: async (data: StripeConfirmPaymentData): Promise<Payment> => {
    console.log('Confirming Stripe payment:', data);
    const response = await salesApi.post('/api/v1/payments/stripe/confirm', data);
    console.log('Stripe confirm response:', response.data);
    return response.data;
  },

  // Get payments for order
  getByOrder: async (orderId: string): Promise<Payment[]> => {
    const response = await salesApi.get(`/api/v1/payments/order/${orderId}`);
    return Array.isArray(response.data) ? response.data : [];
  },

  // Get payment by ID
  getById: async (id: string): Promise<Payment> => {
    const response = await salesApi.get(`/api/v1/payments/${id}`);
    return response.data;
  },
};

