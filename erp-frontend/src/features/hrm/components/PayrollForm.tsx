import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Input } from '../../../shared/components/ui/Input';
import { Select } from '../../../shared/components/ui/Select';
import { Textarea } from '../../../shared/components/ui/Textarea';
import { Button } from '../../../shared/components/ui/Button';
import { employeeApi } from '../services/hrmApi';
import { Employee } from '../types';

interface PayrollFormProps {
  initialData?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isEdit?: boolean;
  loading?: boolean;
}

export const PayrollForm: React.FC<PayrollFormProps> = ({
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
      // Convert decimals to percentages for display (e.g., 0.20 -> 20)
      tax_rate: initialData.tax_rate ? (initialData.tax_rate * 100) : 20,
      social_security_rate: initialData.social_security_rate ? (initialData.social_security_rate * 100) : 6.2,
      medicare_rate: initialData.medicare_rate ? (initialData.medicare_rate * 100) : 1.45,
    } : {
      employee_id: '',
      pay_period_start: '',
      pay_period_end: '',
      basic_salary: 0,
      overtime_hours: 0,
      overtime_rate: 1.5,
      bonus: 0,
      commission: 0,
      tax_rate: 20, // Display as percentage
      social_security_rate: 6.2, // Display as percentage
      medicare_rate: 1.45, // Display as percentage
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
        const data = await employeeApi.getEmployees({ limit: 1000 });
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
      const employee = employees.find(e => e.id === employeeId || e.employee_id === employeeId);
      if (employee) {
        setSelectedEmployee(employee);
        if (!isEdit && !initialData?.basic_salary) {
          setValue('basic_salary', employee.salary || 0);
        }
      }
    }
  }, [employeeId, employees, setValue, isEdit, initialData]);

  // Calculate totals
  const basicSalary = parseFloat(watch('basic_salary') || 0);
  const overtimeHours = parseFloat(watch('overtime_hours') || 0);
  const overtimeRate = parseFloat(watch('overtime_rate') || 1.5);
  const bonus = parseFloat(watch('bonus') || 0);
  const commission = parseFloat(watch('commission') || 0);
  // Convert percentage inputs to decimals for calculations
  const taxRate = parseFloat(watch('tax_rate') || 20) / 100;
  const socialSecurityRate = parseFloat(watch('social_security_rate') || 6.2) / 100;
  const medicareRate = parseFloat(watch('medicare_rate') || 1.45) / 100;

  const overtimePay = (basicSalary / 160) * overtimeHours * overtimeRate; // Assuming 160 hours per month
  const grossEarnings = basicSalary + overtimePay + bonus + commission;
  const incomeTax = grossEarnings * taxRate;
  const socialSecurity = grossEarnings * socialSecurityRate;
  const medicare = grossEarnings * medicareRate;
  const totalDeductions = incomeTax + socialSecurity + medicare;
  const netPay = grossEarnings - totalDeductions;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleFormSubmit = (data: any) => {
    // Convert percentage inputs to decimals (e.g., 20% -> 0.20)
    const formattedData = {
      ...data,
      basic_salary: parseFloat(data.basic_salary),
      overtime_hours: parseFloat(data.overtime_hours || 0),
      overtime_rate: parseFloat(data.overtime_rate || 1.5),
      bonus: parseFloat(data.bonus || 0),
      commission: parseFloat(data.commission || 0),
      tax_rate: parseFloat(data.tax_rate || 20) / 100, // Convert percentage to decimal
      social_security_rate: parseFloat(data.social_security_rate || 6.2) / 100, // Convert percentage to decimal
      medicare_rate: parseFloat(data.medicare_rate || 1.45) / 100, // Convert percentage to decimal
      allowances: [],
      deductions: [],
    };
    
    console.log('Formatted payroll data:', formattedData);
    onSubmit(formattedData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
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
                ...employees.map((emp) => ({
                  value: emp.id || emp.employee_id,
                  label: `${emp.full_name || `${emp.first_name} ${emp.last_name}`} (${emp.employee_id})`
                }))
              ]}
              error={errors.employee_id?.message as string}
            />
            {selectedEmployee && (
              <p className="mt-1 text-sm text-gray-500">
                Department: {selectedEmployee.department} | Position: {selectedEmployee.position}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Pay Period */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Pay Period</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="pay_period_start" className="block text-sm font-medium text-gray-700 mb-1.5">
              Period Start <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              id="pay_period_start"
              {...register('pay_period_start', {
                required: 'Pay period start is required',
              })}
              className={errors.pay_period_start ? 'border-red-300' : ''}
            />
            {errors.pay_period_start && (
              <p className="mt-1 text-sm text-red-600">{errors.pay_period_start.message as string}</p>
            )}
          </div>

          <div>
            <label htmlFor="pay_period_end" className="block text-sm font-medium text-gray-700 mb-1.5">
              Period End <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              id="pay_period_end"
              {...register('pay_period_end', {
                required: 'Pay period end is required',
              })}
              className={errors.pay_period_end ? 'border-red-300' : ''}
            />
            {errors.pay_period_end && (
              <p className="mt-1 text-sm text-red-600">{errors.pay_period_end.message as string}</p>
            )}
          </div>
        </div>
      </div>

      {/* Earnings */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Earnings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="basic_salary" className="block text-sm font-medium text-gray-700 mb-1.5">
              Basic Salary <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              id="basic_salary"
              step="0.01"
              min="0"
              {...register('basic_salary', {
                required: 'Basic salary is required',
                min: { value: 0, message: 'Basic salary must be greater than 0' },
              })}
              className={errors.basic_salary ? 'border-red-300' : ''}
            />
            {errors.basic_salary && (
              <p className="mt-1 text-sm text-red-600">{errors.basic_salary.message as string}</p>
            )}
          </div>

          <div>
            <label htmlFor="overtime_hours" className="block text-sm font-medium text-gray-700 mb-1.5">
              Overtime Hours
            </label>
            <Input
              type="number"
              id="overtime_hours"
              step="0.1"
              min="0"
              {...register('overtime_hours', {
                min: { value: 0, message: 'Overtime hours cannot be negative' },
              })}
              className={errors.overtime_hours ? 'border-red-300' : ''}
            />
            {errors.overtime_hours && (
              <p className="mt-1 text-sm text-red-600">{errors.overtime_hours.message as string}</p>
            )}
          </div>

          <div>
            <label htmlFor="overtime_rate" className="block text-sm font-medium text-gray-700 mb-1.5">
              Overtime Rate (Multiplier)
            </label>
            <Input
              type="number"
              id="overtime_rate"
              step="0.1"
              min="1"
              {...register('overtime_rate', {
                min: { value: 1, message: 'Overtime rate must be at least 1' },
              })}
              className={errors.overtime_rate ? 'border-red-300' : ''}
            />
            {errors.overtime_rate && (
              <p className="mt-1 text-sm text-red-600">{errors.overtime_rate.message as string}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">Overtime Pay: {formatCurrency(overtimePay)}</p>
          </div>

          <div>
            <label htmlFor="bonus" className="block text-sm font-medium text-gray-700 mb-1.5">
              Bonus
            </label>
            <Input
              type="number"
              id="bonus"
              step="0.01"
              min="0"
              {...register('bonus', {
                min: { value: 0, message: 'Bonus cannot be negative' },
              })}
              className={errors.bonus ? 'border-red-300' : ''}
            />
            {errors.bonus && (
              <p className="mt-1 text-sm text-red-600">{errors.bonus.message as string}</p>
            )}
          </div>

          <div>
            <label htmlFor="commission" className="block text-sm font-medium text-gray-700 mb-1.5">
              Commission
            </label>
            <Input
              type="number"
              id="commission"
              step="0.01"
              min="0"
              {...register('commission', {
                min: { value: 0, message: 'Commission cannot be negative' },
              })}
              className={errors.commission ? 'border-red-300' : ''}
            />
            {errors.commission && (
              <p className="mt-1 text-sm text-red-600">{errors.commission.message as string}</p>
            )}
          </div>
        </div>
      </div>

      {/* Deductions */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Tax Rates & Deductions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="tax_rate" className="block text-sm font-medium text-gray-700 mb-1.5">
              Income Tax Rate (%)
            </label>
            <Input
              type="number"
              id="tax_rate"
              step="0.1"
              min="0"
              max="100"
              {...register('tax_rate', {
                min: { value: 0, message: 'Tax rate cannot be negative' },
                max: { value: 100, message: 'Tax rate cannot exceed 100%' },
              })}
              className={errors.tax_rate ? 'border-red-300' : ''}
            />
            {errors.tax_rate && (
              <p className="mt-1 text-sm text-red-600">{errors.tax_rate.message as string}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">Amount: {formatCurrency(incomeTax)}</p>
          </div>

          <div>
            <label htmlFor="social_security_rate" className="block text-sm font-medium text-gray-700 mb-1.5">
              Social Security Rate (%)
            </label>
            <Input
              type="number"
              id="social_security_rate"
              step="0.1"
              min="0"
              max="100"
              {...register('social_security_rate', {
                min: { value: 0, message: 'Social security rate cannot be negative' },
                max: { value: 100, message: 'Social security rate cannot exceed 100%' },
              })}
              className={errors.social_security_rate ? 'border-red-300' : ''}
            />
            {errors.social_security_rate && (
              <p className="mt-1 text-sm text-red-600">{errors.social_security_rate.message as string}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">Amount: {formatCurrency(socialSecurity)}</p>
          </div>

          <div>
            <label htmlFor="medicare_rate" className="block text-sm font-medium text-gray-700 mb-1.5">
              Medicare Rate (%)
            </label>
            <Input
              type="number"
              id="medicare_rate"
              step="0.1"
              min="0"
              max="100"
              {...register('medicare_rate', {
                min: { value: 0, message: 'Medicare rate cannot be negative' },
                max: { value: 100, message: 'Medicare rate cannot exceed 100%' },
              })}
              className={errors.medicare_rate ? 'border-red-300' : ''}
            />
            {errors.medicare_rate && (
              <p className="mt-1 text-sm text-red-600">{errors.medicare_rate.message as string}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">Amount: {formatCurrency(medicare)}</p>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Payroll Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Earnings</h4>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">Basic Salary:</dt>
                <dd className="text-sm font-medium text-gray-900">{formatCurrency(basicSalary)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">Overtime Pay:</dt>
                <dd className="text-sm font-medium text-gray-900">{formatCurrency(overtimePay)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">Bonus:</dt>
                <dd className="text-sm font-medium text-gray-900">{formatCurrency(bonus)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">Commission:</dt>
                <dd className="text-sm font-medium text-gray-900">{formatCurrency(commission)}</dd>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-300">
                <dt className="text-sm font-semibold text-gray-900">Gross Earnings:</dt>
                <dd className="text-sm font-semibold text-gray-900">{formatCurrency(grossEarnings)}</dd>
              </div>
            </dl>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Deductions</h4>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">Income Tax:</dt>
                <dd className="text-sm font-medium text-gray-900">{formatCurrency(incomeTax)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">Social Security:</dt>
                <dd className="text-sm font-medium text-gray-900">{formatCurrency(socialSecurity)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">Medicare:</dt>
                <dd className="text-sm font-medium text-gray-900">{formatCurrency(medicare)}</dd>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-300">
                <dt className="text-sm font-semibold text-gray-900">Total Deductions:</dt>
                <dd className="text-sm font-semibold text-gray-900">{formatCurrency(totalDeductions)}</dd>
              </div>
              <div className="flex justify-between pt-2 border-t-2 border-gray-400">
                <dt className="text-base font-bold text-gray-900">Net Pay:</dt>
                <dd className="text-base font-bold text-primary-600">{formatCurrency(netPay)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1.5">
          Notes
        </label>
        <Textarea
          id="notes"
          rows={4}
          {...register('notes')}
          placeholder="Additional notes or comments..."
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
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
          isLoading={loading}
          disabled={loading}
        >
          {loading ? 'Processing...' : isEdit ? 'Update Payroll' : 'Create Payroll'}
        </Button>
      </div>
    </form>
  );
};

