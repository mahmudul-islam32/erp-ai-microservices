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
  font_family: 'Roboto',
  heading_font_family: 'Rubik',
  font_size_base: '14px',
  font_size_small: '12px',
  font_size_large: '16px',
  font_weight_normal: 400,
  font_weight_medium: 500,
  font_weight_bold: 700,
  primary_color: '#253c6a',
  primary_color_dark: '#1a2d4f',
  secondary_color: '#355697',
  accent_color: '#ffee00',
  success_color: '#1d871e',
  warning_color: '#ffaa00',
  danger_color: '#e24312',
  info_color: '#19a1e6',
  background_color: '#f6f7f9',
  background_color_dark: '#1a2d4f',
  text_color: '#2b303b',
  text_color_dark: '#f1f5f9',
  border_radius: '0.375rem',
  border_radius_large: '0.5rem',
  spacing_unit: '0.25rem',
  button_default_size: 'small',
  icon_default_size: 'default',
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
  layout_type: 'vertical',
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
        setSettings({ ...defaultSettings });
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
        // Create a new object to ensure React detects the change
        setSettings({ ...appearanceSetting.appearance });
      } else {
        console.log('No appearance settings found, using defaults');
        setSettings({ ...defaultSettings });
      }
      setHasTriedLoad(true);
    } catch (error: any) {
      // If 401 Unauthorized, just use defaults and don't retry
      if (error?.response?.status === 401) {
        console.log('Unauthorized access - using default appearance settings');
        setSettings({ ...defaultSettings });
        setHasTriedLoad(true);
        return;
      }
      
      console.error('Error loading appearance settings:', error);
      // Set defaults on error too
      setSettings({ ...defaultSettings });
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
      setSettings({ ...defaultSettings });
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

