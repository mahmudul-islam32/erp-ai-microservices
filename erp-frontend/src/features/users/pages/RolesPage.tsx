import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../app/store';
import { fetchRolePermissions } from '../store/usersSlice';
import { UserRole, Permission } from '../types';
import { PermissionsEditor } from '../components/PermissionsEditor';
import { usersApi } from '../services/usersApi';
import { toast } from 'sonner';

export const RolesPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { rolePermissions } = useSelector((state: RootState) => state.users);
  const { user } = useSelector((state: RootState) => state.auth);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedPermissions, setEditedPermissions] = useState<Permission[]>([]);
  const [saving, setSaving] = useState(false);
  
  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;

  useEffect(() => {
    dispatch(fetchRolePermissions());
  }, [dispatch]);

  const handleEditRole = (role: UserRole) => {
    setSelectedRole(role);
    setEditedPermissions(rolePermissions?.[role] || []);
    setEditMode(true);
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    
    try {
      setSaving(true);
      await usersApi.updateRolePermissions(selectedRole, editedPermissions);
      
      // Refresh role permissions
      await dispatch(fetchRolePermissions());
      
      toast.success(`Permissions updated for ${selectedRole.replace('_', ' ')}`);
      setEditMode(false);
      setSelectedRole(null);
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Failed to update permissions');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setSelectedRole(null);
    setEditedPermissions([]);
  };

  const getRoleDescription = (role: UserRole): string => {
    const descriptions = {
      [UserRole.SUPER_ADMIN]: 'Full system access with all permissions. Can manage all users and system settings.',
      [UserRole.ADMIN]: 'Administrative access with most permissions. Can manage users and system configurations.',
      [UserRole.MANAGER]: 'Management level access. Can oversee team operations and access relevant modules.',
      [UserRole.EMPLOYEE]: 'Standard employee access with basic operational permissions.',
      [UserRole.CUSTOMER]: 'Customer portal access with limited permissions for viewing orders and account management.',
      [UserRole.VENDOR]: 'Vendor portal access with permissions for managing inventory and orders.',
    };
    return descriptions[role];
  };

  const getRoleBadgeColor = (role: UserRole): string => {
    const colors = {
      [UserRole.SUPER_ADMIN]: 'bg-purple-100 text-purple-800 border-purple-200',
      [UserRole.ADMIN]: 'bg-blue-100 text-blue-800 border-blue-200',
      [UserRole.MANAGER]: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      [UserRole.EMPLOYEE]: 'bg-gray-100 text-gray-800 border-gray-200',
      [UserRole.CUSTOMER]: 'bg-green-100 text-green-800 border-green-200',
      [UserRole.VENDOR]: 'bg-orange-100 text-orange-800 border-orange-200',
    };
    return colors[role];
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return (
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      case UserRole.ADMIN:
        return (
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case UserRole.MANAGER:
        return (
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case UserRole.EMPLOYEE:
        return (
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case UserRole.CUSTOMER:
        return (
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case UserRole.VENDOR:
        return (
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Roles & Permissions</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage user roles and their associated permissions
        </p>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.values(UserRole).map((role) => {
          const permissions = rolePermissions?.[role] || [];
          
          return (
            <div
              key={role}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${getRoleBadgeColor(role)}`}>
                    {getRoleIcon(role)}
                  </div>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getRoleBadgeColor(role)}`}>
                    {role.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </h3>
                
                <p className="text-sm text-gray-600 mb-4">
                  {getRoleDescription(role)}
                </p>
                
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-500">Permissions</p>
                    <p className="text-2xl font-bold text-indigo-600">
                      {permissions.length}
                    </p>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => setSelectedRole(role)}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View
                    </button>
                    {isSuperAdmin && (
                      <button
                        onClick={() => handleEditRole(role)}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-indigo-600 shadow-sm text-xs font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 transition-colors"
                      >
                        <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Role Details/Edit Modal */}
      {selectedRole && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={() => !editMode && setSelectedRole(null)}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="px-6 py-5 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getRoleBadgeColor(selectedRole)}`}>
                      {getRoleIcon(selectedRole)}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {selectedRole.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </h2>
                      <p className="mt-1 text-sm text-gray-500">
                        {getRoleDescription(selectedRole)}
                      </p>
                    </div>
                    {editMode && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        Editing
                      </span>
                    )}
                  </div>
                  <button
                    onClick={editMode ? handleCancelEdit : () => setSelectedRole(null)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Permissions ({editMode ? editedPermissions.length : rolePermissions?.[selectedRole]?.length || 0})
                  </h3>
                  {!editMode && isSuperAdmin && selectedRole !== UserRole.SUPER_ADMIN && (
                    <button
                      onClick={() => {
                        setEditMode(true);
                        setEditedPermissions(rolePermissions?.[selectedRole] || []);
                      }}
                      className="inline-flex items-center px-3 py-1.5 border border-indigo-600 text-sm font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50"
                    >
                      <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Permissions
                    </button>
                  )}
                </div>

                {selectedRole === UserRole.SUPER_ADMIN && (
                  <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex">
                      <svg className="h-5 w-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-purple-800">Protected Role</h3>
                        <p className="mt-1 text-sm text-purple-700">
                          Super Admin permissions cannot be modified to prevent system lockout.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <PermissionsEditor
                  selectedPermissions={editMode ? editedPermissions : (rolePermissions?.[selectedRole] || [])}
                  onChange={setEditedPermissions}
                  readOnly={!editMode}
                />
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex justify-end space-x-3">
                  {editMode ? (
                    <>
                      <button
                        onClick={handleCancelEdit}
                        disabled={saving}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Cancel
                      </button>
                      <button
                        onClick={handleSavePermissions}
                        disabled={saving}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {saving ? (
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
                            Save Changes
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setSelectedRole(null)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Close
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permission Matrix */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-6">
          Permission Matrix
        </h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permission
                </th>
                {Object.values(UserRole).map((role) => (
                  <th
                    key={role}
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {role.replace('_', ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.values(Permission).map((permission) => (
                <tr key={permission} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {permission}
                  </td>
                  {Object.values(UserRole).map((role) => {
                    const hasPermission = rolePermissions?.[role]?.includes(permission);
                    return (
                      <td key={role} className="px-6 py-4 whitespace-nowrap text-center">
                        {hasPermission ? (
                          <svg
                            className="h-5 w-5 text-green-500 mx-auto"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="h-5 w-5 text-gray-300 mx-auto"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
