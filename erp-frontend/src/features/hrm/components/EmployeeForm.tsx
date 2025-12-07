import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Address, EmergencyContact } from '../types';

interface EmployeeFormProps {
  initialData?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isEdit?: boolean;
  loading?: boolean;
}

export const EmployeeForm: React.FC<EmployeeFormProps> = ({
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
    defaultValues: initialData || {
      address: {
        street: '',
        city: '',
        state: '',
        postal_code: '',
        country: '',
      },
      emergency_contact: {
        name: '',
        relationship: '',
        phone: '',
        email: '',
      },
      skills: [],
      certifications: [],
      status: 'active',
      employment_type: 'full_time',
    },
  });

  // Update form values when initialData changes (for edit mode)
  React.useEffect(() => {
    if (initialData) {
      Object.keys(initialData).forEach((key) => {
        setValue(key as any, initialData[key]);
      });
      if (initialData.skills) {
        setSkillsInput(initialData.skills.join(', '));
      }
      if (initialData.certifications) {
        setCertificationsInput(initialData.certifications.join(', '));
      }
    }
  }, [initialData, setValue]);

  const [skillsInput, setSkillsInput] = useState('');
  const [certificationsInput, setCertificationsInput] = useState('');

  const handleFormSubmit = (data: any) => {
    // Process skills and certifications
    const skills = skillsInput.split(',').map(s => s.trim()).filter(s => s);
    const certifications = certificationsInput.split(',').map(c => c.trim()).filter(c => c);
    
    // Ensure dates are in ISO format (YYYY-MM-DD)
    const formattedData = {
      ...data,
      date_of_birth: data.date_of_birth ? new Date(data.date_of_birth).toISOString().split('T')[0] : data.date_of_birth,
      start_date: data.start_date ? new Date(data.start_date).toISOString().split('T')[0] : data.start_date,
      skills,
      certifications,
      // Ensure nested objects are properly structured
      address: {
        street: data.address?.street || '',
        city: data.address?.city || '',
        state: data.address?.state || '',
        postal_code: data.address?.postal_code || '',
        country: data.address?.country || '',
      },
      emergency_contact: {
        name: data.emergency_contact?.name || '',
        relationship: data.emergency_contact?.relationship || '',
        phone: data.emergency_contact?.phone || '',
        email: data.emergency_contact?.email || undefined,
      },
    };
    
    console.log('Formatted employee data:', formattedData);
    onSubmit(formattedData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
      {/* Personal Information Section */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <svg className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Personal Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* First Name */}
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1.5">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="first_name"
              {...register('first_name', {
                required: 'First name is required',
                minLength: { value: 1, message: 'First name is required' },
                maxLength: { value: 50, message: 'First name must be less than 50 characters' },
              })}
              placeholder="John"
              className={`block w-full px-3 py-2.5 border rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-150 ease-in-out ${
                errors.first_name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.first_name && (
              <p className="mt-1.5 text-sm text-red-600">{errors.first_name.message as string}</p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1.5">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="last_name"
              {...register('last_name', {
                required: 'Last name is required',
                minLength: { value: 1, message: 'Last name is required' },
                maxLength: { value: 50, message: 'Last name must be less than 50 characters' },
              })}
              placeholder="Doe"
              className={`block w-full px-3 py-2.5 border rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-150 ease-in-out ${
                errors.last_name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.last_name && (
              <p className="mt-1.5 text-sm text-red-600">{errors.last_name.message as string}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
              placeholder="john.doe@example.com"
              className={`block w-full px-3 py-2.5 border rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-150 ease-in-out ${
                errors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.email && (
              <p className="mt-1.5 text-sm text-red-600">{errors.email.message as string}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              {...register('phone', {
                required: 'Phone number is required',
              })}
              placeholder="+1 (555) 123-4567"
              className={`block w-full px-3 py-2.5 border rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-150 ease-in-out ${
                errors.phone ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.phone && (
              <p className="mt-1.5 text-sm text-red-600">{errors.phone.message as string}</p>
            )}
          </div>

          {/* Date of Birth */}
          <div>
            <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 mb-1.5">
              Date of Birth <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="date_of_birth"
              {...register('date_of_birth', {
                required: 'Date of birth is required',
              })}
              className={`block w-full px-3 py-2.5 border rounded-lg leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-150 ease-in-out ${
                errors.date_of_birth ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.date_of_birth && (
              <p className="mt-1.5 text-sm text-red-600">{errors.date_of_birth.message as string}</p>
            )}
          </div>

          {/* Gender */}
          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1.5">
              Gender
            </label>
            <select
              id="gender"
              {...register('gender')}
              className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-150 ease-in-out"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>
        </div>
      </div>

      {/* Address Section */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <svg className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Address
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label htmlFor="address.street" className="block text-sm font-medium text-gray-700 mb-1.5">
              Street Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="address.street"
              {...register('address.street', { required: 'Street address is required' })}
              placeholder="123 Main St"
              className={`block w-full px-3 py-2.5 border rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-150 ease-in-out ${
                errors.address?.street ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.address?.street && (
              <p className="mt-1.5 text-sm text-red-600">{errors.address.street.message as string}</p>
            )}
          </div>

          <div>
            <label htmlFor="address.city" className="block text-sm font-medium text-gray-700 mb-1.5">
              City <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="address.city"
              {...register('address.city', { required: 'City is required' })}
              placeholder="New York"
              className={`block w-full px-3 py-2.5 border rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-150 ease-in-out ${
                errors.address?.city ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.address?.city && (
              <p className="mt-1.5 text-sm text-red-600">{errors.address.city.message as string}</p>
            )}
          </div>

          <div>
            <label htmlFor="address.state" className="block text-sm font-medium text-gray-700 mb-1.5">
              State/Province <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="address.state"
              {...register('address.state', { required: 'State is required' })}
              placeholder="NY"
              className={`block w-full px-3 py-2.5 border rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-150 ease-in-out ${
                errors.address?.state ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.address?.state && (
              <p className="mt-1.5 text-sm text-red-600">{errors.address.state.message as string}</p>
            )}
          </div>

          <div>
            <label htmlFor="address.postal_code" className="block text-sm font-medium text-gray-700 mb-1.5">
              Postal Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="address.postal_code"
              {...register('address.postal_code', { required: 'Postal code is required' })}
              placeholder="10001"
              className={`block w-full px-3 py-2.5 border rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-150 ease-in-out ${
                errors.address?.postal_code ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.address?.postal_code && (
              <p className="mt-1.5 text-sm text-red-600">{errors.address.postal_code.message as string}</p>
            )}
          </div>

          <div>
            <label htmlFor="address.country" className="block text-sm font-medium text-gray-700 mb-1.5">
              Country <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="address.country"
              {...register('address.country', { required: 'Country is required' })}
              placeholder="United States"
              className={`block w-full px-3 py-2.5 border rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-150 ease-in-out ${
                errors.address?.country ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.address?.country && (
              <p className="mt-1.5 text-sm text-red-600">{errors.address.country.message as string}</p>
            )}
          </div>
        </div>
      </div>

      {/* Employment Information Section */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <svg className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Employment Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Employee ID */}
          {!isEdit && (
            <div>
              <label htmlFor="employee_id" className="block text-sm font-medium text-gray-700 mb-1.5">
                Employee ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="employee_id"
                {...register('employee_id', { required: 'Employee ID is required' })}
                placeholder="EMP001"
                className={`block w-full px-3 py-2.5 border rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-150 ease-in-out ${
                  errors.employee_id ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.employee_id && (
                <p className="mt-1.5 text-sm text-red-600">{errors.employee_id.message as string}</p>
              )}
            </div>
          )}

          {/* Department */}
          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1.5">
              Department <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="department"
              {...register('department', { required: 'Department is required' })}
              placeholder="Sales, IT, HR"
              className={`block w-full px-3 py-2.5 border rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-150 ease-in-out ${
                errors.department ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.department && (
              <p className="mt-1.5 text-sm text-red-600">{errors.department.message as string}</p>
            )}
          </div>

          {/* Position */}
          <div>
            <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1.5">
              Position <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="position"
              {...register('position', { required: 'Position is required' })}
              placeholder="Software Engineer, Sales Manager"
              className={`block w-full px-3 py-2.5 border rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-150 ease-in-out ${
                errors.position ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.position && (
              <p className="mt-1.5 text-sm text-red-600">{errors.position.message as string}</p>
            )}
          </div>

          {/* Employment Type */}
          <div>
            <label htmlFor="employment_type" className="block text-sm font-medium text-gray-700 mb-1.5">
              Employment Type <span className="text-red-500">*</span>
            </label>
            <select
              id="employment_type"
              {...register('employment_type', { required: 'Employment type is required' })}
              className={`block w-full px-3 py-2.5 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-150 ease-in-out ${
                errors.employment_type ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="full_time">Full Time</option>
              <option value="part_time">Part Time</option>
              <option value="contract">Contract</option>
              <option value="intern">Intern</option>
              <option value="freelance">Freelance</option>
            </select>
            {errors.employment_type && (
              <p className="mt-1.5 text-sm text-red-600">{errors.employment_type.message as string}</p>
            )}
          </div>

          {/* Start Date */}
          <div>
            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1.5">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="start_date"
              {...register('start_date', { required: 'Start date is required' })}
              className={`block w-full px-3 py-2.5 border rounded-lg leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-150 ease-in-out ${
                errors.start_date ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.start_date && (
              <p className="mt-1.5 text-sm text-red-600">{errors.start_date.message as string}</p>
            )}
          </div>

          {/* Salary */}
          <div>
            <label htmlFor="salary" className="block text-sm font-medium text-gray-700 mb-1.5">
              Salary <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="salary"
              step="0.01"
              {...register('salary', {
                required: 'Salary is required',
                min: { value: 0, message: 'Salary must be positive' },
              })}
              placeholder="50000"
              className={`block w-full px-3 py-2.5 border rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-150 ease-in-out ${
                errors.salary ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.salary && (
              <p className="mt-1.5 text-sm text-red-600">{errors.salary.message as string}</p>
            )}
          </div>

          {/* Status */}
          {isEdit && (
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1.5">
                Status
              </label>
              <select
                id="status"
                {...register('status')}
                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-150 ease-in-out"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="terminated">Terminated</option>
                <option value="on_leave">On Leave</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Emergency Contact Section */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <svg className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          Emergency Contact
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="emergency_contact.name" className="block text-sm font-medium text-gray-700 mb-1.5">
              Contact Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="emergency_contact.name"
              {...register('emergency_contact.name', { required: 'Emergency contact name is required' })}
              placeholder="Jane Doe"
              className={`block w-full px-3 py-2.5 border rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-150 ease-in-out ${
                errors.emergency_contact?.name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.emergency_contact?.name && (
              <p className="mt-1.5 text-sm text-red-600">{errors.emergency_contact.name.message as string}</p>
            )}
          </div>

          <div>
            <label htmlFor="emergency_contact.relationship" className="block text-sm font-medium text-gray-700 mb-1.5">
              Relationship <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="emergency_contact.relationship"
              {...register('emergency_contact.relationship', { required: 'Relationship is required' })}
              placeholder="Spouse, Parent, Sibling"
              className={`block w-full px-3 py-2.5 border rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-150 ease-in-out ${
                errors.emergency_contact?.relationship ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.emergency_contact?.relationship && (
              <p className="mt-1.5 text-sm text-red-600">{errors.emergency_contact.relationship.message as string}</p>
            )}
          </div>

          <div>
            <label htmlFor="emergency_contact.phone" className="block text-sm font-medium text-gray-700 mb-1.5">
              Contact Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="emergency_contact.phone"
              {...register('emergency_contact.phone', { required: 'Emergency contact phone is required' })}
              placeholder="+1 (555) 123-4567"
              className={`block w-full px-3 py-2.5 border rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-150 ease-in-out ${
                errors.emergency_contact?.phone ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.emergency_contact?.phone && (
              <p className="mt-1.5 text-sm text-red-600">{errors.emergency_contact.phone.message as string}</p>
            )}
          </div>

          <div>
            <label htmlFor="emergency_contact.email" className="block text-sm font-medium text-gray-700 mb-1.5">
              Contact Email
            </label>
            <input
              type="email"
              id="emergency_contact.email"
              {...register('emergency_contact.email')}
              placeholder="jane.doe@example.com"
              className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-150 ease-in-out"
            />
          </div>
        </div>
      </div>

      {/* Skills and Certifications */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <svg className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
          Skills & Certifications
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-1.5">
              Skills (comma-separated)
            </label>
            <input
              type="text"
              id="skills"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              placeholder="JavaScript, Python, React"
              className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-150 ease-in-out"
            />
            <p className="mt-1.5 text-xs text-gray-500">Separate multiple skills with commas</p>
          </div>

          <div>
            <label htmlFor="certifications" className="block text-sm font-medium text-gray-700 mb-1.5">
              Certifications (comma-separated)
            </label>
            <input
              type="text"
              id="certifications"
              value={certificationsInput}
              onChange={(e) => setCertificationsInput(e.target.value)}
              placeholder="AWS Certified, PMP, Scrum Master"
              className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-150 ease-in-out"
            />
            <p className="mt-1.5 text-xs text-gray-500">Separate multiple certifications with commas</p>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1.5">
          Notes
        </label>
        <textarea
          id="notes"
          rows={4}
          {...register('notes')}
          placeholder="Additional notes about the employee..."
          className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-150 ease-in-out"
        />
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 pt-6"></div>

      {/* Buttons */}
      <div className="flex justify-end space-x-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center px-5 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition duration-150 ease-in-out"
        >
          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            <>
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {isEdit ? 'Update Employee' : 'Create Employee'}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

