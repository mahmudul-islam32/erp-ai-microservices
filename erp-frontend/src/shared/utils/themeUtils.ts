import { AppearanceSettings } from '../../features/settings/services/settingsApi';

/**
 * Apply appearance settings to the document by injecting CSS variables
 */
export const applyAppearanceSettings = (settings: AppearanceSettings | null | undefined) => {
  if (!settings) {
    // Reset to defaults
    resetAppearanceSettings();
    return;
  }

  const root = document.documentElement;

  // Apply font settings
  root.style.setProperty('--font-family', settings.font_family || 'Inter');
  root.style.setProperty('--font-size-base', settings.font_size_base || '14px');
  root.style.setProperty('--font-size-small', settings.font_size_small || '12px');
  root.style.setProperty('--font-size-large', settings.font_size_large || '16px');
  root.style.setProperty('--font-weight-normal', String(settings.font_weight_normal || 400));
  root.style.setProperty('--font-weight-medium', String(settings.font_weight_medium || 500));
  root.style.setProperty('--font-weight-bold', String(settings.font_weight_bold || 700));

  // Apply color settings
  root.style.setProperty('--color-primary', settings.primary_color || '#3b82f6');
  root.style.setProperty('--color-primary-dark', settings.primary_color_dark || '#2563eb');
  root.style.setProperty('--color-secondary', settings.secondary_color || '#64748b');
  root.style.setProperty('--color-accent', settings.accent_color || '#8b5cf6');
  root.style.setProperty('--color-success', settings.success_color || '#22c55e');
  root.style.setProperty('--color-warning', settings.warning_color || '#f59e0b');
  root.style.setProperty('--color-danger', settings.danger_color || '#ef4444');
  root.style.setProperty('--color-background', settings.background_color || '#ffffff');
  root.style.setProperty('--color-background-dark', settings.background_color_dark || '#0f172a');
  root.style.setProperty('--color-text', settings.text_color || '#1e293b');
  root.style.setProperty('--color-text-dark', settings.text_color_dark || '#f1f5f9');

  // Apply UI settings
  root.style.setProperty('--border-radius', settings.border_radius || '0.375rem');
  root.style.setProperty('--border-radius-large', settings.border_radius_large || '0.5rem');
  root.style.setProperty('--spacing-unit', settings.spacing_unit || '0.25rem');

  // Apply font family globally - Tailwind will use the CSS variable
  // The CSS variable is already set on :root, so it will cascade to all elements

  // Apply custom CSS if provided
  if (settings.custom_css) {
    let styleElement = document.getElementById('custom-appearance-css');
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'custom-appearance-css';
      document.head.appendChild(styleElement);
    }
    styleElement.textContent = settings.custom_css;
  } else {
    // Remove custom CSS if not provided
    const styleElement = document.getElementById('custom-appearance-css');
    if (styleElement) {
      styleElement.remove();
    }
  }
};

/**
 * Reset appearance settings to defaults
 */
export const resetAppearanceSettings = () => {
  const root = document.documentElement;
  
  // Reset to default values instead of removing

  // Reset to default values instead of removing
  root.style.setProperty('--font-family', 'Inter, system-ui, -apple-system, sans-serif');
  root.style.setProperty('--font-size-base', '14px');
  root.style.setProperty('--font-size-small', '12px');
  root.style.setProperty('--font-size-large', '16px');
  root.style.setProperty('--font-weight-normal', '400');
  root.style.setProperty('--font-weight-medium', '500');
  root.style.setProperty('--font-weight-bold', '700');
  root.style.setProperty('--color-primary', '#3b82f6');
  root.style.setProperty('--color-primary-dark', '#2563eb');
  root.style.setProperty('--color-secondary', '#64748b');
  root.style.setProperty('--color-accent', '#8b5cf6');
  root.style.setProperty('--color-success', '#22c55e');
  root.style.setProperty('--color-warning', '#f59e0b');
  root.style.setProperty('--color-danger', '#ef4444');
  root.style.setProperty('--color-background', '#ffffff');
  root.style.setProperty('--color-background-dark', '#0f172a');
  root.style.setProperty('--color-text', '#1e293b');
  root.style.setProperty('--color-text-dark', '#f1f5f9');
  root.style.setProperty('--border-radius', '0.375rem');
  root.style.setProperty('--border-radius-large', '0.5rem');
  root.style.setProperty('--spacing-unit', '0.25rem');

  // Remove custom CSS
  const styleElement = document.getElementById('custom-appearance-css');
  if (styleElement) {
    styleElement.remove();
  }
};

