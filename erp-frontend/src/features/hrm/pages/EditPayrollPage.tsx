import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { AppDispatch, RootState } from '../../../app/store';
import { fetchPayroll, updatePayroll } from '../store/hrmSlice';
import { PayrollForm } from '../components/PayrollForm';
import { toast } from 'sonner';

export const EditPayrollPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { currentPayroll, loading } = useSelector((state: RootState) => state.hrm.payroll);

  useEffect(() => {
    if (id) {
      dispatch(fetchPayroll(id));
    }
  }, [dispatch, id]);

  const handleSubmit = async (data: any) => {
    if (!id) return;
    
    try {
      const result = await dispatch(updatePayroll({ payrollId: id, payrollData: data }));
      if (updatePayroll.fulfilled.match(result)) {
        toast.success('Payroll updated successfully');
        navigate('/dashboard/hrm/payroll');
      } else if (updatePayroll.rejected.match(result)) {
        toast.error('Failed to update payroll');
      }
    } catch (error) {
      console.error('Error updating payroll:', error);
      toast.error('Failed to update payroll');
    }
  };

  const handleCancel = () => {
    navigate('/dashboard/hrm/payroll');
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
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
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

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Edit Payroll</h1>
          <p className="mt-1 text-sm text-gray-500">
            Update payroll information and calculations
          </p>
        </div>

        <PayrollForm
          initialData={{
            employee_id: currentPayroll.employee_id,
            pay_period_start: currentPayroll.pay_period_start,
            pay_period_end: currentPayroll.pay_period_end,
            basic_salary: currentPayroll.basic_salary,
            overtime_hours: currentPayroll.overtime_hours,
            overtime_rate: currentPayroll.overtime_pay && currentPayroll.overtime_hours > 0 
              ? (currentPayroll.overtime_pay / (currentPayroll.overtime_hours * (currentPayroll.basic_salary / 40)))
              : 1.5,
            bonus: currentPayroll.bonus,
            commission: currentPayroll.commission,
            tax_rate: currentPayroll.gross_earnings > 0 
              ? ((currentPayroll.income_tax || 0) / currentPayroll.gross_earnings) * 100
              : 20,
            social_security_rate: currentPayroll.gross_earnings > 0
              ? ((currentPayroll.social_security || 0) / currentPayroll.gross_earnings) * 100
              : 6.2,
            medicare_rate: currentPayroll.gross_earnings > 0
              ? ((currentPayroll.medicare || 0) / currentPayroll.gross_earnings) * 100
              : 1.45,
            notes: currentPayroll.notes,
          }}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isEdit={true}
          loading={loading}
        />
      </div>
    </div>
  );
};
