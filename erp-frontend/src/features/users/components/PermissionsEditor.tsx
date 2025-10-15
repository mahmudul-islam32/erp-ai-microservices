import React, { useState } from 'react';
import { Permission } from '../types';

interface PermissionsEditorProps {
  selectedPermissions: Permission[];
  onChange: (permissions: Permission[]) => void;
  readOnly?: boolean;
}

export const PermissionsEditor: React.FC<PermissionsEditorProps> = ({
  selectedPermissions,
  onChange,
  readOnly = false,
}) => {
  const permissionGroups = {
    'User Management': [
      Permission.USER_CREATE,
      Permission.USER_READ,
      Permission.USER_UPDATE,
      Permission.USER_DELETE,
    ],
    'Inventory Management': [
      Permission.INVENTORY_CREATE,
      Permission.INVENTORY_READ,
      Permission.INVENTORY_UPDATE,
      Permission.INVENTORY_DELETE,
    ],
    'Sales Management': [
      Permission.SALES_CREATE,
      Permission.SALES_READ,
      Permission.SALES_UPDATE,
      Permission.SALES_DELETE,
    ],
    'Finance Management': [
      Permission.FINANCE_CREATE,
      Permission.FINANCE_READ,
      Permission.FINANCE_UPDATE,
      Permission.FINANCE_DELETE,
    ],
    'HR Management': [
      Permission.HR_CREATE,
      Permission.HR_READ,
      Permission.HR_UPDATE,
      Permission.HR_DELETE,
    ],
    'AI Features': [Permission.AI_ACCESS, Permission.AI_ADMIN],
  };

  const handleTogglePermission = (permission: Permission) => {
    if (readOnly) return;
    
    if (selectedPermissions.includes(permission)) {
      onChange(selectedPermissions.filter((p) => p !== permission));
    } else {
      onChange([...selectedPermissions, permission]);
    }
  };

  const handleToggleGroup = (permissions: Permission[]) => {
    if (readOnly) return;
    
    const allSelected = permissions.every((p) => selectedPermissions.includes(p));
    
    if (allSelected) {
      onChange(selectedPermissions.filter((p) => !permissions.includes(p)));
    } else {
      const newPermissions = [...selectedPermissions];
      permissions.forEach((p) => {
        if (!newPermissions.includes(p)) {
          newPermissions.push(p);
        }
      });
      onChange(newPermissions);
    }
  };

  const formatPermissionName = (permission: Permission) => {
    return permission
      .split(':')[1]
      .replace('_', ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {Object.entries(permissionGroups).map(([groupName, permissions]) => {
        const allSelected = permissions.every((p) => selectedPermissions.includes(p));
        const someSelected = permissions.some((p) => selectedPermissions.includes(p));

        return (
          <div key={groupName} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">{groupName}</h4>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => handleToggleGroup(permissions)}
                  className="text-sm text-indigo-600 hover:text-indigo-900"
                >
                  {allSelected ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {permissions.map((permission) => (
                <div key={permission} className="flex items-center">
                  <input
                    type="checkbox"
                    id={permission}
                    checked={selectedPermissions.includes(permission)}
                    onChange={() => handleTogglePermission(permission)}
                    disabled={readOnly}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50"
                  />
                  <label
                    htmlFor={permission}
                    className={`ml-2 text-sm text-gray-700 ${
                      readOnly ? 'cursor-default' : 'cursor-pointer'
                    }`}
                  >
                    {formatPermissionName(permission)}
                  </label>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

