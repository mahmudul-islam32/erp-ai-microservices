import React from 'react';
import { Pagination } from './Pagination';
import { clsx } from 'clsx';

export interface DataTableContainerProps {
  /**
   * Table content (the actual table component)
   */
  children: React.ReactNode;
  
  /**
   * Current page number
   */
  currentPage: number;
  
  /**
   * Total number of pages
   */
  totalPages: number;
  
  /**
   * Total number of items
   */
  totalItems: number;
  
  /**
   * Items per page
   */
  itemsPerPage: number;
  
  /**
   * Callback when page changes
   */
  onPageChange: (page: number) => void;
  
  /**
   * Optional callback when items per page changes
   */
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  
  /**
   * Whether to show pagination
   */
  showPagination?: boolean;
  
  /**
   * Whether data is loading
   */
  isLoading?: boolean;
  
  /**
   * Custom className for the container
   */
  className?: string;
}

/**
 * DataTableContainer - A reusable container that wraps a table with pagination
 * 
 * @example
 * ```tsx
 * <DataTableContainer
 *   currentPage={1}
 *   totalPages={10}
 *   totalItems={100}
 *   itemsPerPage={10}
 *   onPageChange={setCurrentPage}
 *   onItemsPerPageChange={setItemsPerPage}
 * >
 *   <UserTable users={users} />
 * </DataTableContainer>
 * ```
 */
export const DataTableContainer: React.FC<DataTableContainerProps> = ({
  children,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  showPagination = true,
  isLoading = false,
  className,
}) => {
  return (
    <div 
      className={clsx('bg-white', className)}
      style={{
        boxShadow: 'var(--box-shadow-light)',
        padding: 'var(--card-padding)',
        borderRadius: 'var(--card-radius)',
      }}
    >
      <div className="overflow-x-auto">
        {children}
      </div>
      {showPagination && !isLoading && totalItems > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={onPageChange}
          onItemsPerPageChange={onItemsPerPageChange}
        />
      )}
    </div>
  );
};

