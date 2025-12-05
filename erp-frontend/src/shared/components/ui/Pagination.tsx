import React from 'react';
import { useAppearance } from '../../contexts/AppearanceContext';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}) => {
  const { settings } = useAppearance();
  
  // Get pagination settings with defaults
  const design = settings?.pagination_design || 'modern';
  const activeColor = settings?.pagination_active_color || settings?.primary_color || '#3b82f6';
  const hoverColor = settings?.pagination_hover_color || undefined;
  const textColor = settings?.pagination_text_color || undefined;
  const borderColor = settings?.pagination_border_color || undefined;
  const itemsPerPageOptions = settings?.pagination_items_per_page_options 
    ? settings.pagination_items_per_page_options.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n))
    : [10, 25, 50, 100];

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 7;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is less than max
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  // Helper to generate style objects with custom colors
  const getActiveStyle = () => {
    if (design === 'modern' && activeColor) {
      return {
        backgroundColor: `${activeColor}15`,
        borderColor: activeColor,
        color: activeColor,
      };
    }
    return {};
  };

  const getHoverStyle = () => {
    if (hoverColor) {
      return {
        '--hover-bg': hoverColor + '20',
        '--hover-border': hoverColor,
        '--hover-text': hoverColor,
      } as React.CSSProperties;
    }
    return {};
  };

  const getTextStyle = () => {
    if (textColor) {
      return { color: textColor };
    }
    return {};
  };

  const getBorderStyle = () => {
    if (borderColor) {
      return { borderColor: borderColor };
    }
    return {};
  };

  if (design === 'classic') {
    return (
      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div className="flex-1 flex justify-between sm:hidden">
          {/* Mobile pagination */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ ...getTextStyle(), ...getBorderStyle() }}
          >
            Previous
          </button>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ ...getTextStyle(), ...getBorderStyle() }}
          >
            Next
          </button>
        </div>

        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-700" style={getTextStyle()}>
              Showing <span className="font-medium">{startItem}</span> to{' '}
              <span className="font-medium">{endItem}</span> of{' '}
              <span className="font-medium">{totalItems}</span> results
            </p>

            {onItemsPerPageChange && (
              <div className="flex items-center gap-2">
                <label htmlFor="itemsPerPage" className="text-sm text-gray-700" style={getTextStyle()}>
                  Show:
                </label>
                <select
                  id="itemsPerPage"
                  value={itemsPerPage}
                  onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                  className="block rounded-md border-gray-300 py-1 pl-3 pr-8 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  style={{ ...getBorderStyle(), ...getTextStyle() }}
                >
                  {itemsPerPageOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              {/* Previous Button */}
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ ...getTextStyle(), ...getBorderStyle() }}
              >
                <span className="sr-only">Previous</span>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Page Numbers */}
              {getPageNumbers().map((page, index) => {
                if (page === '...') {
                  return (
                    <span
                      key={`ellipsis-${index}`}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                      style={{ ...getTextStyle(), ...getBorderStyle() }}
                    >
                      ...
                    </span>
                  );
                }

                const pageNumber = page as number;
                const isActive = pageNumber === currentPage;

                return (
                  <button
                    key={pageNumber}
                    onClick={() => onPageChange(pageNumber)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      isActive
                        ? 'z-10'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                    style={
                      isActive
                        ? {
                            backgroundColor: activeColor,
                            borderColor: activeColor,
                            color: '#ffffff',
                          }
                        : { ...getTextStyle(), ...getBorderStyle() }
                    }
                    onMouseEnter={(e) => {
                      if (!isActive && hoverColor) {
                        e.currentTarget.style.backgroundColor = hoverColor + '20';
                        e.currentTarget.style.borderColor = hoverColor;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = '';
                        e.currentTarget.style.borderColor = '';
                      }
                    }}
                  >
                    {pageNumber}
                  </button>
                );
              })}

              {/* Next Button */}
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ ...getTextStyle(), ...getBorderStyle() }}
              >
                <span className="sr-only">Next</span>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  }

  // Modern design (default)
  return (
    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
      <div className="flex-1 flex justify-between sm:hidden">
        {/* Mobile pagination */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          style={{ ...getTextStyle(), ...getBorderStyle() }}
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          style={{ ...getTextStyle(), ...getBorderStyle() }}
        >
          Next
        </button>
      </div>

      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-700" style={getTextStyle()}>
            Showing <span className="font-medium">{startItem}</span> to{' '}
            <span className="font-medium">{endItem}</span> of{' '}
            <span className="font-medium">{totalItems}</span> results
          </p>

          {onItemsPerPageChange && (
            <div className="flex items-center gap-2">
              <label htmlFor="itemsPerPage" className="text-sm text-gray-700" style={getTextStyle()}>
                Show:
              </label>
              <select
                id="itemsPerPage"
                value={itemsPerPage}
                onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                className="block rounded-lg border-gray-300 py-1 pl-3 pr-8 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
                style={{ ...getBorderStyle(), ...getTextStyle() }}
              >
                {itemsPerPageOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div>
          <nav className="relative z-0 inline-flex rounded-lg gap-1" aria-label="Pagination">
            {/* Previous Button */}
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{ ...getTextStyle(), ...getBorderStyle() }}
            >
              <span className="sr-only">Previous</span>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Page Numbers */}
            {getPageNumbers().map((page, index) => {
              if (page === '...') {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700"
                    style={getTextStyle()}
                  >
                    ...
                  </span>
                );
              }

              const pageNumber = page as number;
              const isActive = pageNumber === currentPage;

              return (
                <button
                  key={pageNumber}
                  onClick={() => onPageChange(pageNumber)}
                  className={`relative inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'z-10 shadow-sm'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                  style={
                    isActive
                      ? getActiveStyle()
                      : { ...getTextStyle(), ...getBorderStyle() }
                  }
                  onMouseEnter={(e) => {
                    if (!isActive && hoverColor) {
                      e.currentTarget.style.backgroundColor = hoverColor + '20';
                      e.currentTarget.style.borderColor = hoverColor;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      if (hoverColor) {
                        e.currentTarget.style.backgroundColor = '';
                        e.currentTarget.style.borderColor = '';
                      }
                    }
                  }}
                >
                  {pageNumber}
                </button>
              );
            })}

            {/* Next Button */}
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{ ...getTextStyle(), ...getBorderStyle() }}
            >
              <span className="sr-only">Next</span>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};