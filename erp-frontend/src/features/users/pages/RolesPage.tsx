import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../app/store';
import { fetchRolePermissions } from '../store/usersSlice';
import { UserRole, Permission } from '../types';
import { PermissionsEditor } from '../components/PermissionsEditor';

export const RolesPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { rolePermissions } = useSelector((state: RootState) => state.users);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  useEffect(() => {
    dispatch(fetchRolePermissions());
  }, [dispatch]);

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
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedRole(role)}
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
                  <p className="text-xs text-gray-500 mb-2">Permissions</p>
                  <p className="text-2xl font-bold text-indigo-600">
                    {permissions.length}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Role Details Modal */}
      {selectedRole && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black bg-opacity-25 transition-opacity"
              onClick={() => setSelectedRole(null)}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedRole.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {getRoleDescription(selectedRole)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedRole(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Assigned Permissions ({rolePermissions?.[selectedRole]?.length || 0})
                </h3>
                <PermissionsEditor
                  selectedPermissions={rolePermissions?.[selectedRole] || []}
                  onChange={() => {}}
                  readOnly={true}
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedRole(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Close
                </button>
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
