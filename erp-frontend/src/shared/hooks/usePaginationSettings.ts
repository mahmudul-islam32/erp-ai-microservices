import { useMemo } from 'react';
import { useAppearance } from '../contexts/AppearanceContext';

/**
 * Hook to get pagination settings from appearance settings
 * Returns default items per page and items per page options
 */
export const usePaginationSettings = () => {
  const { settings } = useAppearance();

  const defaultItemsPerPage = useMemo(() => {
    return settings?.pagination_default_items_per_page || 25;
  }, [settings?.pagination_default_items_per_page]);

  const itemsPerPageOptions = useMemo(() => {
    if (settings?.pagination_items_per_page_options) {
      const options = settings.pagination_items_per_page_options
        .split(',')
        .map(s => parseInt(s.trim()))
        .filter(n => !isNaN(n) && n > 0);
      
      if (options.length > 0) {
        return options;
      }
    }
    // Default options if not set
    return [10, 25, 50, 100];
  }, [settings?.pagination_items_per_page_options]);

  return {
    defaultItemsPerPage,
    itemsPerPageOptions,
  };
};
