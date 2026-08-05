/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUTH_SERVICE_URL: string;
  readonly VITE_INVENTORY_SERVICE_URL: string;
  readonly VITE_SALES_SERVICE_URL: string;
  readonly VITE_NOTIFICATION_SERVICE_URL: string;
  readonly VITE_CHAT_SERVICE_URL: string;
  readonly VITE_FINANCE_SERVICE_URL: string;
  readonly VITE_HRM_SERVICE_URL: string;
  readonly VITE_AI_CHATBOT_SERVICE_URL: string;
  readonly VITE_PAYMENT_SERVICE_URL: string;
  readonly VITE_STRIPE_PUBLIC_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
