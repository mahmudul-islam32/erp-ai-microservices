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
  SECURITY = 'security',
  APPEARANCE = 'appearance',
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

export interface SecuritySettings {
  password_min_length: number;
  password_require_uppercase: boolean;
  password_require_lowercase: boolean;
  password_require_numbers: boolean;
  password_require_special_chars: boolean;
  password_expiration_days?: number;
  require_password_change_on_first_login: boolean;
  max_login_attempts: number;
  account_lockout_duration_minutes: number;
  session_timeout_minutes: number;
  enable_two_factor_auth: boolean;
  require_two_factor_auth: boolean;
  token_refresh_enabled: boolean;
  refresh_token_expire_days: number;
}

export interface AppearanceSettings {
  // Font Settings
  font_family: string;
  font_size_base: string;
  font_size_small: string;
  font_size_large: string;
  font_weight_normal: number;
  font_weight_medium: number;
  font_weight_bold: number;
  
  // Color Settings
  primary_color: string;
  primary_color_dark: string;
  secondary_color: string;
  accent_color: string;
  success_color: string;
  warning_color: string;
  danger_color: string;
  background_color: string;
  background_color_dark: string;
  text_color: string;
  text_color_dark: string;
  
  // UI Settings
  border_radius: string;
  border_radius_large: string;
  spacing_unit: string;
  
  // IconButton Settings
  icon_button_default_size?: 'xs' | 'sm' | 'md' | 'lg';
  icon_button_default_variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success' | 'warning' | 'info';
  // Single padding size setting that scales for all button sizes
  // Uses semantic values: 'extra-small', 'small', 'medium', 'large', 'extra-large'
  icon_button_padding_size?: string;
  // Single icon size setting that scales for all button sizes
  // Uses semantic values: 'extra-small', 'small', 'medium', 'large', 'extra-large'
  icon_button_icon_size?: string;
  
  // Pagination Settings
  pagination_design?: 'modern' | 'classic';
  pagination_default_items_per_page?: number;
  pagination_active_color?: string;
  pagination_hover_color?: string;
  pagination_text_color?: string;
  pagination_border_color?: string;
  pagination_items_per_page_options?: string; // Comma-separated: "10,25,50,100"
  
  // Additional CSS
  custom_css?: string;
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
  security?: SecuritySettings;
  appearance?: AppearanceSettings;
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
  security?: SecuritySettings;
  appearance?: AppearanceSettings;
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

