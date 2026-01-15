import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AppDispatch, RootState } from '../../../app/store';
import {
  fetchAttendanceRecords,
} from '../store/hrmSlice';
import { AttendanceTable } from '../components/AttendanceTable';
import { AttendanceFilters, IAttendanceFilters } from '../components/AttendanceFilters';
import {
  PageHeader,
  StatCard,
  BulkActionsBar,
  DataTableContainer,
  DeleteConfirmationModal,
} from '../../../shared/components/ui';
import { Attendance } from '../types';
import { attendanceApi } from '../services/hrmApi';
import { toast } from 'sonner';
import { Clock, CheckCircle, XCircle, AlertCircle, Download, Plus } from 'lucide-react';
import { usePermissions } from '../../../shared/hooks/usePermissions';
import { Permission } from '../../users/types';
import { usePaginationSettings } from '../../../shared/hooks/usePaginationSettings';

import '@/styles/users.css';

export const AttendancePage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { attendance, loading } = useSelector((state: RootState) => state.hrm.attendance);
  const { hasPermission } = usePermissions();
  const { defaultItemsPerPage } = usePaginationSettings();

  const [attendanceToDelete, setAttendanceToDelete] = useState<Attendance | null>(null);
  const [selectedAttendance, setSelectedAttendance] = useState<string[]>([]);
  const [filteredAttendance, setFilteredAttendance] = useState<Attendance[]>(attendance);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage);
  const [filters, setFilters] = useState<IAttendanceFilters>({
    skip: 0,
    limit: 50,
  });
  
  const canCreate = hasPermission(Permission.HR_CREATE);
  const canDelete = hasPermission(Permission.HR_DELETE);
  const canUpdate = hasPermission(Permission.HR_UPDATE);

  // Update itemsPerPage when settings change
  useEffect(() => {
    if (defaultItemsPerPage && itemsPerPage !== defaultItemsPerPage) {
      setItemsPerPage(defaultItemsPerPage);
      setCurrentPage(1);
    }
  }, [defaultItemsPerPage]);

  useEffect(() => {
    dispatch(fetchAttendanceRecords({
      skip: filters.skip,
      limit: filters.limit,
      employee_id: filters.employee_id,
      date_from: filters.date_from,
      date_to: filters.date_to,
    }));
  }, [dispatch, filters.skip, filters.limit, filters.employee_id, filters.date_from, filters.date_to]);

  useEffect(() => {
    // Client-side filtering for search and status
    let filtered = attendance;

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (record) =>
          record.employee_name?.toLowerCase().includes(searchLower) ||
          record.employee_id?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.status) {
      filtered = filtered.filter((record) => record.status === filters.status);
    }

    setFilteredAttendance(filtered);
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [attendance, filters.search, filters.status]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredAttendance.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAttendance = filteredAttendance.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedAttendance([]); // Clear selections when changing pages
  };

  const handleItemsPerPageChange = (perPage: number) => {
    setItemsPerPage(perPage);
    setCurrentPage(1); // Reset to first page
    setSelectedAttendance([]); // Clear selections
  };

  const handleEdit = (attendance: Attendance) => {
    navigate(`/dashboard/hrm/attendance/${attendance.id}/edit`);
  };

  const handleView = (attendance: Attendance) => {
    navigate(`/dashboard/hrm/attendance/${attendance.id}`);
  };

  const handleDelete = (attendance: Attendance) => {
    setAttendanceToDelete(attendance);
  };

  const confirmDelete = async () => {
    if (attendanceToDelete) {
      // TODO: Add delete attendance API call
      toast.error('Delete functionality not yet implemented');
      setAttendanceToDelete(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedAttendance.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedAttendance.length} attendance record(s)?`)) {
      // TODO: Add bulk delete API call
      toast.error('Bulk delete functionality not yet implemented');
      setSelectedAttendance([]);
    }
  };

  const handleExport = () => {
    const csv = exportToCSV(filteredAttendance);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${new Date().toISOString()}.csv`;
    a.click();
    toast.success('Attendance records exported successfully');
  };

  const exportToCSV = (records: Attendance[]): string => {
    const headers = ['Employee ID', 'Employee Name', 'Date', 'Clock In', 'Clock Out', 'Total Hours', 'Status'];
    const rows = records.map(record => [
      record.employee_id,
      record.employee_name || '',
      new Date(record.date).toLocaleDateString(),
      record.clock_in_time || '-',
      record.clock_out_time || '-',
      record.total_hours?.toString() || '-',
      record.status
    ]);
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  // Calculate statistics
  const totalRecords = attendance.length;
  const presentRecords = attendance.filter((r) => r.status === 'present').length;
  const absentRecords = attendance.filter((r) => r.status === 'absent').length;
  const lateRecords = attendance.filter((r) => r.status === 'late').length;

  return (
    <div className="users-page">
      {/* Header */}
      <PageHeader
        title="Attendance Management"
        description="Track and manage employee attendance records"
        actions={[
          {
            label: 'Export',
            onClick: handleExport,
            variant: 'outline',
            icon: Download,
          },
          ...(canCreate ? [{
            label: 'Add Attendance',
            onClick: () => navigate('/dashboard/hrm/attendance/create'),
            variant: 'primary' as const,
            icon: Plus,
          }] : []),
        ]}
        className="mb-8"
      />

      {/* Content sections with gap-6 spacing (matching dashboard card gap) */}
      <div className="flex flex-col gap-6">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Records"
            value={totalRecords}
            icon={Clock}
            color="primary"
          />
          <StatCard
            title="Present"
            value={presentRecords}
            icon={CheckCircle}
            color="success"
          />
          <StatCard
            title="Absent"
            value={absentRecords}
            icon={XCircle}
            color="danger"
          />
          <StatCard
            title="Late"
            value={lateRecords}
            icon={AlertCircle}
            color="warning"
          />
        </div>

        {/* Filters */}
        <div>
          <AttendanceFilters
            filters={filters}
            onFiltersChange={(newFilters) => setFilters(newFilters)}
          />
        </div>

        {/* Bulk Actions */}
        {selectedAttendance.length > 0 && (
          <div>
            <BulkActionsBar
              selectedCount={selectedAttendance.length}
              actions={[
                ...(canDelete ? [{
                  label: 'Delete',
                  onClick: handleBulkDelete,
                  variant: 'danger' as const,
                }] : []),
              ]}
              onClear={() => setSelectedAttendance([])}
            />
          </div>
        )}

        {/* Attendance Table */}
        <DataTableContainer
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredAttendance.length}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          isLoading={loading}
        >
          <AttendanceTable
            attendance={paginatedAttendance}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={handleView}
            selectedAttendance={selectedAttendance}
            onSelectionChange={setSelectedAttendance}
            isLoading={loading}
          />
        </DataTableContainer>
      </div>

      {/* Delete Modal */}
      <DeleteConfirmationModal
        isOpen={!!attendanceToDelete}
        onClose={() => setAttendanceToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Attendance Record"
        message="Are you sure you want to delete this attendance record?"
        itemName={attendanceToDelete ? `${attendanceToDelete.employee_name} - ${new Date(attendanceToDelete.date).toLocaleDateString()}` : undefined}
        loading={loading}
      />
    </div>
  );
};

export default AttendancePage;
