import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Input } from '../../../shared/components/ui/Input';
import { Select } from '../../../shared/components/ui/Select';
import { Textarea } from '../../../shared/components/ui/Textarea';
import { Button } from '../../../shared/components/ui/Button';
import { employeeApi } from '../services/hrmApi';
import { Employee } from '../types';

interface AttendanceFormProps {
  initialData?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isEdit?: boolean;
  loading?: boolean;
}

export const AttendanceForm: React.FC<AttendanceFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isEdit = false,
  loading = false,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm({
    defaultValues: initialData ? {
      ...initialData,
      date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : '',
      clock_in_time: initialData.clock_in_time || '',
      clock_out_time: initialData.clock_out_time || '',
    } : {
      employee_id: '',
      date: new Date().toISOString().split('T')[0],
      clock_in_time: '',
      clock_out_time: '',
      status: 'present',
      notes: '',
    },
  });

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Fetch employees for dropdown
  useEffect(() => {
    const loadEmployees = async () => {
      setLoadingEmployees(true);
      try {
        const data = await employeeApi.getEmployees({ limit: 1000, status: 'active' });
        setEmployees(data || []);
      } catch (error) {
        console.error('Error loading employees:', error);
      } finally {
        setLoadingEmployees(false);
      }
    };
    loadEmployees();
  }, []);

  // Update form when employee is selected
  const employeeId = watch('employee_id');
  useEffect(() => {
    if (employeeId) {
      const employee = employees.find(e => e.employee_id === employeeId || e.id === employeeId);
      if (employee) {
        setSelectedEmployee(employee);
      }
    }
  }, [employeeId, employees]);

  // Calculate total hours
  const clockInTime = watch('clock_in_time');
  const clockOutTime = watch('clock_out_time');
  
  const calculateHours = () => {
    if (!clockInTime || !clockOutTime) return 0;
    
    try {
      const [inHours, inMinutes] = clockInTime.split(':').map(Number);
      const [outHours, outMinutes] = clockOutTime.split(':').map(Number);
      
      const inTime = inHours * 60 + inMinutes;
      const outTime = outHours * 60 + outMinutes;
      
      if (outTime <= inTime) return 0;
      
      const totalMinutes = outTime - inTime;
      return (totalMinutes / 60).toFixed(2);
    } catch {
      return 0;
    }
  };

  const totalHours = calculateHours();

  const handleFormSubmit = (data: any) => {
    const formattedData = {
      employee_id: data.employee_id,
      date: data.date,
      clock_in_time: data.clock_in_time || undefined,
      clock_out_time: data.clock_out_time || undefined,
      status: data.status,
      notes: data.notes || undefined,
      total_hours: totalHours ? parseFloat(totalHours) : undefined,
    };
    
    onSubmit(formattedData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Employee Selection */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Employee Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Select
              id="employee_id"
              label="Employee"
              {...register('employee_id', {
                required: 'Employee is required',
              })}
              disabled={isEdit || loadingEmployees}
              options={[
                { value: '', label: 'Select an employee' },
                ...employees.map(emp => ({
                  value: emp.employee_id,
                  label: `${emp.full_name || `${emp.first_name} ${emp.last_name}`} (${emp.employee_id})`
                }))
              ]}
              error={errors.employee_id?.message as string}
            />
            {selectedEmployee && (
              <div className="mt-2 text-sm text-gray-600">
                <p>Department: {selectedEmployee.department}</p>
                <p>Position: {selectedEmployee.position}</p>
              </div>
            )}
          </div>

          <div>
            <Input
              id="date"
              type="date"
              label="Date"
              {...register('date', {
                required: 'Date is required',
              })}
              error={errors.date?.message as string}
            />
          </div>
        </div>
      </div>

      {/* Time Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Time Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Input
              id="clock_in_time"
              type="time"
              label="Clock In Time"
              {...register('clock_in_time')}
              error={errors.clock_in_time?.message as string}
            />
          </div>

          <div>
            <Input
              id="clock_out_time"
              type="time"
              label="Clock Out Time"
              {...register('clock_out_time')}
              error={errors.clock_out_time?.message as string}
            />
          </div>
        </div>

        {totalHours > 0 && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-900">
              Total Hours: <span className="text-lg">{totalHours} hours</span>
            </p>
          </div>
        )}
      </div>

      {/* Status */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Select
              id="status"
              label="Attendance Status"
              {...register('status', {
                required: 'Status is required',
              })}
              options={[
                { value: 'present', label: 'Present' },
                { value: 'absent', label: 'Absent' },
                { value: 'late', label: 'Late' },
                { value: 'early_leave', label: 'Early Leave' },
                { value: 'half_day', label: 'Half Day' },
                { value: 'overtime', label: 'Overtime' },
              ]}
              error={errors.status?.message as string}
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <Textarea
          id="notes"
          label="Notes"
          rows={4}
          {...register('notes')}
          placeholder="Add any additional notes or comments..."
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={loading || loadingEmployees}
        >
          {loading ? 'Saving...' : isEdit ? 'Update Attendance' : 'Create Attendance'}
        </Button>
      </div>
    </form>
  );
};



