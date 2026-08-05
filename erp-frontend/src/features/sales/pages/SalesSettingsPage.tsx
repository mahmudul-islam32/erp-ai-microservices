import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { Card, CardHeader, CardContent, CardFooter } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Select } from '../../../shared/components/ui/Select';
import { settingsApi, SettingsCategory, SalesSettings } from '../../settings/services/settingsApi';
import { toast } from 'sonner';
import { Save, Loader2, ShoppingCart } from 'lucide-react';
import { usePermissions } from '../../../shared/hooks/usePermissions';
import { Permission } from '../../users/types';

export const SalesSettingsPage: React.FC = () => {
  const { hasPermission } = usePermissions();
  const canReadSettings = hasPermission(Permission.SETTINGS_READ);
  const canUpdateSettings = hasPermission(Permission.SETTINGS_UPDATE);
  
  const [, setSettings] = useState<SalesSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<SalesSettings>({
    default_payment_terms: 'net_30',
    default_shipping_method: '',
    default_tax_rate: 0,
    auto_generate_invoice: false,
    invoice_due_days: 30,
  });

  useEffect(() => {
    // Only load settings if user has permission
    if (canReadSettings) {
      loadSettings();
    }
  }, [canReadSettings]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const allSettings = await settingsApi.getAll();
      const salesSetting = allSettings.find(s => s.category === SettingsCategory.SALES);
      
      if (salesSetting?.sales) {
        setSettings(salesSetting.sales);
        setFormData({
          default_payment_terms: salesSetting.sales.default_payment_terms ?? 'net_30',
          default_shipping_method: salesSetting.sales.default_shipping_method ?? '',
          default_tax_rate: salesSetting.sales.default_tax_rate ?? 0,
          auto_generate_invoice: salesSetting.sales.auto_generate_invoice ?? false,
          invoice_due_days: salesSetting.sales.invoice_due_days ?? 30,
        });
      }
    } catch (error: any) {
      console.error('Error loading sales settings:', error);
      // Don't show error toast for permission errors (403) - these are expected
      if (error?.response?.status !== 403) {
        toast.error('Failed to load sales settings');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await settingsApi.update(SettingsCategory.SALES, {
        sales: formData,
      });
      
      if (updated.sales) {
        setSettings(updated.sales);
        toast.success('Sales settings saved successfully');
      }
    } catch (error: any) {
      console.error('Error saving sales settings:', error);
      toast.error('Failed to save sales settings');
    } finally {
      setSaving(false);
    }
  };

  const updateFormData = (field: keyof SalesSettings, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Hide settings if user doesn't have permission
  if (!canReadSettings) {
    return null;
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Sales Settings" subtitle="Configure sales and order preferences" />
        <Card padding="lg">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Sales Settings" 
        subtitle="Configure sales, orders, and invoice preferences"
        icon={ShoppingCart}
      />

      <Card padding="lg">
        <CardHeader 
          title="Sales Configuration" 
          subtitle="Manage payment terms, shipping methods, and invoice settings"
        />
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Select
                label="Default Payment Terms"
                value={formData.default_payment_terms}
                onChange={(e) => updateFormData('default_payment_terms', e.target.value)}
                options={[
                  { value: 'net_15', label: 'Net 15' },
                  { value: 'net_30', label: 'Net 30' },
                  { value: 'net_45', label: 'Net 45' },
                  { value: 'net_60', label: 'Net 60' },
                  { value: 'cod', label: 'Cash on Delivery' },
                  { value: 'prepaid', label: 'Prepaid' },
                ]}
                helperText="Default payment terms for new orders"
              />
              <Input
                label="Default Shipping Method"
                value={formData.default_shipping_method}
                onChange={(e) => updateFormData('default_shipping_method', e.target.value)}
                helperText="Default shipping method for new orders"
              />
              <Input
                label="Default Tax Rate (%)"
                type="number"
                step="0.01"
                value={(formData.default_tax_rate || 0) * 100}
                onChange={(e) => updateFormData('default_tax_rate', parseFloat(e.target.value) / 100)}
                min={0}
                max={100}
                helperText="Default tax rate applied to orders"
              />
              <Input
                label="Invoice Due Days"
                type="number"
                value={formData.invoice_due_days}
                onChange={(e) => updateFormData('invoice_due_days', parseInt(e.target.value))}
                min={1}
                max={365}
                helperText="Default number of days until invoice is due"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Auto-generate Invoice from Order
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Automatically create invoices when orders are completed
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.auto_generate_invoice}
                  onChange={(e) => updateFormData('auto_generate_invoice', e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
              </div>
            </div>
          </div>
        </CardContent>
        {canUpdateSettings && (
          <CardFooter>
            <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

