import React, { useState, useEffect } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '../../../shared/components/ui/Button';
import { Spinner } from '../../../shared/components/ui/Spinner';
import { paymentsApi } from '../services/paymentsApi';
import { toast } from 'sonner';
import { formatCurrency } from '../../../shared/utils/format';

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_51P9khqRpGW3wBn3dMKRsWLXXqfQOtXYHb8YT9fgT2cK1vN1m0fEb4zYH6sQpYZuIx5L7m8nNjKlMoPqRsTuVwXyZ00Bx5JjN6k'
);

interface StripePaymentFormProps {
  orderId: string;
  amount: number;
  customerId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const PaymentForm: React.FC<StripePaymentFormProps & { clientSecret: string }> = ({
  orderId,
  amount,
  customerId,
  clientSecret,
  onSuccess,
  onCancel,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard/sales/orders/${orderId}`,
        },
        redirect: 'if_required',
      });

      if (error) {
        toast.error(error.message || 'Payment failed');
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('✅ Stripe payment intent succeeded:', paymentIntent.id);
        
        // Confirm payment with backend
        const response = await paymentsApi.confirmStripePayment({
          payment_intent_id: paymentIntent.id,
          order_id: orderId,
        });
        
        console.log('✅ Backend payment confirmation:', response);
        
        // Call success callback (parent will show toast and close modal)
        onSuccess();
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error('Payment processing failed');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6 p-4 bg-primary-50 rounded-lg border border-primary-200">
        <h4 className="text-sm font-medium text-primary-900">Payment Amount</h4>
        <p className="text-2xl font-bold text-primary-700 mt-1">{formatCurrency(amount)}</p>
      </div>

      <div className="mb-6">
        <PaymentElement />
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isProcessing}
          disabled={!stripe || isProcessing}
        >
          Pay {formatCurrency(amount)}
        </Button>
      </div>
    </form>
  );
};

export const StripePaymentForm: React.FC<StripePaymentFormProps> = (props) => {
  const [clientSecret, setClientSecret] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const hasInitialized = React.useRef(false);

  useEffect(() => {
    // Prevent duplicate payment intent creation (React Strict Mode runs effects twice)
    if (hasInitialized.current) {
      return;
    }

    const createPaymentIntent = async () => {
      hasInitialized.current = true;
      
      try {
        console.log('💳 Initializing Stripe payment for:', {
          orderId: props.orderId,
          customerId: props.customerId,
          amount: props.amount,
        });

        const response = await paymentsApi.createStripeIntent({
          order_id: props.orderId,
          customer_id: props.customerId,
          amount: props.amount,
        });

        console.log('✅ Payment intent created:', response);

        if (!response.client_secret) {
          throw new Error('No client secret received from server');
        }

        setClientSecret(response.client_secret);
        setIsLoading(false);
      } catch (error: any) {
        console.error('❌ Payment intent error:', error);
        const errorMsg = error?.response?.data?.detail || error?.message || 'Failed to initialize payment';
        toast.error(errorMsg);
        setError(errorMsg);
        setIsLoading(false);
      }
    };

    createPaymentIntent();
  }, [props.orderId, props.customerId, props.amount]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size="lg" />
        <p className="ml-3 text-slate-600">Initializing payment...</p>
      </div>
    );
  }

  if (error || !clientSecret) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <p className="text-danger-600 mb-4">{error || 'Failed to initialize payment'}</p>
        <Button variant="outline" onClick={props.onCancel}>
          Close
        </Button>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PaymentForm {...props} clientSecret={clientSecret} />
    </Elements>
  );
};
