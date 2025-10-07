import React, { createContext, useContext, useEffect, useState } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import paymentsApi from '../services/paymentApi';

interface StripeContextType {
  stripe: Stripe | null;
  publishableKey: string | null;
  loading: boolean;
  error: string | null;
}

const StripeContext = createContext<StripeContextType>({
  stripe: null,
  publishableKey: null,
  loading: true,
  error: null,
});

export const useStripe = () => {
  const context = useContext(StripeContext);
  if (!context) {
    throw new Error('useStripe must be used within a StripeProvider');
  }
  return context;
};

interface StripeProviderProps {
  children: React.ReactNode;
}

export const StripeProvider: React.FC<StripeProviderProps> = ({ children }) => {
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [publishableKey, setPublishableKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeStripe = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch Stripe configuration from backend
        const config = await paymentsApi.getStripeConfig();
        
        if (!config.publishable_key) {
          throw new Error('Stripe publishable key not configured');
        }

        setPublishableKey(config.publishable_key);

        // Load Stripe.js
        const stripeInstance = await loadStripe(config.publishable_key);
        
        if (!stripeInstance) {
          throw new Error('Failed to load Stripe');
        }

        setStripe(stripeInstance);
      } catch (err) {
        console.error('Error initializing Stripe:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize Stripe');
      } finally {
        setLoading(false);
      }
    };

    initializeStripe();
  }, []);

  return (
    <StripeContext.Provider value={{ stripe, publishableKey, loading, error }}>
      {children}
    </StripeContext.Provider>
  );
};

export default StripeContext;

