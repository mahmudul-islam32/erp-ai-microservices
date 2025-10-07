import React, { useState } from 'react';
import {
  PaymentElement,
  Elements,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Stripe, StripeElements } from '@stripe/stripe-js';
import { Button, Text, Box, Loader, Alert } from '@mantine/core';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';
import paymentsApi from '../../services/paymentApi';

interface StripeCheckoutFormProps {
  clientSecret: string;
  paymentIntentId: string;
  orderId: string;
  amount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
}

const CheckoutForm: React.FC<StripeCheckoutFormProps> = ({
  clientSecret,
  paymentIntentId,
  orderId,
  amount,
  onSuccess,
  onError,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/orders',
        },
        redirect: 'if_required',
      });

      if (error) {
        setMessage(error.message || 'An error occurred during payment');
        onError(error.message || 'Payment failed');
        setLoading(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Confirm payment with backend
        try {
          await paymentsApi.confirmStripePayment({
            payment_intent_id: paymentIntentId,
            order_id: orderId,
          });

          setMessage('Payment successful!');
          onSuccess();
        } catch (backendError: any) {
          console.error('Backend confirmation error:', backendError);
          setMessage('Payment processed but failed to update order. Please contact support.');
          onError('Failed to confirm payment with server');
        }
      } else if (paymentIntent && paymentIntent.status === 'processing') {
        setMessage('Payment is processing. You will be notified once completed.');
        // Still confirm with backend for tracking
        await paymentsApi.confirmStripePayment({
          payment_intent_id: paymentIntentId,
          order_id: orderId,
        });
        onSuccess();
      } else {
        setMessage('Payment requires additional action');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setMessage(err.message || 'An unexpected error occurred');
      onError(err.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Box mb="md">
        <Text size="lg" weight={600} mb="xs">
          Amount to pay: ${amount.toFixed(2)}
        </Text>
        <Text size="sm" color="dimmed">
          Order ID: {orderId}
        </Text>
      </Box>

      <PaymentElement />

      {message && (
        <Alert
          icon={message.includes('successful') ? <IconCheck size={16} /> : <IconAlertCircle size={16} />}
          title={message.includes('successful') ? 'Success' : 'Error'}
          color={message.includes('successful') ? 'green' : 'red'}
          mt="md"
        >
          {message}
        </Alert>
      )}

      <Button
        type="submit"
        fullWidth
        mt="xl"
        size="lg"
        disabled={!stripe || !elements || loading}
        loading={loading}
      >
        {loading ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
      </Button>

      <Text size="xs" color="dimmed" align="center" mt="md">
        Powered by Stripe • Secure payment processing
      </Text>
    </form>
  );
};

interface StripePaymentFormProps {
  stripe: Stripe | null;
  orderId: string;
  amount: number;
  customerId?: string;
  currency?: string;
  description?: string;
  receiptEmail?: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export const StripePaymentForm: React.FC<StripePaymentFormProps> = ({
  stripe,
  orderId,
  amount,
  customerId,
  currency = 'usd',
  description,
  receiptEmail,
  onSuccess,
  onError,
}) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInitializePayment = async () => {
    if (!stripe) {
      setError('Stripe is not initialized');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await paymentsApi.createStripePaymentIntent({
        order_id: orderId,
        customer_id: customerId,
        amount,
        currency,
        description,
        receipt_email: receiptEmail,
      });

      setClientSecret(result.client_secret);
      setPaymentIntentId(result.payment_intent_id);
    } catch (err: any) {
      console.error('Error creating payment intent:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to initialize payment';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!stripe) {
    return (
      <Box p="md">
        <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
          Stripe is not available. Please check your configuration.
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box p="xl" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <Loader size="lg" />
        <Text>Initializing payment...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p="md">
        <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red" mb="md">
          {error}
        </Alert>
        <Button onClick={handleInitializePayment} fullWidth>
          Try Again
        </Button>
      </Box>
    );
  }

  if (!clientSecret || !paymentIntentId) {
    return (
      <Box p="md">
        <Text mb="md">Ready to pay ${amount.toFixed(2)} for order {orderId}</Text>
        <Button onClick={handleInitializePayment} fullWidth size="lg">
          Continue to Payment
        </Button>
      </Box>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#228be6',
      },
    },
  };

  return (
    <Box p="md">
      <Elements stripe={stripe} options={options}>
        <CheckoutForm
          clientSecret={clientSecret}
          paymentIntentId={paymentIntentId}
          orderId={orderId}
          amount={amount}
          onSuccess={onSuccess}
          onError={onError}
        />
      </Elements>
    </Box>
  );
};

export default StripePaymentForm;

