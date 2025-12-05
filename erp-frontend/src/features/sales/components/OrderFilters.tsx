import React from 'react';
import { FilterPanel } from '../../../shared/components/ui/FilterPanel';

export interface OrderFilters {
  search?: string;
  status?: string;
  paymentStatus?: string;
}

interface OrderFiltersProps {
  filters: OrderFilters;
  onFiltersChange: (filters: OrderFilters) => void;
}

export const OrderFilters: React.FC<OrderFiltersProps> = ({ filters, onFiltersChange }) => {
  const handleChange = (key: keyof OrderFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleClear = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = filters.search || filters.status || filters.paymentStatus;

  return (
    <FilterPanel
      title="Filters"
      hasActiveFilters={hasActiveFilters}
      onClear={handleClear}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Search */}
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1.5">
            Search
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              id="search"
              value={filters.search || ''}
              onChange={(e) => handleChange('search', e.target.value || undefined)}
              placeholder="Search by order number or customer..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-150 ease-in-out"
            />
          </div>
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1.5">
            Order Status
          </label>
          <div className="relative">
            <select
              id="status"
              value={filters.status || ''}
              onChange={(e) => handleChange('status', e.target.value || undefined)}
              className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-150 ease-in-out appearance-none"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="draft">Draft</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Payment Status */}
        <div>
          <label htmlFor="paymentStatus" className="block text-sm font-medium text-gray-700 mb-1.5">
            Payment Status
          </label>
          <div className="relative">
            <select
              id="paymentStatus"
              value={filters.paymentStatus || ''}
              onChange={(e) => handleChange('paymentStatus', e.target.value || undefined)}
              className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-150 ease-in-out appearance-none"
            >
              <option value="">All Payment Statuses</option>
              <option value="paid">Paid</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </FilterPanel>
  );
};

