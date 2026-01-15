import React from 'react';
import { FilterPanel } from '@/shared/components/ui/FilterPanel';
import { Input, Select } from '@/shared/components/ui';

export interface IAttendanceFilters {
  skip?: number;
  limit?: number;
  search?: string;
  employee_id?: string;
  date_from?: string;
  date_to?: string;
  status?: string;
}

interface AttendanceFiltersProps {
  filters: IAttendanceFilters;
  onFiltersChange: (filters: IAttendanceFilters) => void;
}

export const AttendanceFilters: React.FC<AttendanceFiltersProps> = ({ filters, onFiltersChange }) => {
  const handleChange = (key: keyof IAttendanceFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleClear = () => {
    onFiltersChange({
      skip: 0,
      limit: 50,
    });
  };

  const hasActiveFilters = filters.search || filters.employee_id || filters.date_from || filters.date_to || filters.status;

  const statusOptions = [
    { label: 'All Statuses', value: '' },
    { label: 'Present', value: 'present' },
    { label: 'Absent', value: 'absent' },
    { label: 'Late', value: 'late' },
    { label: 'Early Leave', value: 'early_leave' },
    { label: 'Half Day', value: 'half_day' },
    { label: 'Overtime', value: 'overtime' },
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

        <Input
          id="date_from"
          label="Date From"
          type="date"
          value={filters.date_from || ''}
          onValueChange={(value) => handleChange('date_from', value || undefined)}
        />

        <Input
          id="date_to"
          label="Date To"
          type="date"
          value={filters.date_to || ''}
          onValueChange={(value) => handleChange('date_to', value || undefined)}
        />

        <Select
          id="status"
          label="Status"
          value={filters.status || ''}
          options={statusOptions}
          onValueChange={(value) => handleChange('status', value || undefined)}
          fullWidth
        />
      </div>
    </FilterPanel>
  );
};



