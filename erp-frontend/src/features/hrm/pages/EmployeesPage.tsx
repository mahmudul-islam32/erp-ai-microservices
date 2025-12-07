import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AppDispatch, RootState } from '../../../app/store';
import {
  fetchEmployees,
  deleteEmployee,
} from '../store/hrmSlice';
import { EmployeeTable } from '../components/EmployeeTable';
import { EmployeeFilters, IEmployeeFilters } from '../components/EmployeeFilters';
import {
  PageHeader,
  StatCard,
  BulkActionsBar,
  DataTableContainer,
  DeleteConfirmationModal,
} from '../../../shared/components/ui';
import { Employee } from '../types';
import { employeeApi } from '../services/hrmApi';
import { toast } from 'sonner';
import { Users, CheckCircle, Clock, XCircle, Download, Plus } from 'lucide-react';
import { usePermissions } from '../../../shared/hooks/usePermissions';
import { Permission } from '../../users/types';
import { usePaginationSettings } from '../../../shared/hooks/usePaginationSettings';

export const EmployeesPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { employees, loading } = useSelector((state: RootState) => state.hrm.employees);
  const { hasPermission } = usePermissions();
  const { defaultItemsPerPage } = usePaginationSettings();

  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>(employees);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage);
  const [filters, setFilters] = useState<IEmployeeFilters>({
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
    dispatch(fetchEmployees(filters));
  }, [dispatch, filters]);

  useEffect(() => {
    // Client-side filtering for search
    let filtered = employees;

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (employee) =>
          employee.email.toLowerCase().includes(searchLower) ||
          employee.first_name.toLowerCase().includes(searchLower) ||
          employee.last_name.toLowerCase().includes(searchLower) ||
          employee.employee_id.toLowerCase().includes(searchLower)
      );
    }

    if (filters.department) {
      filtered = filtered.filter(
        (employee) =>
          employee.department?.toLowerCase().includes(filters.department?.toLowerCase() || '')
      );
    }

    if (filters.status) {
      filtered = filtered.filter((employee) => employee.status === filters.status);
    }

    if (filters.employment_type) {
      filtered = filtered.filter((employee) => employee.employment_type === filters.employment_type);
    }

    setFilteredEmployees(filtered);
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [employees, filters.search, filters.department, filters.status, filters.employment_type]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedEmployees([]); // Clear selections when changing pages
  };

  const handleItemsPerPageChange = (perPage: number) => {
    setItemsPerPage(perPage);
    setCurrentPage(1); // Reset to first page
    setSelectedEmployees([]); // Clear selections
  };

  const handleEdit = (employee: Employee) => {
    navigate(`/dashboard/hrm/employees/${employee.id || employee.employee_id}/edit`);
  };

  const handleView = (employee: Employee) => {
    navigate(`/dashboard/hrm/employees/${employee.id}`);
  };

  const handleDelete = (employee: Employee) => {
    setEmployeeToDelete(employee);
  };

  const confirmDelete = async () => {
    if (employeeToDelete) {
      // Backend uses employee_id for deletion
      const employeeId = employeeToDelete.id || employeeToDelete.employee_id;
      await dispatch(deleteEmployee(employeeId));
      setEmployeeToDelete(null);
      toast.success('Employee deleted successfully');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedEmployees.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedEmployees.length} employee(s)?`)) {
      for (const employeeId of selectedEmployees) {
        await dispatch(deleteEmployee(employeeId));
      }
      setSelectedEmployees([]);
      toast.success(`${selectedEmployees.length} employee(s) deleted successfully`);
    }
  };

  const handleExport = () => {
    const csv = employeeApi.exportToCSV ? employeeApi.exportToCSV(filteredEmployees) : exportToCSV(filteredEmployees);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employees_${new Date().toISOString()}.csv`;
    a.click();
    toast.success('Employees exported successfully');
  };

  const exportToCSV = (employees: Employee[]): string => {
    const headers = ['Employee ID', 'First Name', 'Last Name', 'Email', 'Department', 'Position', 'Status', 'Employment Type', 'Start Date'];
    const rows = employees.map(emp => [
      emp.employee_id,
      emp.first_name,
      emp.last_name,
      emp.email,
      emp.department,
      emp.position,
      emp.status,
      emp.employment_type,
      emp.start_date
    ]);
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  // Calculate statistics
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((e) => e.status === 'active').length;
  const inactiveEmployees = employees.filter((e) => e.status === 'inactive').length;
  const terminatedEmployees = employees.filter((e) => e.status === 'terminated').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Employees Management"
        description="Manage employee records and information"
        actions={[
          {
            label: 'Export',
            onClick: handleExport,
            variant: 'outline',
            icon: Download,
          },
          ...(canCreate ? [{
            label: 'Add Employee',
            onClick: () => navigate('/dashboard/hrm/employees/create'),
            variant: 'primary' as const,
            icon: Plus,
          }] : []),
        ]}
      />

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          label="Total Employees"
          value={totalEmployees}
          icon={Users}
          iconVariant="primary"
        />
        <StatCard
          label="Active"
          value={activeEmployees}
          icon={CheckCircle}
          iconVariant="success"
        />
        <StatCard
          label="Inactive"
          value={inactiveEmployees}
          icon={Clock}
          iconVariant="warning"
        />
        <StatCard
          label="Terminated"
          value={terminatedEmployees}
          icon={XCircle}
          iconVariant="danger"
        />
      </div>

      {/* Filters */}
      <EmployeeFilters
        filters={filters}
        onFiltersChange={(newFilters) => setFilters(newFilters)}
      />

      {/* Bulk Actions */}
      <BulkActionsBar
        selectedCount={selectedEmployees.length}
        actions={[
          ...(canDelete ? [{
            label: 'Delete',
            onClick: handleBulkDelete,
            variant: 'danger' as const,
          }] : []),
        ]}
        onClear={() => setSelectedEmployees([])}
      />

      {/* Employees Table */}
      <DataTableContainer
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredEmployees.length}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
        isLoading={loading}
      >
        <EmployeeTable
          employees={paginatedEmployees}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          selectedEmployees={selectedEmployees}
          onSelectionChange={setSelectedEmployees}
          isLoading={loading}
        />
      </DataTableContainer>

      {/* Delete Modal */}
      <DeleteConfirmationModal
        isOpen={!!employeeToDelete}
        onClose={() => setEmployeeToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Employee"
        message="Are you sure you want to delete"
        itemName={employeeToDelete ? (employeeToDelete.full_name || `${employeeToDelete.first_name} ${employeeToDelete.last_name}`) : undefined}
        loading={loading}
      />
    </div>
  );
};

export default EmployeesPage;
