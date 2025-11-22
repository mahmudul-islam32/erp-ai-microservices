import { authApi } from '../../../shared/api/client';

export enum SettingsCategory {
  COMPANY = 'company',
  FINANCIAL = 'financial',
  SALES = 'sales',
  INVENTORY = 'inventory',
  HR = 'hr',
  EMAIL = 'email',
  NOTIFICATIONS = 'notifications',
  INTEGRATIONS = 'integrations',
  GENERAL = 'general',
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  postal_code?: string;
  country?: string;
}

export interface CompanyInfo {
  company_name: string;
  legal_name?: string;
  registration_number?: string;
  tax_id?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: Address;
}

export interface FinancialSettings {
  default_currency: string;
  fiscal_year_start_month: number;
  tax_rate: number;
  decimal_places: number;
  invoice_prefix?: string;
  invoice_number_format?: string;
}

export interface SalesSettings {
  default_payment_terms: string;
  default_shipping_method?: string;
  default_tax_rate: number;
  quote_validity_days: number;
  auto_generate_invoice: boolean;
  invoice_due_days: number;
}

export interface InventorySettings {
  low_stock_threshold: number;
  auto_reorder: boolean;
  default_warehouse?: string;
  track_serial_numbers: boolean;
  track_batch_numbers: boolean;
}

export interface EmailSettings {
  smtp_server?: string;
  smtp_port: number;
  smtp_username?: string;
  smtp_password?: string;
  smtp_use_tls: boolean;
  from_email?: string;
  from_name?: string;
}

export interface NotificationSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  notify_on_order_created: boolean;
  notify_on_invoice_created: boolean;
  notify_on_payment_received: boolean;
  notify_on_low_stock: boolean;
}

export interface IntegrationSettings {
  stripe_enabled: boolean;
  stripe_secret_key?: string;
  stripe_publishable_key?: string;
  stripe_webhook_secret?: string;
}

export interface GeneralSettings {
  timezone: string;
  date_format: string;
  time_format: string;
  language: string;
  items_per_page: number;
}

export interface Settings {
  id: string;
  category: SettingsCategory;
  company_info?: CompanyInfo;
  financial?: FinancialSettings;
  sales?: SalesSettings;
  inventory?: InventorySettings;
  email?: EmailSettings;
  notifications?: NotificationSettings;
  integrations?: IntegrationSettings;
  general?: GeneralSettings;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by?: string;
}

export interface SettingsUpdate {
  company_info?: CompanyInfo;
  financial?: FinancialSettings;
  sales?: SalesSettings;
  inventory?: InventorySettings;
  email?: EmailSettings;
  notifications?: NotificationSettings;
  integrations?: IntegrationSettings;
  general?: GeneralSettings;
}

export const settingsApi = {
  getAll: async (category?: SettingsCategory): Promise<Settings[]> => {
    const params = category ? { category } : {};
    const response = await authApi.get('/api/v1/settings/', { params });
    return response.data;
  },

  getByCategory: async (category: SettingsCategory): Promise<Settings> => {
    const response = await authApi.get(`/api/v1/settings/${category}`);
    return response.data;
  },

  update: async (category: SettingsCategory, data: SettingsUpdate): Promise<Settings> => {
    const response = await authApi.put(`/api/v1/settings/${category}`, data);
    return response.data;
  },

  delete: async (category: SettingsCategory): Promise<void> => {
    await authApi.delete(`/api/v1/settings/${category}`);
  },
};

