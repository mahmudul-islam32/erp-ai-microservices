import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Load Stripe publishable key
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_51P9khqRpGW3wBn3dMKRsWLXXqfQOtXYHb8YT9fgT2cK1vN1m0fEb4zYH6sQpYZuIx5L7m8nNjKlMoPqRsTuVwXyZ00Bx5JjN6k'
);

interface StripeProviderProps {
  children: React.ReactNode;
}

export const StripeProvider: React.FC<StripeProviderProps> = ({ children }) => {
  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  );
};

