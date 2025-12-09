import React, { useState } from 'react';
import { Payroll } from '../types';
import { IconButton } from '../../../shared/components/ui/IconButton';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { usePermissions } from '../../../shared/hooks/usePermissions';
import { Permission } from '../../users/types';
import { format } from 'date-fns';

interface PayrollTableProps {
  payrolls: Payroll[];
  onEdit: (payroll: Payroll) => void;
  onDelete: (payroll: Payroll) => void;
  onView: (payroll: Payroll) => void;
  selectedPayrolls?: string[];
  onSelectionChange?: (payrollIds: string[]) => void;
  isLoading?: boolean;
}

export const PayrollTable: React.FC<PayrollTableProps> = ({
  payrolls,
  onEdit,
  onDelete,
  onView,
  selectedPayrolls = [],
  onSelectionChange,
  isLoading = false,
}) => {
  const { hasPermission } = usePermissions();
  const [sortField, setSortField] = useState<keyof Payroll>('pay_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  const canEdit = hasPermission(Permission.HR_UPDATE);
  const canDelete = hasPermission(Permission.HR_DELETE);

  const handleSort = (field: keyof Payroll) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedPayrolls = [...payrolls].sort((a, b) => {
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
      const allIds = payrolls.map(p => p.id || '');
      onSelectionChange?.(allIds);
    } else {
      onSelectionChange?.([]);
    }
  };

  const handleSelectOne = (payrollId: string) => {
    if (selectedPayrolls.includes(payrollId)) {
      onSelectionChange?.(selectedPayrolls.filter(id => id !== payrollId));
    } else {
      onSelectionChange?.([...selectedPayrolls, payrollId]);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'processed':
        return 'bg-blue-100 text-blue-800';
      case 'approved':
        return 'bg-purple-100 text-purple-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const SortIcon = ({ field }: { field: keyof Payroll }) => {
    if (sortField !== field) {
      return (
        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortDirection === 'asc' ? (
      <svg className="h-4 w-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="h-4 w-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (payrolls.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No payroll records found</p>
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
                  checked={selectedPayrolls.length === payrolls.length && payrolls.length > 0}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
              </th>
            )}
            <th
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('employee_name')}
            >
              <div className="flex items-center space-x-1">
                <span>Employee</span>
                <SortIcon field="employee_name" />
              </div>
            </th>
            <th
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('pay_period_start')}
            >
              <div className="flex items-center space-x-1">
                <span>Pay Period</span>
                <SortIcon field="pay_period_start" />
              </div>
            </th>
            <th
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('gross_earnings')}
            >
              <div className="flex items-center space-x-1">
                <span>Gross Pay</span>
                <SortIcon field="gross_earnings" />
              </div>
            </th>
            <th
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('total_deductions')}
            >
              <div className="flex items-center space-x-1">
                <span>Deductions</span>
                <SortIcon field="total_deductions" />
              </div>
            </th>
            <th
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('net_pay')}
            >
              <div className="flex items-center space-x-1">
                <span>Net Pay</span>
                <SortIcon field="net_pay" />
              </div>
            </th>
            <th
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('status')}
            >
              <div className="flex items-center space-x-1">
                <span>Status</span>
                <SortIcon field="status" />
              </div>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedPayrolls.map((payroll) => {
            const payrollId = payroll.id || '';
            return (
              <tr key={payrollId} className="hover:bg-gray-50">
                {onSelectionChange && (
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedPayrolls.includes(payrollId)}
                      onChange={() => handleSelectOne(payrollId)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {payroll.employee_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {payroll.employee_id}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {format(new Date(payroll.pay_period_start), 'MMM dd, yyyy')} - {format(new Date(payroll.pay_period_end), 'MMM dd, yyyy')}
                  </div>
                  <div className="text-xs text-gray-500">
                    Pay Date: {format(new Date(payroll.pay_date), 'MMM dd, yyyy')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(payroll.gross_earnings)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(payroll.total_deductions)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {formatCurrency(payroll.net_pay)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payroll.status)}`}>
                    {payroll.status.charAt(0).toUpperCase() + payroll.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-2">
                    {/* View Button - uses appearance settings dynamically */}
                    <IconButton
                      icon={Eye}
                      variant="outline"
                      onClick={() => onView(payroll)}
                      title="View Details"
                    />

                    {/* Edit Button - only show if user has permission */}
                    {canEdit && (
                      <IconButton
                        icon={Edit}
                        variant="primary"
                        onClick={() => onEdit(payroll)}
                        title="Edit Payroll"
                      />
                    )}

                    {/* Delete Button - only show if user has permission */}
                    {canDelete && (
                      <IconButton
                        icon={Trash2}
                        variant="danger"
                        onClick={() => onDelete(payroll)}
                        title="Delete Payroll"
                      />
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

