import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { Card, CardHeader, CardContent, CardFooter } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { settingsApi, SettingsCategory, FinancialSettings } from '../../settings/services/settingsApi';
import { toast } from 'sonner';
import { Save, Loader2, DollarSign } from 'lucide-react';
import { usePermissions } from '../../../shared/hooks/usePermissions';
import { Permission } from '../../users/types';

export const FinancialSettingsPage: React.FC = () => {
  const { hasPermission } = usePermissions();
  const canReadSettings = hasPermission(Permission.SETTINGS_READ);
  const canUpdateSettings = hasPermission(Permission.SETTINGS_UPDATE);
  
  const [, setSettings] = useState<FinancialSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FinancialSettings>({
    default_currency: 'USD',
    fiscal_year_start_month: 1,
    tax_rate: 0,
    decimal_places: 2,
    invoice_prefix: '',
    invoice_number_format: '',
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
      const financialSetting = allSettings.find(s => s.category === SettingsCategory.FINANCIAL);
      
      if (financialSetting?.financial) {
        setSettings(financialSetting.financial);
        setFormData({
          default_currency: financialSetting.financial.default_currency ?? 'USD',
          fiscal_year_start_month: financialSetting.financial.fiscal_year_start_month ?? 1,
          tax_rate: financialSetting.financial.tax_rate ?? 0,
          decimal_places: financialSetting.financial.decimal_places ?? 2,
          invoice_prefix: financialSetting.financial.invoice_prefix ?? '',
          invoice_number_format: financialSetting.financial.invoice_number_format ?? '',
        });
      }
    } catch (error: any) {
      console.error('Error loading financial settings:', error);
      // Don't show error toast for permission errors (403) - these are expected
      if (error?.response?.status !== 403) {
        toast.error('Failed to load financial settings');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await settingsApi.update(SettingsCategory.FINANCIAL, {
        financial: formData,
      });
      
      if (updated.financial) {
        setSettings(updated.financial);
        toast.success('Financial settings saved successfully');
      }
    } catch (error: any) {
      console.error('Error saving financial settings:', error);
      toast.error('Failed to save financial settings');
    } finally {
      setSaving(false);
    }
  };

  const updateFormData = (field: keyof FinancialSettings, value: any) => {
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
        <PageHeader title="Financial Settings" subtitle="Configure financial and accounting preferences" />
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
        title="Financial Settings" 
        subtitle="Configure currency, tax rates, and invoice formatting"
        icon={DollarSign}
      />

      <Card padding="lg">
        <CardHeader 
          title="Financial Configuration" 
          subtitle="Manage currency, fiscal year, tax rates, and invoice settings"
        />
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Default Currency"
                value={formData.default_currency}
                onChange={(e) => updateFormData('default_currency', e.target.value.toUpperCase())}
                maxLength={3}
                helperText="ISO currency code (e.g., USD, EUR, GBP)"
              />
              <Input
                label="Fiscal Year Start Month"
                type="number"
                value={formData.fiscal_year_start_month}
                onChange={(e) => updateFormData('fiscal_year_start_month', parseInt(e.target.value))}
                min={1}
                max={12}
                helperText="Month when fiscal year begins (1-12)"
              />
              <Input
                label="Default Tax Rate (%)"
                type="number"
                step="0.01"
                value={(formData.tax_rate || 0) * 100}
                onChange={(e) => updateFormData('tax_rate', parseFloat(e.target.value) / 100)}
                min={0}
                max={100}
                helperText="Default tax rate applied to transactions"
              />
              <Input
                label="Decimal Places"
                type="number"
                value={formData.decimal_places}
                onChange={(e) => updateFormData('decimal_places', parseInt(e.target.value))}
                min={0}
                max={4}
                helperText="Number of decimal places for currency display"
              />
              <Input
                label="Invoice Prefix"
                value={formData.invoice_prefix}
                onChange={(e) => updateFormData('invoice_prefix', e.target.value)}
                maxLength={10}
                helperText="Prefix for invoice numbers (e.g., INV)"
              />
              <Input
                label="Invoice Number Format"
                value={formData.invoice_number_format}
                onChange={(e) => updateFormData('invoice_number_format', e.target.value)}
                placeholder="e.g., INV-{year}-{number}"
                helperText="Format template for invoice numbers"
              />
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

