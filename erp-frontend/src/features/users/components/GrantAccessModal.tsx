import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../app/store';
import { Permission } from '../types';
import { PermissionsEditor } from './PermissionsEditor';
import { accessControlApi } from '../services/usersApi';
import { toast } from 'sonner';

interface GrantAccessModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const GrantAccessModal: React.FC<GrantAccessModalProps> = ({ onClose, onSuccess }) => {
  const { users } = useSelector((state: RootState) => state.users);
  const [selectedUser, setSelectedUser] = useState('');
  const [resource, setResource] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>([]);
  const [expiresAt, setExpiresAt] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const resources = [
    { value: 'inventory', label: 'Inventory Module', icon: '📦' },
    { value: 'sales', label: 'Sales Module', icon: '💰' },
    { value: 'finance', label: 'Finance Module', icon: '💳' },
    { value: 'hr', label: 'HR Module', icon: '👥' },
    { value: 'reports', label: 'Reports', icon: '📊' },
    { value: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser || !resource || selectedPermissions.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      await accessControlApi.grantAccess(
        selectedUser,
        resource,
        selectedPermissions,
        expiresAt || undefined,
        notes || undefined
      );
      toast.success('Access granted successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Failed to grant access');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={() => !saving && onClose()}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-100">
                  <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Grant Access</h2>
                  <p className="text-sm text-gray-500">Give user specific resource permissions</p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={saving}
                className="text-gray-400 hover:text-gray-500 disabled:opacity-50"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6">
            <div className="space-y-6">
              {/* Select User */}
              <div>
                <label htmlFor="user" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Select User <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="user"
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    required
                    className="block w-full pl-3 pr-10 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out appearance-none"
                  >
                    <option value="">Choose a user...</option>
                    {users.map((user) => (
                      <option key={user.id || user._id} value={user.id || user._id}>
                        {user.email} - {user.first_name} {user.last_name} ({user.role})
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Select Resource */}
              <div>
                <label htmlFor="resource" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Resource <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {resources.map((res) => (
                    <button
                      key={res.value}
                      type="button"
                      onClick={() => setResource(res.value)}
                      className={`p-3 border-2 rounded-lg text-left transition-all ${
                        resource === res.value
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{res.icon}</span>
                        <span className="text-sm font-medium text-gray-900">{res.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Select Permissions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Permissions <span className="text-red-500">*</span>
                </label>
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <PermissionsEditor
                    selectedPermissions={selectedPermissions}
                    onChange={setSelectedPermissions}
                    readOnly={false}
                  />
                </div>
                <p className="mt-1.5 text-xs text-gray-500">
                  Select one or more permissions to grant
                </p>
              </div>

              {/* Expiration Date (Optional) */}
              <div>
                <label htmlFor="expires_at" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Expiration Date (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="datetime-local"
                    id="expires_at"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out"
                  />
                </div>
                <p className="mt-1.5 text-xs text-gray-500">
                  Leave empty for permanent access
                </p>
              </div>

              {/* Notes (Optional) */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Add any additional notes about this access grant..."
                  className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out"
                />
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="inline-flex items-center px-5 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving || !selectedUser || !resource || selectedPermissions.length === 0}
                className="inline-flex items-center px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Granting...
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Grant Access
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

