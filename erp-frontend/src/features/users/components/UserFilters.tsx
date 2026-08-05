import React from 'react';
import { UserFilters as IUserFilters, UserRole, UserStatus } from '@/features/users/types';
import { FilterPanel } from '@/shared/components/ui/FilterPanel';
import { Input, Select } from '@/shared/components/ui';

interface UserFiltersProps {
  filters: IUserFilters;
  onFiltersChange: (filters: IUserFilters) => void;
}

export const UserFilters: React.FC<UserFiltersProps> = ({ filters, onFiltersChange }) => {
  const handleChange = (key: keyof IUserFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleClear = () => {
    onFiltersChange({
      skip: 0,
      limit: 50,
    });
  };

  const hasActiveFilters = Boolean(filters.search || filters.role || filters.status || filters.department);

  const roleOptions = [
    { label: 'All Roles', value: '' },
    ...Object.values(UserRole).map((role) => ({
      label: role.replace('_', ' ').charAt(0) + role.replace('_', ' ').slice(1).toLowerCase(),
      value: role,
    })),
  ];

  const statusOptions = [
    { label: 'All Statuses', value: '' },
    ...Object.values(UserStatus).map((status) => ({
      label: status.charAt(0) + status.slice(1).toLowerCase(),
      value: status,
    })),
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
          placeholder="Search by email or name..."
          onValueChange={(value) => handleChange('search', value)}
        />

        <Select
          id="role"
          label="Role"
          value={filters.role || ''}
          options={roleOptions}
          onValueChange={(value) => handleChange('role', value || undefined)}
          fullWidth
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
          id="department"
          label="Department"
          type="text"
          value={filters.department || ''}
          placeholder="Filter by department..."
          onValueChange={(value) => handleChange('department', value || undefined)}
        />
      </div>
    </FilterPanel>
  );
};

