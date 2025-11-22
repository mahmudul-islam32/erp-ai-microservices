import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { Card, CardHeader, CardContent, CardFooter } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Select } from '../../../shared/components/ui/Select';
import { settingsApi, SettingsCategory, Settings, SettingsUpdate } from '../../settings/services/settingsApi';
import { toast } from 'sonner';
import { 
  Building2, 
  DollarSign, 
  ShoppingCart, 
  Package, 
  Mail, 
  Bell, 
  Plug, 
  Settings as SettingsIcon,
  Save,
  Loader2
} from 'lucide-react';

type TabType = SettingsCategory | 'all';

const tabConfig = [
  { id: SettingsCategory.COMPANY, label: 'Company', icon: Building2 },
  { id: SettingsCategory.FINANCIAL, label: 'Financial', icon: DollarSign },
  { id: SettingsCategory.SALES, label: 'Sales', icon: ShoppingCart },
  { id: SettingsCategory.INVENTORY, label: 'Inventory', icon: Package },
  { id: SettingsCategory.EMAIL, label: 'Email', icon: Mail },
  { id: SettingsCategory.NOTIFICATIONS, label: 'Notifications', icon: Bell },
  { id: SettingsCategory.INTEGRATIONS, label: 'Integrations', icon: Plug },
  { id: SettingsCategory.GENERAL, label: 'General', icon: SettingsIcon },
];

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>(SettingsCategory.COMPANY);
  const [settings, setSettings] = useState<Record<SettingsCategory, Settings | null>>({
    [SettingsCategory.COMPANY]: null,
    [SettingsCategory.FINANCIAL]: null,
    [SettingsCategory.SALES]: null,
    [SettingsCategory.INVENTORY]: null,
    [SettingsCategory.HR]: null,
    [SettingsCategory.EMAIL]: null,
    [SettingsCategory.NOTIFICATIONS]: null,
    [SettingsCategory.INTEGRATIONS]: null,
    [SettingsCategory.GENERAL]: null,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Record<SettingsCategory, SettingsUpdate>>({
    [SettingsCategory.COMPANY]: {},
    [SettingsCategory.FINANCIAL]: {},
    [SettingsCategory.SALES]: {},
    [SettingsCategory.INVENTORY]: {},
    [SettingsCategory.HR]: {},
    [SettingsCategory.EMAIL]: {},
    [SettingsCategory.NOTIFICATIONS]: {},
    [SettingsCategory.INTEGRATIONS]: {},
    [SettingsCategory.GENERAL]: {},
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const allSettings = await settingsApi.getAll();
      const settingsMap: Record<SettingsCategory, Settings | null> = {
        [SettingsCategory.COMPANY]: null,
        [SettingsCategory.FINANCIAL]: null,
        [SettingsCategory.SALES]: null,
        [SettingsCategory.INVENTORY]: null,
        [SettingsCategory.HR]: null,
        [SettingsCategory.EMAIL]: null,
        [SettingsCategory.NOTIFICATIONS]: null,
        [SettingsCategory.INTEGRATIONS]: null,
        [SettingsCategory.GENERAL]: null,
      };

      allSettings.forEach((setting) => {
        if (setting.category in settingsMap) {
          settingsMap[setting.category as SettingsCategory] = setting;
          // Initialize form data with existing settings
          // Initialize form data with existing settings
          const categoryData: SettingsUpdate = {};
          if (setting.company_info) categoryData.company_info = setting.company_info;
          if (setting.financial) categoryData.financial = setting.financial;
          if (setting.sales) categoryData.sales = setting.sales;
          if (setting.inventory) categoryData.inventory = setting.inventory;
          if (setting.email) categoryData.email = setting.email;
          if (setting.notifications) categoryData.notifications = setting.notifications;
          if (setting.integrations) categoryData.integrations = setting.integrations;
          if (setting.general) categoryData.general = setting.general;
          
          setFormData((prev) => ({
            ...prev,
            [setting.category]: categoryData,
          }));
        }
      });

      setSettings(settingsMap);
    } catch (error: any) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (category: SettingsCategory) => {
    setSaving(true);
    try {
      const data = formData[category];
      const updated = await settingsApi.update(category, data);
      setSettings((prev) => ({
        ...prev,
        [category]: updated,
      }));
      toast.success(`${tabConfig.find(t => t.id === category)?.label || category} settings saved successfully`);
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateFormData = (category: SettingsCategory, field: string, value: any) => {
    setFormData((prev) => {
      const categoryData = prev[category] || {};
      const newData = { ...categoryData };
      
      // Handle nested fields (e.g., company_info.company_name)
      if (field.includes('.')) {
        const parts = field.split('.');
        if (parts.length === 2) {
          const [parent, child] = parts;
          const parentData = (newData[parent as keyof SettingsUpdate] as any) || {};
          newData[parent as keyof SettingsUpdate] = {
            ...parentData,
            [child]: value,
          } as any;
        } else if (parts.length === 3) {
          // Handle deeper nesting like address.street
          const [parent, nested, child] = parts;
          const parentData = (newData[parent as keyof SettingsUpdate] as any) || {};
          const nestedData = parentData[nested] || {};
          newData[parent as keyof SettingsUpdate] = {
            ...parentData,
            [nested]: {
              ...nestedData,
              [child]: value,
            },
          } as any;
        }
      } else {
        (newData as any)[field] = value;
      }
      
      return {
        ...prev,
        [category]: newData,
      };
    });
  };

  const renderCompanySettings = () => {
    const data = formData[SettingsCategory.COMPANY].company_info || settings[SettingsCategory.COMPANY]?.company_info;
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Company Name"
            value={data?.company_name || ''}
            onChange={(e) => updateFormData(SettingsCategory.COMPANY, 'company_info.company_name', e.target.value)}
            required
          />
          <Input
            label="Legal Name"
            value={data?.legal_name || ''}
            onChange={(e) => updateFormData(SettingsCategory.COMPANY, 'company_info.legal_name', e.target.value)}
          />
          <Input
            label="Registration Number"
            value={data?.registration_number || ''}
            onChange={(e) => updateFormData(SettingsCategory.COMPANY, 'company_info.registration_number', e.target.value)}
          />
          <Input
            label="Tax ID"
            value={data?.tax_id || ''}
            onChange={(e) => updateFormData(SettingsCategory.COMPANY, 'company_info.tax_id', e.target.value)}
          />
          <Input
            label="Website"
            value={data?.website || ''}
            onChange={(e) => updateFormData(SettingsCategory.COMPANY, 'company_info.website', e.target.value)}
            type="url"
          />
          <Input
            label="Phone"
            value={data?.phone || ''}
            onChange={(e) => updateFormData(SettingsCategory.COMPANY, 'company_info.phone', e.target.value)}
          />
          <Input
            label="Email"
            value={data?.email || ''}
            onChange={(e) => updateFormData(SettingsCategory.COMPANY, 'company_info.email', e.target.value)}
            type="email"
          />
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-slate-900 mb-3">Address</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Street"
              value={data?.address?.street || ''}
              onChange={(e) => updateFormData(SettingsCategory.COMPANY, 'company_info.address', {
                ...data?.address,
                street: e.target.value,
              })}
            />
            <Input
              label="City"
              value={data?.address?.city || ''}
              onChange={(e) => updateFormData(SettingsCategory.COMPANY, 'company_info.address', {
                ...data?.address,
                city: e.target.value,
              })}
            />
            <Input
              label="State"
              value={data?.address?.state || ''}
              onChange={(e) => updateFormData(SettingsCategory.COMPANY, 'company_info.address', {
                ...data?.address,
                state: e.target.value,
              })}
            />
            <Input
              label="Zip Code"
              value={data?.address?.zip_code || ''}
              onChange={(e) => updateFormData(SettingsCategory.COMPANY, 'company_info.address', {
                ...data?.address,
                zip_code: e.target.value,
              })}
            />
            <Input
              label="Country"
              value={data?.address?.country || ''}
              onChange={(e) => updateFormData(SettingsCategory.COMPANY, 'company_info.address', {
                ...data?.address,
                country: e.target.value,
              })}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderFinancialSettings = () => {
    const data = formData[SettingsCategory.FINANCIAL].financial || settings[SettingsCategory.FINANCIAL]?.financial;
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Default Currency"
            value={data?.default_currency || 'USD'}
            onChange={(e) => updateFormData(SettingsCategory.FINANCIAL, 'financial.default_currency', e.target.value)}
            maxLength={3}
          />
          <Input
            label="Fiscal Year Start Month"
            type="number"
            value={data?.fiscal_year_start_month || 1}
            onChange={(e) => updateFormData(SettingsCategory.FINANCIAL, 'financial.fiscal_year_start_month', parseInt(e.target.value))}
            min={1}
            max={12}
          />
          <Input
            label="Default Tax Rate (%)"
            type="number"
            step="0.01"
            value={(data?.tax_rate || 0) * 100}
            onChange={(e) => updateFormData(SettingsCategory.FINANCIAL, 'financial.tax_rate', parseFloat(e.target.value) / 100)}
            min={0}
            max={100}
          />
          <Input
            label="Decimal Places"
            type="number"
            value={data?.decimal_places || 2}
            onChange={(e) => updateFormData(SettingsCategory.FINANCIAL, 'financial.decimal_places', parseInt(e.target.value))}
            min={0}
            max={4}
          />
          <Input
            label="Invoice Prefix"
            value={data?.invoice_prefix || ''}
            onChange={(e) => updateFormData(SettingsCategory.FINANCIAL, 'financial.invoice_prefix', e.target.value)}
            maxLength={10}
          />
          <Input
            label="Invoice Number Format"
            value={data?.invoice_number_format || ''}
            onChange={(e) => updateFormData(SettingsCategory.FINANCIAL, 'financial.invoice_number_format', e.target.value)}
            placeholder="e.g., INV-{year}-{number}"
          />
        </div>
      </div>
    );
  };

  const renderSalesSettings = () => {
    const data = formData[SettingsCategory.SALES].sales || settings[SettingsCategory.SALES]?.sales;
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Select
            label="Default Payment Terms"
            value={data?.default_payment_terms || 'net_30'}
            onChange={(e) => updateFormData(SettingsCategory.SALES, 'sales.default_payment_terms', e.target.value)}
            options={[
              { value: 'net_15', label: 'Net 15' },
              { value: 'net_30', label: 'Net 30' },
              { value: 'net_45', label: 'Net 45' },
              { value: 'net_60', label: 'Net 60' },
              { value: 'cod', label: 'Cash on Delivery' },
              { value: 'prepaid', label: 'Prepaid' },
            ]}
          />
          <Input
            label="Default Shipping Method"
            value={data?.default_shipping_method || ''}
            onChange={(e) => updateFormData(SettingsCategory.SALES, 'sales.default_shipping_method', e.target.value)}
          />
          <Input
            label="Default Tax Rate (%)"
            type="number"
            step="0.01"
            value={(data?.default_tax_rate || 0) * 100}
            onChange={(e) => updateFormData(SettingsCategory.SALES, 'sales.default_tax_rate', parseFloat(e.target.value) / 100)}
            min={0}
            max={100}
          />
          <Input
            label="Quote Validity (Days)"
            type="number"
            value={data?.quote_validity_days || 30}
            onChange={(e) => updateFormData(SettingsCategory.SALES, 'sales.quote_validity_days', parseInt(e.target.value))}
            min={1}
            max={365}
          />
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="auto_generate_invoice"
              checked={data?.auto_generate_invoice || false}
              onChange={(e) => updateFormData(SettingsCategory.SALES, 'sales.auto_generate_invoice', e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
            <label htmlFor="auto_generate_invoice" className="text-sm font-medium text-slate-700">
              Auto-generate invoice from order
            </label>
          </div>
          <Input
            label="Invoice Due Days"
            type="number"
            value={data?.invoice_due_days || 30}
            onChange={(e) => updateFormData(SettingsCategory.SALES, 'sales.invoice_due_days', parseInt(e.target.value))}
            min={1}
            max={365}
          />
        </div>
      </div>
    );
  };

  const renderInventorySettings = () => {
    const data = formData[SettingsCategory.INVENTORY].inventory || settings[SettingsCategory.INVENTORY]?.inventory;
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Low Stock Threshold"
            type="number"
            step="0.1"
            value={data?.low_stock_threshold || 10}
            onChange={(e) => updateFormData(SettingsCategory.INVENTORY, 'inventory.low_stock_threshold', parseFloat(e.target.value))}
            min={0}
          />
          <Input
            label="Default Warehouse"
            value={data?.default_warehouse || ''}
            onChange={(e) => updateFormData(SettingsCategory.INVENTORY, 'inventory.default_warehouse', e.target.value)}
          />
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="auto_reorder"
              checked={data?.auto_reorder || false}
              onChange={(e) => updateFormData(SettingsCategory.INVENTORY, 'inventory.auto_reorder', e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
            <label htmlFor="auto_reorder" className="text-sm font-medium text-slate-700">
              Enable auto-reorder
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="track_serial_numbers"
              checked={data?.track_serial_numbers || false}
              onChange={(e) => updateFormData(SettingsCategory.INVENTORY, 'inventory.track_serial_numbers', e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
            <label htmlFor="track_serial_numbers" className="text-sm font-medium text-slate-700">
              Track serial numbers
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="track_batch_numbers"
              checked={data?.track_batch_numbers || false}
              onChange={(e) => updateFormData(SettingsCategory.INVENTORY, 'inventory.track_batch_numbers', e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
            <label htmlFor="track_batch_numbers" className="text-sm font-medium text-slate-700">
              Track batch numbers
            </label>
          </div>
        </div>
      </div>
    );
  };

  const renderNotificationSettings = () => {
    const data = formData[SettingsCategory.NOTIFICATIONS].notifications || settings[SettingsCategory.NOTIFICATIONS]?.notifications;
    
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
            <div>
              <label className="text-sm font-medium text-slate-900">Email Notifications</label>
              <p className="text-xs text-slate-500 mt-1">Receive notifications via email</p>
            </div>
            <input
              type="checkbox"
              checked={data?.email_notifications !== false}
              onChange={(e) => updateFormData(SettingsCategory.NOTIFICATIONS, 'notifications.email_notifications', e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
          </div>
          <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
            <div>
              <label className="text-sm font-medium text-slate-900">Push Notifications</label>
              <p className="text-xs text-slate-500 mt-1">Receive browser push notifications</p>
            </div>
            <input
              type="checkbox"
              checked={data?.push_notifications !== false}
              onChange={(e) => updateFormData(SettingsCategory.NOTIFICATIONS, 'notifications.push_notifications', e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
          </div>
          <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
            <div>
              <label className="text-sm font-medium text-slate-900">Notify on Order Created</label>
              <p className="text-xs text-slate-500 mt-1">Get notified when a new order is created</p>
            </div>
            <input
              type="checkbox"
              checked={data?.notify_on_order_created !== false}
              onChange={(e) => updateFormData(SettingsCategory.NOTIFICATIONS, 'notifications.notify_on_order_created', e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
          </div>
          <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
            <div>
              <label className="text-sm font-medium text-slate-900">Notify on Invoice Created</label>
              <p className="text-xs text-slate-500 mt-1">Get notified when a new invoice is created</p>
            </div>
            <input
              type="checkbox"
              checked={data?.notify_on_invoice_created !== false}
              onChange={(e) => updateFormData(SettingsCategory.NOTIFICATIONS, 'notifications.notify_on_invoice_created', e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
          </div>
          <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
            <div>
              <label className="text-sm font-medium text-slate-900">Notify on Payment Received</label>
              <p className="text-xs text-slate-500 mt-1">Get notified when a payment is received</p>
            </div>
            <input
              type="checkbox"
              checked={data?.notify_on_payment_received !== false}
              onChange={(e) => updateFormData(SettingsCategory.NOTIFICATIONS, 'notifications.notify_on_payment_received', e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
          </div>
          <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
            <div>
              <label className="text-sm font-medium text-slate-900">Notify on Low Stock</label>
              <p className="text-xs text-slate-500 mt-1">Get notified when inventory is low</p>
            </div>
            <input
              type="checkbox"
              checked={data?.notify_on_low_stock !== false}
              onChange={(e) => updateFormData(SettingsCategory.NOTIFICATIONS, 'notifications.notify_on_low_stock', e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
          </div>
        </div>
      </div>
    );
  };

  const renderIntegrationSettings = () => {
    const data = formData[SettingsCategory.INTEGRATIONS].integrations || settings[SettingsCategory.INTEGRATIONS]?.integrations;
    
    return (
      <div className="space-y-6">
        <div className="p-4 border border-slate-200 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-medium text-slate-900">Stripe Payment Gateway</h4>
              <p className="text-xs text-slate-500 mt-1">Enable Stripe for payment processing</p>
            </div>
            <input
              type="checkbox"
              checked={data?.stripe_enabled || false}
              onChange={(e) => updateFormData(SettingsCategory.INTEGRATIONS, 'integrations.stripe_enabled', e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
          </div>
          {data?.stripe_enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Input
                label="Stripe Secret Key"
                type="password"
                value={data?.stripe_secret_key || ''}
                onChange={(e) => updateFormData(SettingsCategory.INTEGRATIONS, 'integrations.stripe_secret_key', e.target.value)}
                placeholder="sk_test_..."
              />
              <Input
                label="Stripe Publishable Key"
                value={data?.stripe_publishable_key || ''}
                onChange={(e) => updateFormData(SettingsCategory.INTEGRATIONS, 'integrations.stripe_publishable_key', e.target.value)}
                placeholder="pk_test_..."
              />
              <Input
                label="Stripe Webhook Secret"
                type="password"
                value={data?.stripe_webhook_secret || ''}
                onChange={(e) => updateFormData(SettingsCategory.INTEGRATIONS, 'integrations.stripe_webhook_secret', e.target.value)}
                placeholder="whsec_..."
                className="md:col-span-2"
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderGeneralSettings = () => {
    const data = formData[SettingsCategory.GENERAL].general || settings[SettingsCategory.GENERAL]?.general;
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Timezone"
            value={data?.timezone || 'UTC'}
            onChange={(e) => updateFormData(SettingsCategory.GENERAL, 'general.timezone', e.target.value)}
          />
          <Select
            label="Date Format"
            value={data?.date_format || 'YYYY-MM-DD'}
            onChange={(e) => updateFormData(SettingsCategory.GENERAL, 'general.date_format', e.target.value)}
            options={[
              { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
              { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
              { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
              { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY' },
            ]}
          />
          <Select
            label="Time Format"
            value={data?.time_format || '24h'}
            onChange={(e) => updateFormData(SettingsCategory.GENERAL, 'general.time_format', e.target.value)}
            options={[
              { value: '24h', label: '24 Hour' },
              { value: '12h', label: '12 Hour' },
            ]}
          />
          <Select
            label="Language"
            value={data?.language || 'en'}
            onChange={(e) => updateFormData(SettingsCategory.GENERAL, 'general.language', e.target.value)}
            options={[
              { value: 'en', label: 'English' },
              { value: 'es', label: 'Spanish' },
              { value: 'fr', label: 'French' },
              { value: 'de', label: 'German' },
            ]}
          />
          <Input
            label="Items Per Page"
            type="number"
            value={data?.items_per_page || 25}
            onChange={(e) => updateFormData(SettingsCategory.GENERAL, 'general.items_per_page', parseInt(e.target.value))}
            min={10}
            max={100}
          />
        </div>
      </div>
    );
  };

  const renderEmailSettings = () => {
    const emailSettings = settings[SettingsCategory.EMAIL];
    const emailData = formData[SettingsCategory.EMAIL].email || emailSettings?.email;
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="SMTP Server"
              value={emailData?.smtp_server || ''}
              onChange={(e) => updateFormData(SettingsCategory.EMAIL, 'email.smtp_server', e.target.value)}
              placeholder="smtp.gmail.com"
            />
            <Input
              label="SMTP Port"
              type="number"
              value={emailData?.smtp_port || 587}
              onChange={(e) => updateFormData(SettingsCategory.EMAIL, 'email.smtp_port', parseInt(e.target.value))}
              min={1}
              max={65535}
            />
            <Input
              label="SMTP Username"
              value={emailData?.smtp_username || ''}
              onChange={(e) => updateFormData(SettingsCategory.EMAIL, 'email.smtp_username', e.target.value)}
            />
            <Input
              label="SMTP Password"
              type="password"
              value={emailData?.smtp_password || ''}
              onChange={(e) => updateFormData(SettingsCategory.EMAIL, 'email.smtp_password', e.target.value)}
            />
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="smtp_use_tls"
                checked={emailData?.smtp_use_tls !== false}
                onChange={(e) => updateFormData(SettingsCategory.EMAIL, 'email.smtp_use_tls', e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <label htmlFor="smtp_use_tls" className="text-sm font-medium text-slate-700">
                Use TLS
              </label>
            </div>
            <Input
              label="From Email"
              type="email"
              value={emailData?.from_email || ''}
              onChange={(e) => updateFormData(SettingsCategory.EMAIL, 'email.from_email', e.target.value)}
            />
            <Input
              label="From Name"
              value={emailData?.from_name || ''}
              onChange={(e) => updateFormData(SettingsCategory.EMAIL, 'email.from_name', e.target.value)}
            />
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    if (loading) {
      return (
        <Card padding="lg">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        </Card>
      );
    }

    switch (activeTab) {
      case SettingsCategory.COMPANY:
        return (
          <Card padding="lg">
            <CardHeader title="Company Information" subtitle="Manage your company details and address" />
            <CardContent>{renderCompanySettings()}</CardContent>
            <CardFooter>
              <Button onClick={() => handleSave(SettingsCategory.COMPANY)} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        );
      case SettingsCategory.FINANCIAL:
        return (
          <Card padding="lg">
            <CardHeader title="Financial Settings" subtitle="Configure financial and accounting preferences" />
            <CardContent>{renderFinancialSettings()}</CardContent>
            <CardFooter>
              <Button onClick={() => handleSave(SettingsCategory.FINANCIAL)} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        );
      case SettingsCategory.SALES:
        return (
          <Card padding="lg">
            <CardHeader title="Sales Settings" subtitle="Configure sales and order preferences" />
            <CardContent>{renderSalesSettings()}</CardContent>
            <CardFooter>
              <Button onClick={() => handleSave(SettingsCategory.SALES)} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        );
      case SettingsCategory.INVENTORY:
        return (
          <Card padding="lg">
            <CardHeader title="Inventory Settings" subtitle="Configure inventory management preferences" />
            <CardContent>{renderInventorySettings()}</CardContent>
            <CardFooter>
              <Button onClick={() => handleSave(SettingsCategory.INVENTORY)} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        );
      case SettingsCategory.EMAIL:
        return (
          <Card padding="lg">
            <CardHeader title="Email Settings" subtitle="Configure SMTP settings for email notifications" />
            <CardContent>{renderEmailSettings()}</CardContent>
            <CardFooter>
              <Button onClick={() => handleSave(SettingsCategory.EMAIL)} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        );
      case SettingsCategory.NOTIFICATIONS:
        return (
          <Card padding="lg">
            <CardHeader title="Notification Preferences" subtitle="Configure how you receive notifications" />
            <CardContent>{renderNotificationSettings()}</CardContent>
            <CardFooter>
              <Button onClick={() => handleSave(SettingsCategory.NOTIFICATIONS)} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        );
      case SettingsCategory.INTEGRATIONS:
        return (
          <Card padding="lg">
            <CardHeader title="Integration Settings" subtitle="Configure third-party integrations" />
            <CardContent>{renderIntegrationSettings()}</CardContent>
            <CardFooter>
              <Button onClick={() => handleSave(SettingsCategory.INTEGRATIONS)} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        );
      case SettingsCategory.GENERAL:
        return (
          <Card padding="lg">
            <CardHeader title="General Settings" subtitle="Configure general application preferences" />
            <CardContent>{renderGeneralSettings()}</CardContent>
            <CardFooter>
              <Button onClick={() => handleSave(SettingsCategory.GENERAL)} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="System Settings" subtitle="Configure system-wide settings and preferences" />

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-1 overflow-x-auto" aria-label="Tabs">
          {tabConfig.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                  ${isActive
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
};
