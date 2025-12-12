import React from 'react';

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
  onClick?: (event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void;
  [key: string]: unknown;
}

export const Button: React.FC<ButtonProps> = ({
  text = '',
  size = 'medium',
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
  onClick,
  ...rest
}) => {
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

  if (isLink) {
    return (
      <a
        className={classes}
        href={href}
        rel={rel}
        target={target}
        aria-disabled={disabled}
        onClick={onClick}
        {...rest}
      >
        {content}
      </a>
    );
  }

  return (
    <button type={type} className={classes} disabled={disabled} onClick={onClick} {...rest}>
      {content}
    </button>
  );
};

export default Button;
