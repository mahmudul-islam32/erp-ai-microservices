import React from 'react';
import { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { useAppearance } from '../../contexts/AppearanceContext';
import { getPaddingClass, getIconSizeClass } from '../../utils/sizeMapping';

export interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /**
   * The icon component to display (from lucide-react or any React component)
   */
  icon: React.ComponentType<{ className?: string }> | LucideIcon;
  
  /**
   * Button variant/color scheme
   */
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success' | 'warning' | 'info';
  
  /**
   * Button size
   */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  
  /**
   * Tooltip text shown on hover
   */
  title?: string;
  
  /**
   * Icon size (overrides default size-based icon sizing)
   */
  iconSize?: number | string;
  
  /**
   * Whether the button is in a loading state
   */
  isLoading?: boolean;
  
  /**
   * Custom padding (overrides size-based padding)
   */
  padding?: string;
}

/**
 * IconButton - A flexible, reusable icon-only button component
 * 
 * @example
 * ```tsx
 * <IconButton
 *   icon={Edit}
 *   variant="primary"
 *   size="sm"
 *   onClick={handleEdit}
 *   title="Edit item"
 * />
 * ```
 */
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon: Icon,
      variant,
      size,
      title,
      iconSize,
      isLoading = false,
      padding,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    // Get appearance settings from context
    const { settings } = useAppearance();
    
    // Use appearance settings as defaults if available, otherwise use component defaults
    const defaultVariant = (settings?.icon_button_default_variant as IconButtonProps['variant']) || 'primary';
    const defaultSize = (settings?.icon_button_default_size as IconButtonProps['size']) || 'md';
    
    const finalVariant = variant || defaultVariant;
    const finalSize = size || defaultSize;
    
    // Debug logging (can be removed in production)
    if (process.env.NODE_ENV === 'development' && !variant && !size) {
      // Only log if we're using default values to avoid spam
      console.log('IconButton using appearance settings:', {
        paddingSize: settings?.icon_button_padding_size,
        iconSize: settings?.icon_button_icon_size,
        defaultSize,
        defaultVariant,
      });
    }
    
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-md';
    
    const variants = {
      primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 dark:bg-primary-500 dark:hover:bg-primary-600',
      secondary: 'bg-slate-600 text-white hover:bg-slate-700 focus:ring-slate-500 dark:bg-slate-500 dark:hover:bg-slate-600',
      outline: 'border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 focus:ring-primary-500',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 dark:bg-red-500 dark:hover:bg-red-600',
      ghost: 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 focus:ring-slate-500',
      success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 dark:bg-green-500 dark:hover:bg-green-600',
      warning: 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500 dark:bg-yellow-500 dark:hover:bg-yellow-600',
      info: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600',
    };

    // Size-based padding - use single base size from appearance settings
    // The base size scales automatically for different button sizes
    const defaultBasePaddingSize = 'medium';
    const basePaddingSize = (settings?.icon_button_padding_size || defaultBasePaddingSize) as 'extra-small' | 'small' | 'medium' | 'large' | 'extra-large';
    
    const sizePadding = {
      xs: getPaddingClass(basePaddingSize, 'xs'),
      sm: getPaddingClass(basePaddingSize, 'sm'),
      md: getPaddingClass(basePaddingSize, 'md'),
      lg: getPaddingClass(basePaddingSize, 'lg'),
    };

    // Size-based icon sizing - use single base size from appearance settings
    // The base size scales automatically for different button sizes
    const defaultBaseIconSize = 'medium';
    const baseIconSize = (settings?.icon_button_icon_size || defaultBaseIconSize) as 'extra-small' | 'small' | 'medium' | 'large' | 'extra-large';
    
    const sizeIconSize = {
      xs: getIconSizeClass(baseIconSize, 'xs'),
      sm: getIconSizeClass(baseIconSize, 'sm'),
      md: getIconSizeClass(baseIconSize, 'md'),
      lg: getIconSizeClass(baseIconSize, 'lg'),
    };

    const iconSizeClass = iconSize 
      ? typeof iconSize === 'number' 
        ? `h-[${iconSize}px] w-[${iconSize}px]` 
        : iconSize
      : sizeIconSize[finalSize];

    const paddingClass = padding || sizePadding[finalSize];

    return (
      <button
        ref={ref}
        className={clsx(
          baseStyles,
          variants[finalVariant],
          paddingClass,
          className
        )}
        disabled={disabled || isLoading}
        title={title}
        aria-label={title}
        {...props}
      >
        {isLoading ? (
          <svg 
            className={clsx('animate-spin', iconSizeClass)} 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <Icon className={iconSizeClass} />
        )}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';

