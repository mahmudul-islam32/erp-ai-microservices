import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { Card, CardHeader, CardContent, CardFooter } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Select } from '../../../shared/components/ui/Select';
import { settingsApi, SettingsCategory, AppearanceSettings } from '../../settings/services/settingsApi';
import { applyAppearanceSettings } from '../../../shared/utils/themeUtils';
import { toast } from 'sonner';
import { Save, Loader2, Palette, Type, Sparkles } from 'lucide-react';

const FONT_FAMILIES = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Source Sans Pro', label: 'Source Sans Pro' },
  { value: 'Nunito', label: 'Nunito' },
  { value: 'Raleway', label: 'Raleway' },
  { value: 'Ubuntu', label: 'Ubuntu' },
];

export const AppearanceSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<AppearanceSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<AppearanceSettings>({
    font_family: 'Inter',
    font_size_base: '14px',
    font_size_small: '12px',
    font_size_large: '16px',
    font_weight_normal: 400,
    font_weight_medium: 500,
    font_weight_bold: 700,
    primary_color: '#3b82f6',
    primary_color_dark: '#2563eb',
    secondary_color: '#64748b',
    accent_color: '#8b5cf6',
    success_color: '#22c55e',
    warning_color: '#f59e0b',
    danger_color: '#ef4444',
    background_color: '#ffffff',
    background_color_dark: '#0f172a',
    text_color: '#1e293b',
    text_color_dark: '#f1f5f9',
    border_radius: '0.375rem',
    border_radius_large: '0.5rem',
    spacing_unit: '0.25rem',
    custom_css: '',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  // Apply settings when formData changes (for preview)
  useEffect(() => {
    applyAppearanceSettings(formData);
  }, [formData]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const allSettings = await settingsApi.getAll();
      const appearanceSetting = allSettings.find(s => s.category === SettingsCategory.APPEARANCE);
      
      if (appearanceSetting?.appearance) {
        setSettings(appearanceSetting.appearance);
        setFormData({
          font_family: appearanceSetting.appearance.font_family ?? 'Inter',
          font_size_base: appearanceSetting.appearance.font_size_base ?? '14px',
          font_size_small: appearanceSetting.appearance.font_size_small ?? '12px',
          font_size_large: appearanceSetting.appearance.font_size_large ?? '16px',
          font_weight_normal: appearanceSetting.appearance.font_weight_normal ?? 400,
          font_weight_medium: appearanceSetting.appearance.font_weight_medium ?? 500,
          font_weight_bold: appearanceSetting.appearance.font_weight_bold ?? 700,
          primary_color: appearanceSetting.appearance.primary_color ?? '#3b82f6',
          primary_color_dark: appearanceSetting.appearance.primary_color_dark ?? '#2563eb',
          secondary_color: appearanceSetting.appearance.secondary_color ?? '#64748b',
          accent_color: appearanceSetting.appearance.accent_color ?? '#8b5cf6',
          success_color: appearanceSetting.appearance.success_color ?? '#22c55e',
          warning_color: appearanceSetting.appearance.warning_color ?? '#f59e0b',
          danger_color: appearanceSetting.appearance.danger_color ?? '#ef4444',
          background_color: appearanceSetting.appearance.background_color ?? '#ffffff',
          background_color_dark: appearanceSetting.appearance.background_color_dark ?? '#0f172a',
          text_color: appearanceSetting.appearance.text_color ?? '#1e293b',
          text_color_dark: appearanceSetting.appearance.text_color_dark ?? '#f1f5f9',
          border_radius: appearanceSetting.appearance.border_radius ?? '0.375rem',
          border_radius_large: appearanceSetting.appearance.border_radius_large ?? '0.5rem',
          spacing_unit: appearanceSetting.appearance.spacing_unit ?? '0.25rem',
          custom_css: appearanceSetting.appearance.custom_css ?? '',
        });
      }
    } catch (error) {
      console.error('Error loading appearance settings:', error);
      toast.error('Failed to load appearance settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      console.log('Saving appearance settings:', formData);
      const updated = await settingsApi.update(SettingsCategory.APPEARANCE, {
        appearance: formData,
      });
      
      console.log('Settings saved, response:', updated);
      
      if (updated.appearance) {
        setSettings(updated.appearance);
        applyAppearanceSettings(updated.appearance);
        toast.success('Appearance settings saved successfully');
        // Force a small delay to ensure settings are persisted
        setTimeout(() => {
          console.log('Settings should now be persisted');
        }, 100);
      } else {
        console.warn('No appearance data in response:', updated);
        toast.error('Settings saved but appearance data not returned');
      }
    } catch (error: any) {
      console.error('Error saving appearance settings:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to save appearance settings';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const updateFormData = (field: keyof AppearanceSettings, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetToDefaults = () => {
    setFormData({
      font_family: 'Inter',
      font_size_base: '14px',
      font_size_small: '12px',
      font_size_large: '16px',
      font_weight_normal: 400,
      font_weight_medium: 500,
      font_weight_bold: 700,
      primary_color: '#3b82f6',
      primary_color_dark: '#2563eb',
      secondary_color: '#64748b',
      accent_color: '#8b5cf6',
      success_color: '#22c55e',
      warning_color: '#f59e0b',
      danger_color: '#ef4444',
      background_color: '#ffffff',
      background_color_dark: '#0f172a',
      text_color: '#1e293b',
      text_color_dark: '#f1f5f9',
      border_radius: '0.375rem',
      border_radius_large: '0.5rem',
      spacing_unit: '0.25rem',
      custom_css: '',
    });
    toast.info('Reset to default values');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Appearance Settings" subtitle="Customize fonts, colors, and styling" />
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
        title="Appearance Settings" 
        subtitle="Customize fonts, colors, and styling preferences"
        icon={Palette}
      />

      {/* Font Settings */}
      <Card padding="lg">
        <CardHeader 
          title="Font Settings" 
          subtitle="Configure typography and font preferences"
          icon={Type}
        />
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Select
                label="Font Family"
                value={formData.font_family}
                onChange={(e) => updateFormData('font_family', e.target.value)}
                options={FONT_FAMILIES}
                helperText="Select the primary font family for the application"
              />
              <Input
                label="Base Font Size"
                value={formData.font_size_base}
                onChange={(e) => updateFormData('font_size_base', e.target.value)}
                placeholder="14px"
                helperText="Base font size (e.g., 14px, 16px)"
              />
              <Input
                label="Small Font Size"
                value={formData.font_size_small}
                onChange={(e) => updateFormData('font_size_small', e.target.value)}
                placeholder="12px"
              />
              <Input
                label="Large Font Size"
                value={formData.font_size_large}
                onChange={(e) => updateFormData('font_size_large', e.target.value)}
                placeholder="16px"
              />
              <Input
                label="Normal Font Weight"
                type="number"
                value={formData.font_weight_normal}
                onChange={(e) => updateFormData('font_weight_normal', parseInt(e.target.value))}
                min={100}
                max={900}
                step={100}
                helperText="Font weight (100-900)"
              />
              <Input
                label="Medium Font Weight"
                type="number"
                value={formData.font_weight_medium}
                onChange={(e) => updateFormData('font_weight_medium', parseInt(e.target.value))}
                min={100}
                max={900}
                step={100}
              />
              <Input
                label="Bold Font Weight"
                type="number"
                value={formData.font_weight_bold}
                onChange={(e) => updateFormData('font_weight_bold', parseInt(e.target.value))}
                min={100}
                max={900}
                step={100}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Color Settings */}
      <Card padding="lg">
        <CardHeader 
          title="Color Settings" 
          subtitle="Customize the color palette"
          icon={Palette}
        />
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Primary Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.primary_color}
                    onChange={(e) => updateFormData('primary_color', e.target.value)}
                    className="w-16 h-10 rounded border border-slate-300 cursor-pointer"
                  />
                  <Input
                    value={formData.primary_color}
                    onChange={(e) => updateFormData('primary_color', e.target.value)}
                    placeholder="#3b82f6"
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Primary Color (Dark)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.primary_color_dark}
                    onChange={(e) => updateFormData('primary_color_dark', e.target.value)}
                    className="w-16 h-10 rounded border border-slate-300 cursor-pointer"
                  />
                  <Input
                    value={formData.primary_color_dark}
                    onChange={(e) => updateFormData('primary_color_dark', e.target.value)}
                    placeholder="#2563eb"
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Secondary Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.secondary_color}
                    onChange={(e) => updateFormData('secondary_color', e.target.value)}
                    className="w-16 h-10 rounded border border-slate-300 cursor-pointer"
                  />
                  <Input
                    value={formData.secondary_color}
                    onChange={(e) => updateFormData('secondary_color', e.target.value)}
                    placeholder="#64748b"
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Accent Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.accent_color}
                    onChange={(e) => updateFormData('accent_color', e.target.value)}
                    className="w-16 h-10 rounded border border-slate-300 cursor-pointer"
                  />
                  <Input
                    value={formData.accent_color}
                    onChange={(e) => updateFormData('accent_color', e.target.value)}
                    placeholder="#8b5cf6"
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Success Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.success_color}
                    onChange={(e) => updateFormData('success_color', e.target.value)}
                    className="w-16 h-10 rounded border border-slate-300 cursor-pointer"
                  />
                  <Input
                    value={formData.success_color}
                    onChange={(e) => updateFormData('success_color', e.target.value)}
                    placeholder="#22c55e"
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Warning Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.warning_color}
                    onChange={(e) => updateFormData('warning_color', e.target.value)}
                    className="w-16 h-10 rounded border border-slate-300 cursor-pointer"
                  />
                  <Input
                    value={formData.warning_color}
                    onChange={(e) => updateFormData('warning_color', e.target.value)}
                    placeholder="#f59e0b"
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Danger Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.danger_color}
                    onChange={(e) => updateFormData('danger_color', e.target.value)}
                    className="w-16 h-10 rounded border border-slate-300 cursor-pointer"
                  />
                  <Input
                    value={formData.danger_color}
                    onChange={(e) => updateFormData('danger_color', e.target.value)}
                    placeholder="#ef4444"
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Background Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.background_color}
                    onChange={(e) => updateFormData('background_color', e.target.value)}
                    className="w-16 h-10 rounded border border-slate-300 cursor-pointer"
                  />
                  <Input
                    value={formData.background_color}
                    onChange={(e) => updateFormData('background_color', e.target.value)}
                    placeholder="#ffffff"
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Background Color (Dark)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.background_color_dark}
                    onChange={(e) => updateFormData('background_color_dark', e.target.value)}
                    className="w-16 h-10 rounded border border-slate-300 cursor-pointer"
                  />
                  <Input
                    value={formData.background_color_dark}
                    onChange={(e) => updateFormData('background_color_dark', e.target.value)}
                    placeholder="#0f172a"
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Text Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.text_color}
                    onChange={(e) => updateFormData('text_color', e.target.value)}
                    className="w-16 h-10 rounded border border-slate-300 cursor-pointer"
                  />
                  <Input
                    value={formData.text_color}
                    onChange={(e) => updateFormData('text_color', e.target.value)}
                    placeholder="#1e293b"
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Text Color (Dark)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.text_color_dark}
                    onChange={(e) => updateFormData('text_color_dark', e.target.value)}
                    className="w-16 h-10 rounded border border-slate-300 cursor-pointer"
                  />
                  <Input
                    value={formData.text_color_dark}
                    onChange={(e) => updateFormData('text_color_dark', e.target.value)}
                    placeholder="#f1f5f9"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* UI Settings */}
      <Card padding="lg">
        <CardHeader 
          title="UI Settings" 
          subtitle="Configure border radius and spacing"
          icon={Sparkles}
        />
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Border Radius"
              value={formData.border_radius}
              onChange={(e) => updateFormData('border_radius', e.target.value)}
              placeholder="0.375rem"
              helperText="Default border radius (e.g., 0.375rem, 8px)"
            />
            <Input
              label="Border Radius (Large)"
              value={formData.border_radius_large}
              onChange={(e) => updateFormData('border_radius_large', e.target.value)}
              placeholder="0.5rem"
              helperText="Large border radius for cards and modals"
            />
            <Input
              label="Spacing Unit"
              value={formData.spacing_unit}
              onChange={(e) => updateFormData('spacing_unit', e.target.value)}
              placeholder="0.25rem"
              helperText="Base spacing unit (e.g., 0.25rem, 4px)"
            />
          </div>
        </CardContent>
      </Card>

      {/* Custom CSS */}
      <Card padding="lg">
        <CardHeader 
          title="Custom CSS" 
          subtitle="Add custom CSS rules for advanced styling"
        />
        <CardContent>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Custom CSS Rules
            </label>
            <textarea
              value={formData.custom_css || ''}
              onChange={(e) => updateFormData('custom_css', e.target.value)}
              placeholder="/* Add your custom CSS here */&#10;.custom-class {&#10;  /* styles */&#10;}"
              className="w-full h-48 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md font-mono text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={10}
            />
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Add custom CSS rules that will be applied globally. Use with caution.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex items-center justify-between w-full">
            <Button variant="outline" onClick={resetToDefaults}>
              Reset to Defaults
            </Button>
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
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

