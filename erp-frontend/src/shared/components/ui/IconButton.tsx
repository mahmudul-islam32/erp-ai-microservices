import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button, ButtonProps } from './Button';

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
    const variantMap: Record<NonNullable<IconButtonProps['variant']>, ButtonProps['variant']> = {
      primary: 'primary',
      secondary: 'secondary',
      outline: 'tertiary',
      danger: 'danger',
      ghost: 'tertiary',
      success: 'primary',
      warning: 'secondary',
      info: 'secondary',
    };

    const sizeMap: Record<NonNullable<IconButtonProps['size']>, ButtonProps['size']> = {
      xs: 'small',
      sm: 'small',
      md: 'medium',
      lg: 'large',
    };

    const iconDimension = iconSize
      ? typeof iconSize === 'number'
        ? `${iconSize}px`
        : iconSize
      : 'var(--icon-size-md)';

    const finalVariant = variantMap[variant || 'primary'];
    const finalSize = sizeMap[size || 'md'];

    return (
      <Button
        ref={ref as any}
        shape="icon"
        variant={finalVariant}
        size={finalSize}
        className={className}
        disabled={disabled || isLoading}
        aria-label={title}
        title={title}
        {...props}
      >
        {isLoading ? (
          <svg
            style={{ height: iconDimension, width: iconDimension }}
            className="animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <Icon style={{ height: iconDimension, width: iconDimension }} />
        )}
      </Button>
    );
  }
);

IconButton.displayName = 'IconButton';

