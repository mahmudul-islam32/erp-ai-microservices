import React from 'react';
import { clsx } from 'clsx';

export interface BulkAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger' | 'primary';
}

export interface BulkActionsBarProps {
  /**
   * Number of selected items
   */
  selectedCount: number;
  
  /**
   * Array of bulk actions
   */
  actions: BulkAction[];
  
  /**
   * Optional custom message
   */
  message?: string;
  
  /**
   * Optional onClear handler
   */
  onClear?: () => void;
  
  /**
   * Custom className
   */
  className?: string;
}

/**
 * BulkActionsBar - A reusable bulk actions bar component
 * 
 * @example
 * ```tsx
 * <BulkActionsBar
 *   selectedCount={5}
 *   actions={[
 *     { label: 'Activate', onClick: handleActivate, variant: 'primary' },
 *     { label: 'Delete', onClick: handleDelete, variant: 'danger' },
 *   ]}
 *   onClear={() => setSelectedItems([])}
 * />
 * ```
 */
export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedCount,
  actions,
  message,
  onClear,
  className,
}) => {
  if (selectedCount === 0) return null;

  const variantStyles = {
    default: 'text-primary-600 hover:text-primary-900',
    danger: 'text-red-600 hover:text-red-900',
    primary: 'text-primary-600 hover:text-primary-900 font-semibold',
  };

  return (
    <div className={clsx(
      'bg-primary-50 border border-primary-200 rounded-lg p-4',
      className
    )}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-primary-800">
          {message || `${selectedCount} item(s) selected`}
        </p>
        <div className="flex items-center space-x-3">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={clsx(
                'text-sm transition-colors',
                variantStyles[action.variant || 'default']
              )}
            >
              {action.label}
            </button>
          ))}
          {onClear && (
            <button
              onClick={onClear}
              className="text-sm text-primary-600 hover:text-primary-900"
            >
              Clear Selection
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

