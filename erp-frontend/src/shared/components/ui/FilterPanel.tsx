import React from 'react';
import { Filter, X } from 'lucide-react';
import { clsx } from 'clsx';

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
    <div className={clsx(
      'bg-white p-6 rounded-lg shadow-sm border border-gray-200',
      className
    )}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {hasActiveFilters && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
              Active
            </span>
          )}
        </div>
        {hasActiveFilters && onClear && (
          <button
            onClick={onClear}
            className="inline-flex items-center text-sm text-primary-600 hover:text-primary-900 font-medium"
          >
            <X className="h-4 w-4 mr-1" />
            Clear All
          </button>
        )}
      </div>
      {children}
    </div>
  );
};

