import React from 'react';
import { FilterPanel } from '@/shared/components/ui/FilterPanel';
import { Input, Select } from '@/shared/components/ui';

export interface IPayrollFilters {
  skip?: number;
  limit?: number;
  search?: string;
  employee_id?: string;
  status?: string;
  pay_period_start?: string;
  pay_period_end?: string;
}

interface PayrollFiltersProps {
  filters: IPayrollFilters;
  onFiltersChange: (filters: IPayrollFilters) => void;
}

export const PayrollFilters: React.FC<PayrollFiltersProps> = ({ filters, onFiltersChange }) => {
  const handleChange = (key: keyof IPayrollFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleClear = () => {
    onFiltersChange({
      skip: 0,
      limit: 50,
    });
  };

  const hasActiveFilters = filters.search || filters.employee_id || filters.status || filters.pay_period_start || filters.pay_period_end;

  const statusOptions = [
    { label: 'All Statuses', value: '' },
    { label: 'Draft', value: 'draft' },
    { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Processed', value: 'processed' },
    { label: 'Paid', value: 'paid' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  return (
    <FilterPanel
      title="Filters"
      hasActiveFilters={hasActiveFilters}
      onClear={handleClear}
    >
      <div className="users-filters-grid">
        <Input
          id="search"
          label="Search"
          type="text"
          value={filters.search || ''}
          placeholder="Search by employee name..."
          onValueChange={(value) => handleChange('search', value)}
        />

        <Input
          id="employee_id"
          label="Employee ID"
          type="text"
          value={filters.employee_id || ''}
          placeholder="Filter by employee ID..."
          onValueChange={(value) => handleChange('employee_id', value || undefined)}
        />

        <Select
          id="status"
          label="Status"
          value={filters.status || ''}
          options={statusOptions}
          onValueChange={(value) => handleChange('status', value || undefined)}
          fullWidth
        />

        <Input
          id="pay_period_start"
          label="Period Start"
          type="date"
          value={filters.pay_period_start || ''}
          onValueChange={(value) => handleChange('pay_period_start', value || undefined)}
        />

        <Input
          id="pay_period_end"
          label="Period End"
          type="date"
          value={filters.pay_period_end || ''}
          onValueChange={(value) => handleChange('pay_period_end', value || undefined)}
        />
      </div>
    </FilterPanel>
  );
};

