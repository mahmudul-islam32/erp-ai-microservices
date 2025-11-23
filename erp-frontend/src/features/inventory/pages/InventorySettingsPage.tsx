import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { Card, CardHeader, CardContent, CardFooter } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { settingsApi, SettingsCategory, InventorySettings } from '../../settings/services/settingsApi';
import { toast } from 'sonner';
import { Save, Loader2, Package } from 'lucide-react';

export const InventorySettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<InventorySettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<InventorySettings>({
    low_stock_threshold: 10,
    auto_reorder: false,
    default_warehouse: '',
    track_serial_numbers: false,
    track_batch_numbers: false,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const allSettings = await settingsApi.getAll();
      const inventorySetting = allSettings.find(s => s.category === SettingsCategory.INVENTORY);
      
      if (inventorySetting?.inventory) {
        setSettings(inventorySetting.inventory);
        setFormData({
          low_stock_threshold: inventorySetting.inventory.low_stock_threshold ?? 10,
          auto_reorder: inventorySetting.inventory.auto_reorder ?? false,
          default_warehouse: inventorySetting.inventory.default_warehouse ?? '',
          track_serial_numbers: inventorySetting.inventory.track_serial_numbers ?? false,
          track_batch_numbers: inventorySetting.inventory.track_batch_numbers ?? false,
        });
      }
    } catch (error) {
      console.error('Error loading inventory settings:', error);
      toast.error('Failed to load inventory settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await settingsApi.update(SettingsCategory.INVENTORY, {
        inventory: formData,
      });
      
      if (updated.inventory) {
        setSettings(updated.inventory);
        toast.success('Inventory settings saved successfully');
      }
    } catch (error: any) {
      console.error('Error saving inventory settings:', error);
      toast.error('Failed to save inventory settings');
    } finally {
      setSaving(false);
    }
  };

  const updateFormData = (field: keyof InventorySettings, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Inventory Settings" subtitle="Configure inventory management preferences" />
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
        title="Inventory Settings" 
        subtitle="Configure inventory management preferences and tracking options"
        icon={Package}
      />

      <Card padding="lg">
        <CardHeader 
          title="Inventory Configuration" 
          subtitle="Manage stock thresholds, tracking options, and warehouse defaults"
        />
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Low Stock Threshold"
                type="number"
                step="0.1"
                value={formData.low_stock_threshold}
                onChange={(e) => updateFormData('low_stock_threshold', parseFloat(e.target.value))}
                min={0}
                helperText="Alert when stock falls below this quantity"
              />
              <Input
                label="Default Warehouse"
                value={formData.default_warehouse}
                onChange={(e) => updateFormData('default_warehouse', e.target.value)}
                helperText="Default warehouse for new products"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Enable Auto-Reorder
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Automatically create purchase orders when stock falls below threshold
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.auto_reorder}
                  onChange={(e) => updateFormData('auto_reorder', e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
              </div>

              <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Track Serial Numbers
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Enable serial number tracking for individual items
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.track_serial_numbers}
                  onChange={(e) => updateFormData('track_serial_numbers', e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
              </div>

              <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Track Batch Numbers
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Enable batch number tracking for grouped items
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.track_batch_numbers}
                  onChange={(e) => updateFormData('track_batch_numbers', e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
              </div>
            </div>
          </div>
        </CardContent>
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
      </Card>
    </div>
  );
};


