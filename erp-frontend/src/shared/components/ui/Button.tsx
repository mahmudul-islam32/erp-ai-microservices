import React from 'react';
import { useAppearance } from '../../contexts/AppearanceContext';
import { Spinner } from './Spinner';

import '@/styles/design-button.css';

export interface ButtonProps {
  text?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'link';
  shape?: 'default' | 'icon';
  fullwidth?: boolean;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  href?: string;
  rel?: string;
  target?: string;
  external?: boolean;
  children?: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void;
  [key: string]: unknown;
}

export const Button: React.FC<ButtonProps> = ({
  text = '',
  size: sizeProp,
  variant = 'primary',
  shape = 'default',
  fullwidth = false,
  className = '',
  disabled = false,
  type = 'button',
  href = '',
  rel: relProp = '',
  target: targetProp = '',
  external = false,
  children,
  leftIcon,
  rightIcon,
  isLoading = false,
  onClick,
  ...rest
}) => {
  const { settings } = useAppearance();
  
  // Get default size from settings, fallback to 'small' if not set
  const defaultSize = (settings?.button_default_size as 'small' | 'medium' | 'large') || 'small';
  const size = sizeProp || defaultSize;
  // Handle external link defaults
  let rel = relProp;
  let target = targetProp;
  if (external) {
    if (!rel) rel = 'noopener noreferrer';
    if (!target) target = '_blank';
  }

  const isLink = !!href;

  const classes = [
    'design-button',
    `design-button--${size}`,
    `design-button--${variant}`,
    shape === 'icon' && 'design-button--icon',
    fullwidth && 'design-button--fullwidth',
    variant === 'link' && 'design-button--link',
    disabled && 'design-button--disabled',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = children || text;
  
  // Filter out non-DOM props before spreading to DOM element
  // These are React-specific props that shouldn't be passed to DOM elements
  const nonDomProps = [
    'isLoading',
    'text',
    'size',
    'variant',
    'shape',
    'fullwidth',
    'leftIcon',
    'rightIcon',
    'external',
  ];
  
  const domProps = Object.keys(rest).reduce((acc, key) => {
    if (!nonDomProps.includes(key)) {
      acc[key] = rest[key];
    }
    return acc;
  }, {} as Record<string, unknown>);
  
  const buttonContent = (
    <>
      {isLoading ? (
        <Spinner size="sm" className="mr-2" />
      ) : (
        leftIcon && <span className="flex items-center">{leftIcon}</span>
      )}
      {content && <span>{content}</span>}
      {!isLoading && rightIcon && <span className="flex items-center">{rightIcon}</span>}
    </>
  );

  const isDisabled = disabled || isLoading;

  if (isLink) {
    return (
      <a
        className={classes}
        href={href}
        rel={rel}
        target={target}
        aria-disabled={isDisabled}
        onClick={isDisabled ? undefined : onClick}
        {...domProps}
      >
        {buttonContent}
      </a>
    );
  }

  return (
    <button 
      type={type} 
      className={classes} 
      disabled={isDisabled} 
      onClick={isDisabled ? undefined : onClick} 
      {...domProps}
    >
      {buttonContent}
    </button>
  );
};

export default Button;
