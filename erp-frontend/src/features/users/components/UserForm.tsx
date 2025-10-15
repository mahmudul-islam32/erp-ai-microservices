import React from 'react';
import { useForm } from 'react-hook-form';
import { CreateUserData, UpdateUserData, UserRole } from '../types';

interface UserFormProps {
  initialData?: UpdateUserData & { email?: string };
  onSubmit: (data: CreateUserData | UpdateUserData) => void;
  onCancel: () => void;
  isEdit?: boolean;
  loading?: boolean;
}

export const UserForm: React.FC<UserFormProps> = ({
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
  } = useForm({
    defaultValues: initialData || {},
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email *
        </label>
        <input
          type="email"
          id="email"
          {...register('email', {
            required: !isEdit ? 'Email is required' : false,
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address',
            },
          })}
          disabled={isEdit}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      {/* Password (only for create) */}
      {!isEdit && (
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password *
          </label>
          <input
            type="password"
            id="password"
            {...register('password', {
              required: 'Password is required',
              minLength: {
                value: 8,
                message: 'Password must be at least 8 characters',
              },
            })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>
      )}

      {/* First Name */}
      <div>
        <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
          First Name *
        </label>
        <input
          type="text"
          id="first_name"
          {...register('first_name', {
            required: 'First name is required',
            minLength: {
              value: 1,
              message: 'First name is required',
            },
            maxLength: {
              value: 50,
              message: 'First name must be less than 50 characters',
            },
          })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
        {errors.first_name && (
          <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>
        )}
      </div>

      {/* Last Name */}
      <div>
        <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
          Last Name *
        </label>
        <input
          type="text"
          id="last_name"
          {...register('last_name', {
            required: 'Last name is required',
            minLength: {
              value: 1,
              message: 'Last name is required',
            },
            maxLength: {
              value: 50,
              message: 'Last name must be less than 50 characters',
            },
          })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
        {errors.last_name && (
          <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
        )}
      </div>

      {/* Role */}
      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-700">
          Role *
        </label>
        <select
          id="role"
          {...register('role', { required: !isEdit ? 'Role is required' : false })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="">Select a role</option>
          {Object.values(UserRole).map((role) => (
            <option key={role} value={role}>
              {role.replace('_', ' ').toUpperCase()}
            </option>
          ))}
        </select>
        {errors.role && (
          <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
        )}
      </div>

      {/* Department */}
      <div>
        <label htmlFor="department" className="block text-sm font-medium text-gray-700">
          Department
        </label>
        <input
          type="text"
          id="department"
          {...register('department')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
          Phone
        </label>
        <input
          type="tel"
          id="phone"
          {...register('phone')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      {/* Status (only for edit) */}
      {isEdit && (
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            id="status"
            {...register('status')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      )}

      {/* Buttons */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? 'Saving...' : isEdit ? 'Update User' : 'Create User'}
        </button>
      </div>
    </form>
  );
};

