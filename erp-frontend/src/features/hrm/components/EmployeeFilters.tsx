import React from 'react';
import { FilterPanel } from '@/shared/components/ui/FilterPanel';
import { Input, Select } from '@/shared/components/ui';

export interface IEmployeeFilters {
  skip?: number;
  limit?: number;
  search?: string;
  department?: string;
  status?: string;
  employment_type?: string;
}

interface EmployeeFiltersProps {
  filters: IEmployeeFilters;
  onFiltersChange: (filters: IEmployeeFilters) => void;
}

export const EmployeeFilters: React.FC<EmployeeFiltersProps> = ({ filters, onFiltersChange }) => {
  const handleChange = (key: keyof IEmployeeFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleClear = () => {
    onFiltersChange({
      skip: 0,
      limit: 50,
    });
  };

  const hasActiveFilters = filters.search || filters.department || filters.status || filters.employment_type;

  const statusOptions = [
    { label: 'All Statuses', value: '' },
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'Terminated', value: 'terminated' },
    { label: 'On Leave', value: 'on_leave' },
  ];

  const employmentTypeOptions = [
    { label: 'All Types', value: '' },
    { label: 'Full Time', value: 'full_time' },
    { label: 'Part Time', value: 'part_time' },
    { label: 'Contract', value: 'contract' },
    { label: 'Intern', value: 'intern' },
    { label: 'Freelance', value: 'freelance' },
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
          placeholder="Search by name, email, or ID..."
          onValueChange={(value) => handleChange('search', value)}
        />

        <Input
          id="department"
          label="Department"
          type="text"
          value={filters.department || ''}
          placeholder="Filter by department..."
          onValueChange={(value) => handleChange('department', value || undefined)}
        />

        <Select
          id="status"
          label="Status"
          value={filters.status || ''}
          options={statusOptions}
          onValueChange={(value) => handleChange('status', value || undefined)}
          fullWidth
        />

        <Select
          id="employment_type"
          label="Employment Type"
          value={filters.employment_type || ''}
          options={employmentTypeOptions}
          onValueChange={(value) => handleChange('employment_type', value || undefined)}
          fullWidth
        />
      </div>
    </FilterPanel>
  );
};

