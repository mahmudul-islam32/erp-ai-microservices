import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { Card, CardHeader, CardContent, CardFooter } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Select } from '../../../shared/components/ui/Select';
import { settingsApi, SettingsCategory, AppearanceSettings } from '../../settings/services/settingsApi';
import { applyAppearanceSettings } from '../../../shared/utils/themeUtils';
import { useAppearance } from '../../../shared/contexts/AppearanceContext';
import { toast } from 'sonner';
import { Save, Loader2, Palette, Type, Sparkles, MousePointer2, List } from 'lucide-react';
import { SEMANTIC_SIZE_OPTIONS } from '../../../shared/utils/sizeMapping';
import { usePermissions } from '../../../shared/hooks/usePermissions';
import { Permission } from '../../users/types';

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
  const { refresh } = useAppearance();
  const { hasPermission } = usePermissions();
  const [settings, setSettings] = useState<AppearanceSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const canRead = hasPermission(Permission.SETTINGS_READ);
  const canUpdate = hasPermission(Permission.SETTINGS_UPDATE);
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
    icon_button_default_size: 'md',
    icon_button_default_variant: 'primary',
    icon_button_padding_size: 'medium',
    icon_button_icon_size: 'medium',
    pagination_design: 'modern',
    pagination_default_items_per_page: 25,
    pagination_active_color: undefined,
    pagination_hover_color: undefined,
    pagination_text_color: undefined,
    pagination_border_color: undefined,
    pagination_items_per_page_options: undefined,
    custom_css: '',
  });

  useEffect(() => {
    // Permission check is handled by ProtectedRoute/PermissionRoute
    // Only load settings if user has permission (silent check)
    if (canRead) {
      loadSettings();
    }
  }, [canRead]);

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
        console.log('Loading existing appearance settings:', appearanceSetting.appearance);
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
          icon_button_default_size: appearanceSetting.appearance.icon_button_default_size ?? 'md',
          icon_button_default_variant: appearanceSetting.appearance.icon_button_default_variant ?? 'primary',
          // Use new single field, fallback to medium for backward compatibility
          icon_button_padding_size: appearanceSetting.appearance.icon_button_padding_size ?? 'medium',
          icon_button_icon_size: appearanceSetting.appearance.icon_button_icon_size ?? 'medium',
          pagination_design: appearanceSetting.appearance.pagination_design ?? 'modern',
          pagination_default_items_per_page: appearanceSetting.appearance.pagination_default_items_per_page ?? 25,
          pagination_active_color: appearanceSetting.appearance.pagination_active_color,
          pagination_hover_color: appearanceSetting.appearance.pagination_hover_color,
          pagination_text_color: appearanceSetting.appearance.pagination_text_color,
          pagination_border_color: appearanceSetting.appearance.pagination_border_color,
          pagination_items_per_page_options: appearanceSetting.appearance.pagination_items_per_page_options,
          custom_css: appearanceSetting.appearance.custom_css ?? '',
        });
      } else {
        console.log('No existing appearance settings found, using defaults');
        // Keep default formData, but settings will remain null until first save
      }
    } catch (error) {
      console.error('Error loading appearance settings:', error);
      toast.error('Failed to load appearance settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!canUpdate) {
      toast.error('You do not have permission to update appearance settings');
      return;
    }
    
    setSaving(true);
    try {
      console.log('Saving appearance settings:', JSON.stringify(formData, null, 2));
      
      // Ensure ALL fields are explicitly present - this ensures backend saves everything
      const settingsToSave: AppearanceSettings = {
        font_family: formData.font_family || 'Inter',
        font_size_base: formData.font_size_base || '14px',
        font_size_small: formData.font_size_small || '12px',
        font_size_large: formData.font_size_large || '16px',
        font_weight_normal: formData.font_weight_normal ?? 400,
        font_weight_medium: formData.font_weight_medium ?? 500,
        font_weight_bold: formData.font_weight_bold ?? 700,
        primary_color: formData.primary_color || '#3b82f6',
        primary_color_dark: formData.primary_color_dark || '#2563eb',
        secondary_color: formData.secondary_color || '#64748b',
        accent_color: formData.accent_color || '#8b5cf6',
        success_color: formData.success_color || '#22c55e',
        warning_color: formData.warning_color || '#f59e0b',
        danger_color: formData.danger_color || '#ef4444',
        background_color: formData.background_color || '#ffffff',
        background_color_dark: formData.background_color_dark || '#0f172a',
        text_color: formData.text_color || '#1e293b',
        text_color_dark: formData.text_color_dark || '#f1f5f9',
        border_radius: formData.border_radius || '0.375rem',
        border_radius_large: formData.border_radius_large || '0.5rem',
        spacing_unit: formData.spacing_unit || '0.25rem',
        icon_button_default_size: formData.icon_button_default_size || 'md',
        icon_button_default_variant: formData.icon_button_default_variant || 'primary',
        icon_button_padding_size: formData.icon_button_padding_size || 'medium',
        icon_button_icon_size: formData.icon_button_icon_size || 'medium',
        pagination_design: formData.pagination_design || 'modern',
        pagination_default_items_per_page: formData.pagination_default_items_per_page ?? 25,
        pagination_active_color: formData.pagination_active_color,
        pagination_hover_color: formData.pagination_hover_color,
        pagination_text_color: formData.pagination_text_color,
        pagination_border_color: formData.pagination_border_color,
        pagination_items_per_page_options: formData.pagination_items_per_page_options,
        custom_css: formData.custom_css || '',
      };
      
      console.log('Settings to save:', JSON.stringify(settingsToSave, null, 2));
      
      const updated = await settingsApi.update(SettingsCategory.APPEARANCE, {
        appearance: settingsToSave,
      });
      
      console.log('Settings saved, response:', JSON.stringify(updated, null, 2));
      
      if (updated.appearance) {
        setSettings(updated.appearance);
        applyAppearanceSettings(updated.appearance);
        
        // Refresh the appearance context so all IconButton components pick up new settings
        // Wait a moment for the backend to persist, then refresh
        await new Promise(resolve => setTimeout(resolve, 300));
        await refresh();
        console.log('Appearance context refreshed after save with settings:', updated.appearance);
        
        toast.success('Appearance settings saved successfully');
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
      icon_button_default_size: 'md',
      icon_button_default_variant: 'primary',
      icon_button_padding_size: 'medium',
      icon_button_icon_size: 'medium',
      pagination_design: 'modern',
      pagination_default_items_per_page: 25,
      pagination_active_color: undefined,
      pagination_hover_color: undefined,
      pagination_text_color: undefined,
      pagination_border_color: undefined,
      pagination_items_per_page_options: undefined,
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

      {/* Action Button Settings */}
      <Card padding="lg">
        <CardHeader 
          title="Action Button Settings" 
          subtitle="Configure default properties for action buttons in tables and throughout the app"
          icon={MousePointer2}
        />
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Select
                label="Default Size"
                value={formData.icon_button_default_size || 'md'}
                onChange={(e) => updateFormData('icon_button_default_size', e.target.value as 'xs' | 'sm' | 'md' | 'lg')}
                options={[
                  { value: 'xs', label: 'Extra Small (xs)' },
                  { value: 'sm', label: 'Small (sm)' },
                  { value: 'md', label: 'Medium (md)' },
                  { value: 'lg', label: 'Large (lg)' },
                ]}
                helperText="Default size for action buttons in tables when not specified"
              />
              <Select
                label="Default Variant"
                value={formData.icon_button_default_variant || 'primary'}
                onChange={(e) => updateFormData('icon_button_default_variant', e.target.value)}
                options={[
                  { value: 'primary', label: 'Primary' },
                  { value: 'secondary', label: 'Secondary' },
                  { value: 'outline', label: 'Outline' },
                  { value: 'danger', label: 'Danger' },
                  { value: 'ghost', label: 'Ghost' },
                  { value: 'success', label: 'Success' },
                  { value: 'warning', label: 'Warning' },
                  { value: 'info', label: 'Info' },
                ]}
                helperText="Default color variant for action buttons in tables"
              />
            </div>

            <div className="border-t pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Select
                  label="Padding Size"
                  value={formData.icon_button_padding_size || 'medium'}
                  onChange={(e) => updateFormData('icon_button_padding_size', e.target.value)}
                  options={SEMANTIC_SIZE_OPTIONS}
                  helperText="Base padding size for action buttons in tables (scales automatically for different button sizes)"
                />
                <Select
                  label="Icon Size"
                  value={formData.icon_button_icon_size || 'medium'}
                  onChange={(e) => updateFormData('icon_button_icon_size', e.target.value)}
                  options={SEMANTIC_SIZE_OPTIONS}
                  helperText="Base icon size for action buttons in tables (scales automatically for different button sizes)"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pagination Settings */}
      <Card padding="lg">
        <CardHeader 
          title="Pagination Settings" 
          subtitle="Configure pagination design, default items per page, and color styles"
          icon={List}
        />
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Select
                label="Pagination Design"
                value={formData.pagination_design || 'modern'}
                onChange={(e) => updateFormData('pagination_design', e.target.value as 'modern' | 'classic')}
                options={[
                  { value: 'modern', label: 'Modern (Rounded, Spaced)' },
                  { value: 'classic', label: 'Classic (Connected, Traditional)' },
                ]}
                helperText="Choose between modern rounded design or classic connected design"
              />
              <Input
                label="Default Items Per Page"
                type="number"
                value={formData.pagination_default_items_per_page || 25}
                onChange={(e) => updateFormData('pagination_default_items_per_page', parseInt(e.target.value))}
                min={10}
                max={100}
                helperText="Default number of items to show per page (10-100)"
              />
              <Input
                label="Items Per Page Options"
                value={formData.pagination_items_per_page_options || '10,25,50,100'}
                onChange={(e) => updateFormData('pagination_items_per_page_options', e.target.value)}
                placeholder="10,25,50,100"
                helperText="Comma-separated list of items per page options"
              />
            </div>

            <div className="border-t pt-6">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
                Color Customization
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Leave blank to use primary theme colors, or set custom colors for pagination
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Active Page Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.pagination_active_color || formData.primary_color || '#3b82f6'}
                      onChange={(e) => updateFormData('pagination_active_color', e.target.value)}
                      className="w-16 h-10 rounded border border-slate-300 cursor-pointer"
                    />
                    <Input
                      value={formData.pagination_active_color || ''}
                      onChange={(e) => updateFormData('pagination_active_color', e.target.value || undefined)}
                      placeholder="Leave blank for primary color"
                      className="flex-1"
                    />
                    {formData.pagination_active_color && (
                      <button
                        onClick={() => updateFormData('pagination_active_color', undefined)}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Hover Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.pagination_hover_color || '#64748b'}
                      onChange={(e) => updateFormData('pagination_hover_color', e.target.value)}
                      className="w-16 h-10 rounded border border-slate-300 cursor-pointer"
                    />
                    <Input
                      value={formData.pagination_hover_color || ''}
                      onChange={(e) => updateFormData('pagination_hover_color', e.target.value || undefined)}
                      placeholder="Leave blank for default hover"
                      className="flex-1"
                    />
                    {formData.pagination_hover_color && (
                      <button
                        onClick={() => updateFormData('pagination_hover_color', undefined)}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Text Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.pagination_text_color || '#1e293b'}
                      onChange={(e) => updateFormData('pagination_text_color', e.target.value)}
                      className="w-16 h-10 rounded border border-slate-300 cursor-pointer"
                    />
                    <Input
                      value={formData.pagination_text_color || ''}
                      onChange={(e) => updateFormData('pagination_text_color', e.target.value || undefined)}
                      placeholder="Leave blank for default text color"
                      className="flex-1"
                    />
                    {formData.pagination_text_color && (
                      <button
                        onClick={() => updateFormData('pagination_text_color', undefined)}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Border Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.pagination_border_color || '#e5e7eb'}
                      onChange={(e) => updateFormData('pagination_border_color', e.target.value)}
                      className="w-16 h-10 rounded border border-slate-300 cursor-pointer"
                    />
                    <Input
                      value={formData.pagination_border_color || ''}
                      onChange={(e) => updateFormData('pagination_border_color', e.target.value || undefined)}
                      placeholder="Leave blank for default border color"
                      className="flex-1"
                    />
                    {formData.pagination_border_color && (
                      <button
                        onClick={() => updateFormData('pagination_border_color', undefined)}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
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
        {canUpdate && (
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
        )}
      </Card>
    </div>
  );
};

