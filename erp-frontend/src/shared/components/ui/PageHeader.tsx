import React from 'react';
import { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

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
  const variantStyles = {
    primary: 'inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700',
    secondary: 'inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50',
    outline: 'inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50',
  };

  return (
    <div className={clsx('flex items-center justify-between', className)}>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        )}
      </div>
      {actions.length > 0 && (
        <div className="flex space-x-3">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={action.onClick}
                className={variantStyles[action.variant || 'outline']}
              >
                {Icon && <Icon className="h-5 w-5 mr-2" />}
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

