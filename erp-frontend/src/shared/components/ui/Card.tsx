import React from 'react';
import { clsx } from 'clsx';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  padding = 'md',
  shadow = 'sm',
  className,
  ...props
}) => {
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const shadows = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
  };

  const paddingMap = {
    none: '0',
    sm: 'var(--spacing-inset-small)',
    md: 'var(--spacing-inset-medium)',
    lg: 'var(--card-padding)',
  };

  const shadowMap = {
    none: 'none',
    sm: 'var(--box-shadow-light)',
    md: 'var(--box-shadow)',
    lg: 'var(--box-shadow-hover)',
  };

  return (
    <div
      className={clsx('rounded-lg border', className)}
      style={{
        backgroundColor: 'var(--card-background)',
        borderRadius: 'var(--card-radius)',
        padding: paddingMap[padding],
        boxShadow: shadowMap[shadow],
        border: 'var(--border-default)',
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
  actions?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
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
      <div className="flex-1">
        {title && (
          <h3
            className="font-semibold"
            style={{
              fontSize: 'var(--font-size-lg)',
              color: 'var(--text-primary)',
              margin: 0,
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
              marginBottom: 0,
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
    between: 'justify-between',
  };

  return (
    <div
      className={clsx('flex items-center', alignments[align], className)}
      style={{
        marginTop: 'var(--spacing-stack-medium)',
        paddingTop: 'var(--spacing-stack-medium)',
        borderTop: 'var(--border-default)',
      }}
      {...props}
    >
      {children}
    </div>
  );
};

