import React from 'react';
import { clsx } from 'clsx';
import type { LucideIcon } from 'lucide-react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'dashboard';
}

export const Card: React.FC<CardProps> = ({
  children,
  padding = 'md',
  shadow = 'none',
  variant = 'default',
  className,
  ...props
}) => {
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  const shadows = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg'
  };

  const paddingMap = {
    none: '0',
    sm: 'var(--spacing-inset-small)',
    md: 'var(--spacing-inset-medium)',
    lg: 'var(--card-padding)'
  };

  const shadowMap = {
    none: 'none',
    sm: 'var(--box-shadow-light)',
    md: 'var(--box-shadow)',
    lg: 'var(--box-shadow-hover)'
  };

  const isDashboard = variant === 'dashboard';
  const backgroundColor = isDashboard ? 'var(--background-main)' : 'var(--card-background)';
  const border = isDashboard ? 'none' : 'var(--border-default)';
  const boxShadow = isDashboard ? 'var(--box-shadow-light)' : shadowMap[shadow];

  return (
    <div
      className={clsx('rounded-lg', !isDashboard && 'border', className)}
      style={{
        backgroundColor,
        borderRadius: 'var(--card-radius)',
        padding: paddingMap[padding],
        boxShadow,
        border
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  actions,
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={clsx('flex items-start justify-between', className)}
      style={{ marginBottom: 'var(--spacing-stack-medium)' }}
      {...props}
    >
      {Icon && (
        <Icon
          className="shrink-0"
          style={{ marginRight: 'var(--spacing-inline-small)', color: 'var(--text-secondary)' }}
          size={20}
          aria-hidden="true"
        />
      )}
      <div className="flex-1">
        {title && (
          <h3
            className="font-semibold"
            style={{
              fontSize: 'var(--font-size-lg)',
              color: 'var(--text-primary)',
              margin: 0
            }}
          >
            {title}
          </h3>
        )}
        {subtitle && (
          <p
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--text-secondary)',
              marginTop: 'var(--spacing-stack-xxsmall)',
              marginBottom: 0
            }}
          >
            {subtitle}
          </p>
        )}
        {children}
      </div>
      {actions && <div style={{ marginLeft: 'var(--spacing-inline-medium)' }}>{actions}</div>}
    </div>
  );
};

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardContent: React.FC<CardContentProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div className={clsx(className)} {...props}>
      {children}
    </div>
  );
};

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'left' | 'center' | 'right' | 'between';
}

export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  align = 'right',
  className,
  ...props
}) => {
  const alignments = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between'
  };

  return (
    <div
      className={clsx('flex items-center', alignments[align], className)}
      style={{
        marginTop: 'var(--spacing-stack-medium)',
        paddingTop: 'var(--spacing-stack-medium)',
        borderTop: 'var(--border-default)'
      }}
      {...props}
    >
      {children}
    </div>
  );
};

