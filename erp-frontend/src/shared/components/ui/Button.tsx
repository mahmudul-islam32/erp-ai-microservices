import React from 'react';
import { DesignButton } from './DesignButton';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantMap: Record<string, 'primary' | 'secondary' | 'tertiary' | 'danger' | 'link'> = {
  primary: 'primary',
  secondary: 'secondary',
  outline: 'tertiary',
  danger: 'danger',
  ghost: 'tertiary',
};

const sizeMap: Record<string, 'small' | 'medium' | 'large'> = {
  sm: 'small',
  md: 'medium',
  lg: 'large',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const designVariant = variantMap[variant] || 'primary';
    const designSize = sizeMap[size] || 'medium';

    return (
      <DesignButton
        variant={designVariant}
        size={designSize}
        disabled={disabled || isLoading}
        className={className}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin"
            style={{ width: '16px', height: '16px', marginRight: '8px' }}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {!isLoading && leftIcon && <span style={{ marginRight: '8px' }}>{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span style={{ marginLeft: '8px' }}>{rightIcon}</span>}
      </DesignButton>
    );
  }
);

Button.displayName = 'Button';

