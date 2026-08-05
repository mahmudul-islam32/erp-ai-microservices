import React, { useState, useEffect } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Button } from '../../../shared/components/ui/Button';
import { Spinner } from '../../../shared/components/ui/Spinner';
import { paymentsApi } from '../services/paymentsApi';
import { paymentApi } from '../../../shared/api/client';
import { toast } from 'sonner';
import { formatCurrency } from '../../../shared/utils/format';

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
  const [paymentSuccess, setPaymentSuccess] = useState(false);

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
        
        try {
          // Confirm payment with backend - this creates payment record and updates order
          const response = await paymentsApi.confirmStripePayment({
            payment_intent_id: paymentIntent.id,
            order_id: orderId,
          });
          
          console.log('✅ Backend payment confirmation:', response);
          
          if (response.success) {
            // Mark payment as successful - this will hide the form
            setPaymentSuccess(true);
            toast.success('Payment processed successfully!');
            
            // Call success callback (parent will refresh order and close modal)
            // Small delay to show success message
            setTimeout(() => {
              onSuccess();
            }, 1500);
          } else {
            toast.error('Payment confirmation failed');
            setIsProcessing(false);
          }
        } catch (error: any) {
          console.error('Payment confirmation error:', error);
          toast.error(error?.response?.data?.detail || 'Failed to confirm payment');
          setIsProcessing(false);
        }
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error('Payment processing failed');
      setIsProcessing(false);
    }
  };

  // Show success message instead of form after successful payment
  if (paymentSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="mb-4 p-4 bg-success-50 rounded-full">
          <svg className="w-12 h-12 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Payment Successful!</h3>
        <p className="text-sm text-slate-600 mb-4">
          Your payment of {formatCurrency(amount)} has been processed successfully.
        </p>
        <p className="text-xs text-slate-500">Closing...</p>
      </div>
    );
  }

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
          variant="tertiary"
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
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const hasInitialized = React.useRef(false);

  useEffect(() => {
    // Prevent duplicate payment intent creation (React Strict Mode runs effects twice)
    if (hasInitialized.current) {
      return;
    }

    const initializePayment = async () => {
      hasInitialized.current = true;
      
      try {
        // First, get Stripe config (publishable key) from payment service
        console.log('💳 Fetching Stripe configuration...');
        const configResponse = await paymentApi.get('/api/v1/payments/config');
        const { publishable_key } = configResponse.data;
        
        if (!publishable_key || publishable_key.includes('your_publishable_key') || publishable_key.includes('placeholder')) {
          throw new Error('Invalid Stripe publishable key from server. Please configure Stripe keys in the payment service.');
        }

        console.log('✅ Stripe config loaded:', { publishable_key: publishable_key.substring(0, 20) + '...' });
        
        // Initialize Stripe with the publishable key from the server
        const stripe = loadStripe(publishable_key);
        setStripePromise(stripe);

        console.log('💳 Initializing Stripe payment for:', {
          orderId: props.orderId,
          customerId: props.customerId,
          amount: props.amount,
        });

        // Create payment intent
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
        console.error('❌ Payment initialization error:', error);
        const errorMsg = error?.response?.data?.detail || error?.message || 'Failed to initialize payment';
        toast.error(errorMsg);
        setError(errorMsg);
        setIsLoading(false);
      }
    };

    initializePayment();
  }, [props.orderId, props.customerId, props.amount]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size="lg" />
        <p className="ml-3 text-slate-600">Initializing payment...</p>
      </div>
    );
  }

  if (error || !clientSecret || !stripePromise) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <p className="text-danger-600 mb-4">{error || 'Failed to initialize payment'}</p>
        <Button variant="tertiary" onClick={props.onCancel}>
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
