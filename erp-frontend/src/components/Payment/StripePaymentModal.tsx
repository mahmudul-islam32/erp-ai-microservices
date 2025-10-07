import React from 'react';
import { Modal } from '@mantine/core';
import { useStripe } from '../../context/StripeContext';
import { StripePaymentForm } from './StripePaymentForm';

interface StripePaymentModalProps {
  opened: boolean;
  onClose: () => void;
  orderId: string;
  amount: number;
  customerId?: string;
  currency?: string;
  description?: string;
  receiptEmail?: string;
  onSuccess: () => void;
}

export const StripePaymentModal: React.FC<StripePaymentModalProps> = ({
  opened,
  onClose,
  orderId,
  amount,
  customerId,
  currency = 'usd',
  description,
  receiptEmail,
  onSuccess,
}) => {
  const { stripe, loading: stripeLoading, error: stripeError } = useStripe();

  const handleSuccess = () => {
    onSuccess();
    onClose();
  };

  const handleError = (error: string) => {
    console.error('Payment error:', error);
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Pay with Stripe"
      size="lg"
      centered
    >
      {stripeLoading && <p>Loading Stripe...</p>}
      {stripeError && <p style={{ color: 'red' }}>Error: {stripeError}</p>}
      {!stripeLoading && !stripeError && stripe && (
        <StripePaymentForm
          stripe={stripe}
          orderId={orderId}
          amount={amount}
          customerId={customerId}
          currency={currency}
          description={description}
          receiptEmail={receiptEmail}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      )}
    </Modal>
  );
};

export default StripePaymentModal;

