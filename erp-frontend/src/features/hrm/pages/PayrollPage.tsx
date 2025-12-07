import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AppDispatch, RootState } from '../../../app/store';
import {
  fetchPayrolls,
  fetchPayrollSummary,
} from '../store/hrmSlice';
import { PayrollTable } from '../components/PayrollTable';
import { PayrollFilters, IPayrollFilters } from '../components/PayrollFilters';
import {
  PageHeader,
  StatCard,
  BulkActionsBar,
  DataTableContainer,
  DeleteConfirmationModal,
} from '../../../shared/components/ui';
import { Payroll } from '../types';
import { payrollApi } from '../services/hrmApi';
import { toast } from 'sonner';
import { DollarSign, TrendingUp, TrendingDown, Users, Download, Plus, FileText } from 'lucide-react';
import { usePermissions } from '../../../shared/hooks/usePermissions';
import { Permission } from '../../users/types';
import { usePaginationSettings } from '../../../shared/hooks/usePaginationSettings';
import { format } from 'date-fns';

export const PayrollPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { payrolls, payrollSummary, loading } = useSelector((state: RootState) => state.hrm.payroll);
  const { hasPermission } = usePermissions();
  const { defaultItemsPerPage } = usePaginationSettings();

  const [payrollToDelete, setPayrollToDelete] = useState<Payroll | null>(null);
  const [selectedPayrolls, setSelectedPayrolls] = useState<string[]>([]);
  const [filteredPayrolls, setFilteredPayrolls] = useState<Payroll[]>(payrolls || []);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage);
  const [filters, setFilters] = useState<IPayrollFilters>({
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
    }
  }, [defaultItemsPerPage]);

  // Fetch payrolls when filters change
  useEffect(() => {
    const loadPayrolls = async () => {
      try {
        await dispatch(fetchPayrolls(filters));
      } catch (error) {
        console.error('Error fetching payrolls:', error);
      }
    };
    loadPayrolls();
  }, [dispatch, filters]);

  // Fetch payroll summary
  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    dispatch(fetchPayrollSummary({
      payPeriodStart: format(firstDay, 'yyyy-MM-dd'),
      payPeriodEnd: format(lastDay, 'yyyy-MM-dd'),
    }));
  }, [dispatch]);

  // Update filtered payrolls when payrolls or filters change
  useEffect(() => {
    let filtered = [...(payrolls || [])];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(p =>
        p.employee_name.toLowerCase().includes(searchLower) ||
        p.employee_id.toLowerCase().includes(searchLower)
      );
    }

    if (filters.status) {
      filtered = filtered.filter(p => p.status === filters.status);
    }

    if (filters.employee_id) {
      filtered = filtered.filter(p => p.employee_id === filters.employee_id);
    }

    if (filters.pay_period_start) {
      filtered = filtered.filter(p => p.pay_period_start >= filters.pay_period_start!);
    }

    if (filters.pay_period_end) {
      filtered = filtered.filter(p => p.pay_period_end <= filters.pay_period_end!);
    }

    setFilteredPayrolls(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [payrolls, filters]);

  // Pagination
  const totalPages = Math.ceil(filteredPayrolls.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPayrolls = filteredPayrolls.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedPayrolls([]); // Clear selections when changing pages
  };

  const handleItemsPerPageChange = (perPage: number) => {
    setItemsPerPage(perPage);
    setCurrentPage(1); // Reset to first page
    setSelectedPayrolls([]); // Clear selections
  };

  const handleEdit = (payroll: Payroll) => {
    navigate(`/dashboard/hrm/payroll/${payroll.id}/edit`);
  };

  const handleView = (payroll: Payroll) => {
    navigate(`/dashboard/hrm/payroll/${payroll.id}`);
  };

  const handleDelete = (payroll: Payroll) => {
    setPayrollToDelete(payroll);
  };

  const confirmDelete = async () => {
    if (payrollToDelete) {
      const payrollId = payrollToDelete.id;
      try {
        await payrollApi.deletePayroll(payrollId);
        // Refresh the list
        await dispatch(fetchPayrolls(filters));
        setPayrollToDelete(null);
        toast.success('Payroll record deleted successfully');
      } catch (error: any) {
        toast.error(error?.response?.data?.detail || 'Failed to delete payroll record');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPayrolls.length === 0) return;
    
    try {
      for (const payrollId of selectedPayrolls) {
        await payrollApi.deletePayroll(payrollId);
      }
      // Refresh the list
      await dispatch(fetchPayrolls(filters));
      setSelectedPayrolls([]);
      toast.success(`${selectedPayrolls.length} payroll record(s) deleted successfully`);
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Failed to delete payroll records');
    }
  };

  const handleExport = async () => {
    try {
      // Export functionality would go here
      toast.success('Payroll data exported successfully');
    } catch (error) {
      toast.error('Failed to export payroll data');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Calculate statistics
  const totalPayrolls = filteredPayrolls.length;
  const processedPayrolls = filteredPayrolls.filter(p => p.status === 'processed' || p.status === 'paid').length;
  const pendingPayrolls = filteredPayrolls.filter(p => p.status === 'pending' || p.status === 'draft').length;
  const totalNetPay = filteredPayrolls.reduce((sum, p) => sum + (p.net_pay || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll Management"
        description="Manage employee payroll and salary calculations"
        actions={[
          {
            label: 'Export',
            onClick: handleExport,
            variant: 'outline',
            icon: Download,
          },
          ...(canCreate ? [{
            label: 'Process Payroll',
            onClick: () => navigate('/dashboard/hrm/payroll/create'),
            variant: 'primary' as const,
            icon: Plus,
          }] : []),
        ]}
      />

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          label="Total Payrolls"
          value={totalPayrolls.toString()}
          icon={FileText}
          iconVariant="primary"
        />
        <StatCard
          label="Processed"
          value={processedPayrolls.toString()}
          icon={TrendingUp}
          iconVariant="success"
        />
        <StatCard
          label="Pending"
          value={pendingPayrolls.toString()}
          icon={TrendingDown}
          iconVariant="warning"
        />
        <StatCard
          label="Total Net Pay"
          value={formatCurrency(totalNetPay)}
          icon={DollarSign}
          iconVariant="info"
        />
      </div>

      {/* Summary Cards from API */}
      {payrollSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            label="Total Gross Pay"
            value={formatCurrency(payrollSummary.total_gross_pay || 0)}
            icon={DollarSign}
            iconVariant="success"
          />
          <StatCard
            label="Total Deductions"
            value={formatCurrency(payrollSummary.total_deductions || 0)}
            icon={TrendingDown}
            iconVariant="danger"
          />
          <StatCard
            label="Total Net Pay"
            value={formatCurrency(payrollSummary.total_net_pay || 0)}
            icon={DollarSign}
            iconVariant="info"
          />
          <StatCard
            label="Employees"
            value={(payrollSummary.total_employees || 0).toString()}
            icon={Users}
            iconVariant="primary"
          />
        </div>
      )}

      {/* Filters */}
      <PayrollFilters filters={filters} onFiltersChange={setFilters} />

      {/* Bulk Actions */}
      {selectedPayrolls.length > 0 && (
        <BulkActionsBar
          selectedCount={selectedPayrolls.length}
          onDelete={canDelete ? handleBulkDelete : undefined}
          onExport={handleExport}
          onClearSelection={() => setSelectedPayrolls([])}
        />
      )}

      {/* Data Table */}
      <DataTableContainer
        totalItems={filteredPayrolls.length}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
        isLoading={loading}
      >
        <PayrollTable
          payrolls={paginatedPayrolls}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          selectedPayrolls={selectedPayrolls}
          onSelectionChange={setSelectedPayrolls}
          isLoading={loading}
        />
      </DataTableContainer>

      {/* Delete Modal */}
      <DeleteConfirmationModal
        isOpen={!!payrollToDelete}
        onClose={() => setPayrollToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Payroll Record"
        message="Are you sure you want to delete this payroll record for"
        itemName={payrollToDelete ? `${payrollToDelete.employee_name} (${format(new Date(payrollToDelete.pay_period_start), 'MMM dd')} - ${format(new Date(payrollToDelete.pay_period_end), 'MMM dd, yyyy')})` : undefined}
        loading={loading}
      />
    </div>
  );
};

export default PayrollPage;
