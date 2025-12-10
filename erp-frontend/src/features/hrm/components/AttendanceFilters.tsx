import React from 'react';
import { FilterPanel } from '../../../shared/components/ui/FilterPanel';

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

  return (
    <FilterPanel
      title="Filters"
      hasActiveFilters={hasActiveFilters}
      onClear={handleClear}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
              onChange={(e) => handleChange('search', e.target.value)}
              placeholder="Search by employee name..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-150 ease-in-out"
            />
          </div>
        </div>

        {/* Employee ID */}
        <div>
          <label htmlFor="employee_id" className="block text-sm font-medium text-gray-700 mb-1.5">
            Employee ID
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <input
              type="text"
              id="employee_id"
              value={filters.employee_id || ''}
              onChange={(e) => handleChange('employee_id', e.target.value || undefined)}
              placeholder="Filter by employee ID..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-150 ease-in-out"
            />
          </div>
        </div>

        {/* Date From */}
        <div>
          <label htmlFor="date_from" className="block text-sm font-medium text-gray-700 mb-1.5">
            Date From
          </label>
          <input
            type="date"
            id="date_from"
            value={filters.date_from || ''}
            onChange={(e) => handleChange('date_from', e.target.value || undefined)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-150 ease-in-out"
          />
        </div>

        {/* Date To */}
        <div>
          <label htmlFor="date_to" className="block text-sm font-medium text-gray-700 mb-1.5">
            Date To
          </label>
          <input
            type="date"
            id="date_to"
            value={filters.date_to || ''}
            onChange={(e) => handleChange('date_to', e.target.value || undefined)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-150 ease-in-out"
          />
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1.5">
            Status
          </label>
          <div className="relative">
            <select
              id="status"
              value={filters.status || ''}
              onChange={(e) => handleChange('status', e.target.value || undefined)}
              className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-150 ease-in-out appearance-none"
            >
              <option value="">All Statuses</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="early_leave">Early Leave</option>
              <option value="half_day">Half Day</option>
              <option value="overtime">Overtime</option>
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

