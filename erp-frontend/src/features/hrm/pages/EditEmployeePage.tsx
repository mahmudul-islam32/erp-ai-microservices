import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { AppDispatch, RootState } from '../../../app/store';
import { fetchEmployee, updateEmployee } from '../store/hrmSlice';
import { EmployeeForm } from '../components/EmployeeForm';
import { toast } from 'sonner';

export const EditEmployeePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { currentEmployee, loading } = useSelector((state: RootState) => state.hrm.employees);

  useEffect(() => {
    if (id) {
      dispatch(fetchEmployee(id));
    }
  }, [dispatch, id]);

  const handleSubmit = async (data: any) => {
    if (!id) return;
    
    try {
      const result = await dispatch(updateEmployee({ employeeId: id, employeeData: data }));
      if (updateEmployee.fulfilled.match(result)) {
        toast.success('Employee updated successfully');
        navigate('/dashboard/hrm/employees');
      } else if (updateEmployee.rejected.match(result)) {
        toast.error('Failed to update employee');
      }
    } catch (error) {
      console.error('Error updating employee:', error);
      toast.error('Failed to update employee');
    }
  };

  const handleCancel = () => {
    navigate('/dashboard/hrm/employees');
  };

  if (loading && !currentEmployee) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!currentEmployee) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Employee not found</p>
        <button
          onClick={() => navigate('/dashboard/hrm/employees')}
          className="mt-4 text-primary-600 hover:text-primary-900"
        >
          Back to Employees
        </button>
      </div>
    );
  }

  // Format dates for form inputs (YYYY-MM-DD)
  const formatDateForInput = (dateString: string | undefined) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/dashboard/hrm/employees')}
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
          Back to Employees
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Edit Employee</h1>
          <p className="mt-1 text-sm text-gray-500">
            Update employee information and settings
          </p>
        </div>

        <EmployeeForm
          initialData={{
            first_name: currentEmployee.first_name,
            last_name: currentEmployee.last_name,
            email: currentEmployee.email,
            phone: currentEmployee.phone,
            date_of_birth: formatDateForInput(currentEmployee.date_of_birth),
            gender: currentEmployee.gender,
            address: currentEmployee.address,
            emergency_contact: currentEmployee.emergency_contact,
            position: currentEmployee.position,
            department: currentEmployee.department,
            manager_id: currentEmployee.manager_id,
            employment_type: currentEmployee.employment_type,
            start_date: formatDateForInput(currentEmployee.start_date),
            salary: currentEmployee.salary,
            status: currentEmployee.status,
            skills: currentEmployee.skills || [],
            certifications: currentEmployee.certifications || [],
            notes: currentEmployee.notes,
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

