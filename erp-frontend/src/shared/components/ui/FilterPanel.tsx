import React from 'react';
import { Filter, X } from 'lucide-react';
import { clsx } from 'clsx';
import { DesignButton } from './DesignButton';

export interface FilterPanelProps {
  /**
   * Title of the filter panel
   */
  title?: string;
  
  /**
   * Filter content (form fields, selects, etc.)
   */
  children: React.ReactNode;
  
  /**
   * Whether there are active filters
   */
  hasActiveFilters?: boolean;
  
  /**
   * Callback to clear all filters
   */
  onClear?: () => void;
  
  /**
   * Custom className
   */
  className?: string;
}

/**
 * FilterPanel - A reusable filter panel component
 * 
 * @example
 * ```tsx
 * <FilterPanel
 *   title="Filters"
 *   hasActiveFilters={hasFilters}
 *   onClear={handleClearFilters}
 * >
 *   <input type="text" placeholder="Search..." />
 *   <select>...</select>
 * </FilterPanel>
 * ```
 */
export const FilterPanel: React.FC<FilterPanelProps> = ({
  title = 'Filters',
  children,
  hasActiveFilters = false,
  onClear,
  className,
}) => {
  return (
    <div
      className={clsx(className)}
      style={{
        backgroundColor: 'var(--card-background)',
        border: 'var(--border-default)',
        borderRadius: 'var(--card-radius)',
        boxShadow: 'var(--card-shadow)',
        padding: 'var(--card-padding)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--spacing-stack-medium)',
          gap: 'var(--gap-small)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-small)' }}>
          <Filter size={20} color="var(--icon-color-primary)" />
          <h3
            style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--text-primary)',
              margin: 0,
            }}
          >
            {title}
          </h3>
          {hasActiveFilters && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: 'var(--spacing-squish-small)',
                borderRadius: 'var(--border-radius-sm)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-medium)',
                backgroundColor: 'var(--background-primary)',
                color: 'var(--text-inverse)',
              }}
            >
              Active
            </span>
          )}
        </div>
        {hasActiveFilters && onClear && (
          <DesignButton
            onClick={onClear}
            variant="link"
            size="small"
            className="filter-panel__clear"
          >
            <X size={14} style={{ marginRight: 'var(--spacing-inline-xxsmall)' }} />
            Clear All
          </DesignButton>
        )}
      </div>
      {children}
    </div>
  );
};

