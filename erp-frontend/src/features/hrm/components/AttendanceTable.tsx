import React, { useState } from 'react';
import { Attendance } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { IconButton } from '../../../shared/components/ui/IconButton';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { usePermissions } from '../../../shared/hooks/usePermissions';
import { Permission } from '../../users/types';

interface AttendanceTableProps {
  attendance: Attendance[];
  onEdit: (attendance: Attendance) => void;
  onDelete: (attendance: Attendance) => void;
  onView: (attendance: Attendance) => void;
  selectedAttendance?: string[];
  onSelectionChange?: (attendanceIds: string[]) => void;
  isLoading?: boolean;
}

export const AttendanceTable: React.FC<AttendanceTableProps> = ({
  attendance,
  onEdit,
  onDelete,
  onView,
  selectedAttendance = [],
  onSelectionChange,
  isLoading = false,
}) => {
  const { hasPermission } = usePermissions();
  const [sortField, setSortField] = useState<keyof Attendance>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  const canEdit = hasPermission(Permission.HR_UPDATE);
  const canDelete = hasPermission(Permission.HR_DELETE);

  const handleSort = (field: keyof Attendance) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedAttendance = [...attendance].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (aValue === undefined || bValue === undefined) return 0;
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = attendance.map(a => a.id || '');
      onSelectionChange?.(allIds);
    } else {
      onSelectionChange?.([]);
    }
  };

  const handleSelectOne = (attendanceId: string) => {
    if (selectedAttendance.includes(attendanceId)) {
      onSelectionChange?.(selectedAttendance.filter(id => id !== attendanceId));
    } else {
      onSelectionChange?.([...selectedAttendance, attendanceId]);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      case 'early_leave':
        return 'bg-orange-100 text-orange-800';
      case 'half_day':
        return 'bg-blue-100 text-blue-800';
      case 'overtime':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (time: string | undefined) => {
    if (!time) return '-';

    // Backend returns plain HH:MM:SS (sometimes with microseconds), which new Date() cannot parse directly
    const toDate = (value: string) => {
      const sanitized = value.includes('T') ? value : `1970-01-01T${value}`;
      const [base, fractional] = sanitized.split('.');
      const normalized = fractional ? `${base}.${fractional.slice(0, 3)}` : base;
      return new Date(normalized);
    };

    const date = toDate(time);
    if (Number.isNaN(date.getTime())) {
      return time;
    }

    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatHours = (hours: number | undefined) => {
    if (!hours) return '-';
    return `${hours.toFixed(1)}h`;
  };

  if (isLoading) {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {onSelectionChange && (
                <th className="px-6 py-3 text-left">
                  <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Employee
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Clock In
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Clock Out
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hours
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {[...Array(5)].map((_, idx) => (
              <tr key={idx}>
                {onSelectionChange && (
                  <td className="px-6 py-4">
                    <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                  </td>
                )}
                <td className="px-6 py-4">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                </td>
                <td className="px-6 py-4">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                </td>
                <td className="px-6 py-4">
                  <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
                </td>
                <td className="px-6 py-4">
                  <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
                </td>
                <td className="px-6 py-4">
                  <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
                </td>
                <td className="px-6 py-4">
                  <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                    <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                    <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {onSelectionChange && (
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedAttendance.length === attendance.length && attendance.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300"
                />
              </th>
            )}
            <th
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('employee_name')}
            >
              Employee {sortField === 'employee_name' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('date')}
            >
              Date {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Clock In
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Clock Out
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Hours
            </th>
            <th
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('status')}
            >
              Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedAttendance.map((record) => {
            const attendanceId = record.id || '';
            return (
              <tr key={attendanceId} className="hover:bg-gray-50">
                {onSelectionChange && (
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedAttendance.includes(attendanceId)}
                      onChange={() => handleSelectOne(attendanceId)}
                      className="rounded border-gray-300"
                    />
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {record.employee_name?.charAt(0) || 'E'}
                      </span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {record.employee_name || '-'}
                      </div>
                      <div className="text-xs text-gray-500">ID: {record.employee_id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(record.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatTime(record.clock_in_time)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatTime(record.clock_out_time)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatHours(record.total_hours)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(record.status)}`}>
                    {record.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <IconButton
                      icon={Eye}
                      variant="outline"
                      onClick={() => onView(record)}
                      title="View Details"
                    />
                    {canEdit && (
                      <IconButton
                        icon={Edit}
                        variant="primary"
                        onClick={() => onEdit(record)}
                        title="Edit Attendance"
                      />
                    )}
                    {canDelete && (
                      <IconButton
                        icon={Trash2}
                        variant="danger"
                        onClick={() => onDelete(record)}
                        title="Delete Attendance"
                      />
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {attendance.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No attendance records found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your filters or search criteria
          </p>
        </div>
      )}
    </div>
  );
};

