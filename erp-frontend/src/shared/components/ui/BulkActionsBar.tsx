import React from 'react';
import { clsx } from 'clsx';
import { DesignButton, DesignButtonProps } from './DesignButton';

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

  const variantMap: Record<BulkAction['variant'] | 'default', DesignButtonProps['variant']> = {
    default: 'tertiary',
    primary: 'primary',
    danger: 'danger',
  };

  return (
    <div
      className={clsx(className)}
      style={{
        backgroundColor: 'var(--background-secondary)',
        border: 'var(--border-default)',
        borderRadius: 'var(--card-radius)',
        padding: 'var(--spacing-inset-medium)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--gap-medium)',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 'var(--font-size-sm)',
            color: 'var(--text-primary)',
          }}
        >
          {message || `${selectedCount} item(s) selected`}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-small)' }}>
          {actions.map((action, index) => (
            <DesignButton
              key={index}
              variant={variantMap[action.variant || 'default']}
              size="small"
              onClick={action.onClick}
            >
              {action.label}
            </DesignButton>
          ))}
          {onClear && (
            <DesignButton variant="link" size="small" onClick={onClear}>
              Clear Selection
            </DesignButton>
          )}
        </div>
      </div>
    </div>
  );
};

