import React from 'react';
import { AuditFilters as IAuditFilters } from '../types';
import { FilterPanel } from '../../../shared/components/ui/FilterPanel';
import { FilterSearchInput, FilterSelect } from '../../../shared/components/ui/FilterField';

interface AuditFiltersProps {
  filters: IAuditFilters;
  onFiltersChange: (filters: IAuditFilters) => void;
}

export const AuditFilters: React.FC<AuditFiltersProps> = ({ filters, onFiltersChange }) => {
  const handleChange = (key: keyof IAuditFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value || undefined });
  };

  const handleClear = () => {
    onFiltersChange({
      ...filters,
      action: undefined,
      resource: undefined,
      status: undefined,
      user_id: undefined,
      start_date: undefined,
      end_date: undefined,
      skip: 0,
    });
  };

  const hasActiveFilters = 
    filters.action || 
    filters.resource || 
    filters.status || 
    filters.user_id ||
    filters.start_date ||
    filters.end_date;

  const actionOptions = [
    { value: 'login', label: 'Login' },
    { value: 'logout', label: 'Logout' },
    { value: 'create', label: 'Create' },
    { value: 'update', label: 'Update' },
    { value: 'delete', label: 'Delete' },
    { value: 'view', label: 'View' },
    { value: 'export', label: 'Export' },
  ];

  const resourceOptions = [
    { value: 'user', label: 'User' },
    { value: 'product', label: 'Product' },
    { value: 'order', label: 'Order' },
    { value: 'customer', label: 'Customer' },
    { value: 'inventory', label: 'Inventory' },
    { value: 'auth', label: 'Authentication' },
  ];

  const statusOptions = [
    { value: 'success', label: 'Success' },
    { value: 'failure', label: 'Failure' },
  ];

  return (
    <FilterPanel
      title="Filters"
      hasActiveFilters={hasActiveFilters}
      onClear={handleClear}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Action */}
        <FilterSelect
          label="Action"
          id="action"
          placeholder="All Actions"
          options={actionOptions}
          value={filters.action || ''}
          onChange={(e) => handleChange('action', e.target.value)}
        />

        {/* Resource */}
        <FilterSelect
          label="Resource"
          id="resource"
          placeholder="All Resources"
          options={resourceOptions}
          value={filters.resource || ''}
          onChange={(e) => handleChange('resource', e.target.value)}
        />

        {/* Status */}
        <FilterSelect
          label="Status"
          id="status"
          placeholder="All Status"
          options={statusOptions}
          value={filters.status || ''}
          onChange={(e) => handleChange('status', e.target.value)}
        />

        {/* Date Range - Start Date */}
        <div>
          <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1.5">
            Start Date
          </label>
          <input
            type="date"
            id="start_date"
            value={filters.start_date ? filters.start_date.split('T')[0] : ''}
            onChange={(e) => handleChange('start_date', e.target.value ? `${e.target.value}T00:00:00` : undefined)}
            className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-150 ease-in-out"
          />
        </div>

        {/* Date Range - End Date */}
        <div>
          <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1.5">
            End Date
          </label>
          <input
            type="date"
            id="end_date"
            value={filters.end_date ? filters.end_date.split('T')[0] : ''}
            onChange={(e) => handleChange('end_date', e.target.value ? `${e.target.value}T23:59:59` : undefined)}
            className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-150 ease-in-out"
          />
        </div>
      </div>
    </FilterPanel>
  );
};

