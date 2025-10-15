import React, { useEffect, useState } from 'react';
import { securityApi } from '../services/usersApi';
import { SecuritySettings } from '../types';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

export const SecurityPage: React.FC = () => {
  const [settings, setSettings] = useState<SecuritySettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<SecuritySettings>();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await securityApi.getSettings();
      setSettings(data);
      reset(data);
    } catch (error) {
      toast.error('Failed to load security settings');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: SecuritySettings) => {
    setSaving(true);
    try {
      const updated = await securityApi.updateSettings(data);
      setSettings(updated);
      reset(updated);
      toast.success('Security settings updated successfully');
    } catch (error) {
      toast.error('Failed to update security settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Security Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure system-wide security policies and authentication settings
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Password Policy */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Password Policy</h3>
            <p className="mt-1 text-sm text-gray-500">
              Configure password requirements for user accounts
            </p>
          </div>
          <div className="px-6 py-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Minimum Password Length
                </label>
                <input
                  type="number"
                  {...register('password_min_length', {
                    required: 'Minimum length is required',
                    min: { value: 6, message: 'Minimum length must be at least 6' },
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                {errors.password_min_length && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.password_min_length.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Password Expiry (days)
                </label>
                <input
                  type="number"
                  {...register('password_expiry_days', {
                    required: 'Password expiry is required',
                    min: { value: 0, message: 'Must be at least 0 (0 = never)' },
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                {errors.password_expiry_days && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.password_expiry_days.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="require_uppercase"
                  {...register('password_require_uppercase')}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="require_uppercase"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Require uppercase letters
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="require_lowercase"
                  {...register('password_require_lowercase')}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="require_lowercase"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Require lowercase letters
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="require_numbers"
                  {...register('password_require_numbers')}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="require_numbers"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Require numbers
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="require_special"
                  {...register('password_require_special')}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="require_special"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Require special characters (!@#$%^&*)
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Login Security */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Login Security</h3>
            <p className="mt-1 text-sm text-gray-500">
              Configure login attempt policies and account lockout settings
            </p>
          </div>
          <div className="px-6 py-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Max Login Attempts
                </label>
                <input
                  type="number"
                  {...register('max_login_attempts', {
                    required: 'Max attempts is required',
                    min: { value: 1, message: 'Must be at least 1' },
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                {errors.max_login_attempts && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.max_login_attempts.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Lockout Duration (minutes)
                </label>
                <input
                  type="number"
                  {...register('lockout_duration_minutes', {
                    required: 'Lockout duration is required',
                    min: { value: 1, message: 'Must be at least 1' },
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                {errors.lockout_duration_minutes && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.lockout_duration_minutes.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Session Management */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Session Management</h3>
            <p className="mt-1 text-sm text-gray-500">
              Configure session timeout and multi-device login settings
            </p>
          </div>
          <div className="px-6 py-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Session Timeout (minutes)
              </label>
              <input
                type="number"
                {...register('session_timeout_minutes', {
                  required: 'Session timeout is required',
                  min: { value: 5, message: 'Must be at least 5 minutes' },
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              {errors.session_timeout_minutes && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.session_timeout_minutes.message}
                </p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Users will be logged out after this period of inactivity
              </p>
            </div>
          </div>
        </div>

        {/* Advanced Security */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Advanced Security</h3>
            <p className="mt-1 text-sm text-gray-500">
              Configure advanced security features and access controls
            </p>
          </div>
          <div className="px-6 py-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-900">
                  Two-Factor Authentication (2FA)
                </label>
                <p className="text-sm text-gray-500">
                  Require users to use 2FA for enhanced security
                </p>
              </div>
              <input
                type="checkbox"
                {...register('enable_2fa')}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-900">
                  IP Whitelist
                </label>
                <p className="text-sm text-gray-500">
                  Only allow access from whitelisted IP addresses
                </p>
              </div>
              <input
                type="checkbox"
                {...register('enable_ip_whitelist')}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => reset(settings || undefined)}
            disabled={!isDirty || saving}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={!isDirty || saving}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};
