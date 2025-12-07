import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AppDispatch, RootState } from '../../../app/store';
import { createPayroll } from '../store/hrmSlice';
import { PayrollForm } from '../components/PayrollForm';
import { toast } from 'sonner';

export const CreatePayrollPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { loading } = useSelector((state: RootState) => state.hrm.payroll);

  const handleSubmit = async (data: any) => {
    try {
      console.log('Submitting payroll data:', data);
      const result = await dispatch(createPayroll(data));
      if (createPayroll.fulfilled.match(result)) {
        toast.success('Payroll created successfully');
        navigate('/dashboard/hrm/payroll');
      } else if (createPayroll.rejected.match(result)) {
        console.error('Payroll creation failed:', result.error);
        toast.error('Failed to create payroll');
      }
    } catch (error) {
      console.error('Error creating payroll:', error);
      toast.error('Failed to create payroll');
    }
  };

  const handleCancel = () => {
    navigate('/dashboard/hrm/payroll');
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Create New Payroll</h1>
          <p className="mt-1 text-sm text-gray-500">
            Fill in the information below to create a new payroll record
          </p>
        </div>

        <PayrollForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
        />
      </div>
    </div>
  );
};

