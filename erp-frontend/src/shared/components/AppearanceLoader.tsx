import { useEffect } from 'react';
import { useAppSelector } from '../../app/hooks';
import { settingsApi, SettingsCategory } from '../../features/settings/services/settingsApi';
import { applyAppearanceSettings } from '../utils/themeUtils';

/**
 * Component that loads and applies appearance settings on app startup
 * Only loads when user is authenticated
 */
export const AppearanceLoader: React.FC = () => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Only load settings if user is authenticated
    if (!isAuthenticated) {
      return;
    }

    const loadAppearanceSettings = async () => {
      try {
        console.log('Loading appearance settings...');
        const allSettings = await settingsApi.getAll();
        const appearanceSetting = allSettings.find(
          (s) => s.category === SettingsCategory.APPEARANCE
        );

        if (appearanceSetting?.appearance) {
          console.log('Found appearance settings, applying...', appearanceSetting.appearance);
          applyAppearanceSettings(appearanceSetting.appearance);
        } else {
          console.log('No appearance settings found, using defaults');
        }
      } catch (error) {
        console.error('Error loading appearance settings:', error);
        // Silently fail - use defaults
      }
    };

    loadAppearanceSettings();
  }, [isAuthenticated]);

  return null; // This component doesn't render anything
};

