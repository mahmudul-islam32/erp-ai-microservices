import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppearanceSettings } from '../../features/settings/services/settingsApi';
import { settingsApi, SettingsCategory } from '../../features/settings/services/settingsApi';
import { useAppSelector } from '../../app/hooks';

interface AppearanceContextType {
  settings: AppearanceSettings | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const defaultSettings: AppearanceSettings = {
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
};

const AppearanceContext = createContext<AppearanceContextType | undefined>(undefined);

export const AppearanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [settings, setSettings] = useState<AppearanceSettings | null>(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [hasTriedLoad, setHasTriedLoad] = useState(false);

  const loadSettings = async () => {
    // Only try to load settings if user is authenticated
    if (!isAuthenticated) {
      // Use defaults if not authenticated
      if (!hasTriedLoad) {
        setSettings(defaultSettings);
        setHasTriedLoad(true);
      }
      return;
    }

    try {
      setLoading(true);
      const allSettings = await settingsApi.getAll();
      const appearanceSetting = allSettings.find(s => s.category === SettingsCategory.APPEARANCE);
      
      if (appearanceSetting?.appearance) {
        console.log('Loaded appearance settings:', appearanceSetting.appearance);
        setSettings(appearanceSetting.appearance);
      } else {
        console.log('No appearance settings found, using defaults');
        setSettings(defaultSettings);
      }
      setHasTriedLoad(true);
    } catch (error: any) {
      // If 401 Unauthorized, just use defaults and don't retry
      if (error?.response?.status === 401) {
        console.log('Unauthorized access - using default appearance settings');
        setSettings(defaultSettings);
        setHasTriedLoad(true);
        return;
      }
      
      console.error('Error loading appearance settings:', error);
      // Set defaults on error too
      setSettings(defaultSettings);
      setHasTriedLoad(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only load settings when authenticated
    // On initial load when not authenticated, just set defaults
    if (isAuthenticated && !hasTriedLoad) {
      loadSettings();
    } else if (!isAuthenticated && !hasTriedLoad) {
      // Set defaults immediately if not authenticated
      setSettings(defaultSettings);
      setHasTriedLoad(true);
    } else if (isAuthenticated && hasTriedLoad) {
      // Reload when authentication state changes to true
      loadSettings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const refresh = async () => {
    await loadSettings();
  };

  return (
    <AppearanceContext.Provider value={{ settings, loading, refresh }}>
      {children}
    </AppearanceContext.Provider>
  );
};

export const useAppearance = () => {
  const context = useContext(AppearanceContext);
  // Return default values if context is not available (graceful fallback)
  if (context === undefined) {
    return { settings: null, loading: false, refresh: async () => {} };
  }
  return context;
};

