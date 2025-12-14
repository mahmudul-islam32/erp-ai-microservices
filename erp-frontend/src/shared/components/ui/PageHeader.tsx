import React from 'react';
import { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from './Button';

export interface PageAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
}

export interface PageHeaderProps {
  /**
   * Page title
   */
  title: string;
  
  /**
   * Optional description/subtitle
   */
  description?: string;
  
  /**
   * Array of action buttons
   */
  actions?: PageAction[];
  
  /**
   * Custom className
   */
  className?: string;
}

/**
 * PageHeader - A reusable page header component with title, description, and actions
 * 
 * @example
 * ```tsx
 * <PageHeader
 *   title="Users Management"
 *   description="Manage user accounts, roles, and permissions"
 *   actions={[
 *     { label: 'Export', onClick: handleExport, variant: 'outline', icon: Download },
 *     { label: 'Add User', onClick: handleAdd, variant: 'primary', icon: Plus },
 *   ]}
 * />
 * ```
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actions = [],
  className,
}) => {
  const getButtonVariant = (variant?: 'primary' | 'secondary' | 'outline'): 'primary' | 'secondary' | 'tertiary' => {
    if (variant === 'primary') return 'primary';
    if (variant === 'secondary') return 'secondary';
    return 'tertiary'; // outline maps to tertiary
  };

  return (
    <div className={clsx('flex items-start justify-between gap-6', className)}>
      <div className="flex-1">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 mb-2">
          {title}
        </h1>
        {description && (
          <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions.length > 0 && (
        <div className="flex gap-3 flex-shrink-0">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={index}
                onClick={action.onClick}
                variant={getButtonVariant(action.variant)}
                leftIcon={Icon ? <Icon className="h-5 w-5" /> : undefined}
              >
                {action.label}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
};

