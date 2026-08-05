import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { CreateUserData, UpdateUserData, UserRole } from '@/features/users/types';
import {
  settingsApi,
  SettingsCategory,
  SecuritySettings,
} from '@/features/settings/services/settingsApi';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Select } from '@/shared/components/ui/Select';

/**
 * The fields this form registers. `password` only appears when creating a user,
 * so it is optional here even though CreateUserData requires it.
 */
interface UserFormValues {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  department?: string;
  role?: UserRole;
  status: string;
  password?: string;
}

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
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings | null>(null);
  const [passwordHelperText, setPasswordHelperText] = useState('Minimum 8 characters');

  useEffect(() => {
    const loadSecuritySettings = async () => {
      try {
        const settings = await settingsApi.getByCategory(SettingsCategory.SECURITY);
        if (settings.security) {
          setSecuritySettings(settings.security);
          // Generate helper text
          const requirements: string[] = [];
          requirements.push(`at least ${settings.security.password_min_length} characters`);
          
          if (settings.security.password_require_uppercase) {
            requirements.push('one uppercase letter');
          }
          if (settings.security.password_require_lowercase) {
            requirements.push('one lowercase letter');
          }
          if (settings.security.password_require_numbers) {
            requirements.push('one number');
          }
          if (settings.security.password_require_special_chars) {
            requirements.push('one special character');
          }
          
          setPasswordHelperText(`Password must contain ${requirements.join(', ')}`);
        }
      } catch (error) {
        console.error('Error loading security settings:', error);
      }
    };
    if (!isEdit) {
      loadSecuritySettings();
    }
  }, [isEdit]);

  const validatePassword = (password: string): string | true => {
    if (!securitySettings) {
      // Default validation
      if (password.length < 8) {
        return 'Password must be at least 8 characters long';
      }
      return true;
    }

    const minLength = securitySettings.password_min_length || 8;
    if (password.length < minLength) {
      return `Password must be at least ${minLength} characters long`;
    }

    if (securitySettings.password_require_uppercase && !/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }

    if (securitySettings.password_require_lowercase && !/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }

    if (securitySettings.password_require_numbers && !/\d/.test(password)) {
      return 'Password must contain at least one number';
    }

    if (securitySettings.password_require_special_chars && !/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
      return 'Password must contain at least one special character';
    }

    return true;
  };

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<UserFormValues>({
    defaultValues: {
      ...initialData,
      status: initialData?.status || 'active',
    },
  });
  const password = watch('password');

  return (
    <form
      // Every field the API requires is marked required in its Controller rules,
      // so validation guarantees they are present by the time this runs.
      onSubmit={handleSubmit((values) => onSubmit(values as CreateUserData | UpdateUserData))}
      className="space-y-8"
    >
      {/* Personal Information Section */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <svg className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Personal Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Email */}
          <div className={isEdit ? 'md:col-span-2' : ''}>
            <Controller
              name="email"
              control={control}
              rules={{
                required: !isEdit ? 'Email is required' : false,
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              }}
              render={({ field }) => (
                <Input
                  {...field}
                  id="email"
                  type="email"
                  label="Email Address"
                  placeholder="user@example.com"
                  required={!isEdit}
                  disabled={isEdit}
                  value={field.value || ''}
                  error={errors.email?.message as string}
                  helperText={isEdit ? 'Email cannot be changed after account creation' : undefined}
                />
              )}
            />
          </div>

          {/* Password (only for create) */}
          {!isEdit && (
            <div className="md:col-span-2">
              <Controller
                name="password"
                control={control}
                rules={{
                  required: 'Password is required',
                  validate: validatePassword,
                }}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="password"
                    type="password"
                    label="Password"
                    placeholder={passwordHelperText}
                    required
                    value={field.value || ''}
                    error={errors.password?.message as string}
                    helperText={!errors.password && password ? passwordHelperText : undefined}
                  />
                )}
              />
            </div>
          )}

          {/* First Name */}
          <div>
            <Controller
              name="first_name"
              control={control}
              rules={{
                required: 'First name is required',
                minLength: {
                  value: 1,
                  message: 'First name is required',
                },
                maxLength: {
                  value: 50,
                  message: 'First name must be less than 50 characters',
                },
              }}
              render={({ field }) => (
                <Input
                  {...field}
                  id="first_name"
                  label="First Name"
                  placeholder="John"
                  required
                  value={field.value || ''}
                  error={errors.first_name?.message as string}
                />
              )}
            />
          </div>

          {/* Last Name */}
          <div>
            <Controller
              name="last_name"
              control={control}
              rules={{
                required: 'Last name is required',
                minLength: {
                  value: 1,
                  message: 'Last name is required',
                },
                maxLength: {
                  value: 50,
                  message: 'Last name must be less than 50 characters',
                },
              }}
              render={({ field }) => (
                <Input
                  {...field}
                  id="last_name"
                  label="Last Name"
                  placeholder="Doe"
                  required
                  value={field.value || ''}
                  error={errors.last_name?.message as string}
                />
              )}
            />
          </div>
        </div>
      </div>

      {/* Role & Access Section */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <svg className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Role & Access
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Role */}
          <div>
            <Controller
              name="role"
              control={control}
              rules={{
                required: !isEdit ? 'Role is required' : false,
              }}
              render={({ field }) => (
                <Select
                  {...field}
                  id="role"
                  label="Role"
                  required={!isEdit}
                  value={field.value || ''}
                  options={[
                    { value: '', label: 'Select a role' },
                    ...Object.values(UserRole).map((role) => ({
                      value: role,
                      label:
                        role.replace('_', ' ').charAt(0) +
                        role.replace('_', ' ').slice(1).toLowerCase(),
                    })),
                  ]}
                  error={errors.role?.message as string}
                  helperText="User's permission level in the system"
                />
              )}
            />
          </div>

          {/* Status (only for edit) */}
          {isEdit && (
            <div>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    id="status"
                    label="Status"
                    value={field.value || 'active'}
                    options={[
                      { value: 'active', label: 'Active' },
                      { value: 'inactive', label: 'Inactive' },
                      { value: 'suspended', label: 'Suspended' },
                      { value: 'pending', label: 'Pending' },
                    ]}
                    helperText="Account status and access control"
                  />
                )}
              />
            </div>
          )}
        </div>
      </div>

      {/* Contact & Organization Section */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <svg className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Contact & Organization
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Department */}
          <div>
            <Controller
              name="department"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="department"
                  label="Department"
                  placeholder="e.g. Sales, IT, HR"
                  value={field.value || ''}
                  helperText="Organizational department"
                />
              )}
            />
          </div>

          {/* Phone */}
          <div>
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="phone"
                  label="Phone Number"
                  placeholder="+1 (555) 123-4567"
                  value={field.value || ''}
                  helperText="Contact phone number"
                />
              )}
            />
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 pt-6"></div>

      {/* Buttons */}
      <div className="flex justify-end space-x-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={loading}>
          {isEdit ? 'Update User' : 'Create User'}
        </Button>
      </div>
    </form>
  );
};

