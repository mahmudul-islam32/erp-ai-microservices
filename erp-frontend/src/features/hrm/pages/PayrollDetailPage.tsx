import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { AppDispatch, RootState } from '../../../app/store';
import { fetchPayroll, approvePayroll } from '../store/hrmSlice';
import { usePermissions } from '../../../shared/hooks/usePermissions';
import { Permission } from '../../users/types';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { PenSquare, CheckCircle2 } from 'lucide-react';

export const PayrollDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { currentPayroll, loading } = useSelector((state: RootState) => state.hrm.payroll);
  const { hasPermission } = usePermissions();
  
  const canEdit = hasPermission(Permission.HR_UPDATE);
  const canApprove = hasPermission(Permission.HR_UPDATE);

  useEffect(() => {
    if (id) {
      dispatch(fetchPayroll(id));
    }
  }, [dispatch, id]);

  const handleApprove = async () => {
    if (!id) return;
    
    try {
      const result = await dispatch(approvePayroll(id));
      if (approvePayroll.fulfilled.match(result)) {
        toast.success('Payroll approved successfully');
      } else if (approvePayroll.rejected.match(result)) {
        toast.error('Failed to approve payroll');
      }
    } catch (error) {
      console.error('Error approving payroll:', error);
      toast.error('Failed to approve payroll');
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

  if (loading && !currentPayroll) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!currentPayroll) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Payroll not found</p>
        <button
          onClick={() => navigate('/dashboard/hrm/payroll')}
          className="mt-4 text-primary-600 hover:text-primary-900"
        >
          Back to Payroll
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <div>
        <button
          onClick={() => navigate('/dashboard/hrm/payroll')}
          className="flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <svg
            className="h-5 w-5 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Payroll
        </button>
      </div>

      {/* Header */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Payroll Details
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {currentPayroll.employee_name} - {format(new Date(currentPayroll.pay_period_start), 'MMM dd')} to {format(new Date(currentPayroll.pay_period_end), 'MMM dd, yyyy')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {currentPayroll.status === 'draft' || currentPayroll.status === 'pending' ? (
                canApprove && (
                  <button
                    onClick={handleApprove}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Approve Payroll
                  </button>
                )
              ) : null}
              {canEdit && (
                <button
                  onClick={() => navigate(`/dashboard/hrm/payroll/${id}/edit`)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <PenSquare className="h-4 w-4 mr-2" />
                  Edit Payroll
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Employee Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Employee Information
              </h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Employee Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {currentPayroll.employee_name}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Employee ID</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {currentPayroll.employee_id}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Pay Period</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {format(new Date(currentPayroll.pay_period_start), 'MMM dd, yyyy')} - {format(new Date(currentPayroll.pay_period_end), 'MMM dd, yyyy')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Pay Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {format(new Date(currentPayroll.pay_date), 'MMM dd, yyyy')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(currentPayroll.status)}`}>
                      {currentPayroll.status.charAt(0).toUpperCase() + currentPayroll.status.slice(1)}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>

            {/* Earnings & Deductions Summary */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Earnings & Deductions
              </h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Basic Salary</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatCurrency(currentPayroll.basic_salary)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Overtime Pay</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatCurrency(currentPayroll.overtime_pay || 0)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Bonus</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatCurrency(currentPayroll.bonus || 0)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Commission</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatCurrency(currentPayroll.commission || 0)}
                  </dd>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <dt className="text-sm font-semibold text-gray-900">Gross Earnings</dt>
                  <dd className="mt-1 text-sm font-bold text-gray-900">
                    {formatCurrency(currentPayroll.gross_earnings)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Deductions Details */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Deductions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Income Tax</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatCurrency(currentPayroll.income_tax || 0)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Social Security</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatCurrency(currentPayroll.social_security || 0)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Medicare</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatCurrency(currentPayroll.medicare || 0)}
                  </dd>
                </div>
              </dl>
              <div>
                <div className="pt-2 border-t border-gray-200">
                  <dt className="text-sm font-semibold text-gray-500">Total Deductions</dt>
                  <dd className="mt-1 text-sm font-bold text-red-600">
                    {formatCurrency(currentPayroll.total_deductions || 0)}
                  </dd>
                </div>
                <div className="mt-4 pt-4 border-t-2 border-gray-400">
                  <dt className="text-base font-semibold text-gray-900">Net Pay</dt>
                  <dd className="mt-1 text-2xl font-bold text-primary-600">
                    {formatCurrency(currentPayroll.net_pay)}
                  </dd>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {currentPayroll.notes && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Notes
              </h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {currentPayroll.notes}
              </p>
            </div>
          )}

          {/* Timestamps */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
              <div>
                <span className="font-medium">Created:</span>{' '}
                {format(new Date(currentPayroll.created_at), 'PPpp')}
              </div>
              <div>
                <span className="font-medium">Last Updated:</span>{' '}
                {format(new Date(currentPayroll.updated_at), 'PPpp')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
