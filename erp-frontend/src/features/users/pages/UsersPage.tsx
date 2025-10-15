import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AppDispatch, RootState } from '../../../app/store';
import {
  fetchUsers,
  deleteUser,
  bulkDeleteUsers,
  bulkUpdateUserStatus,
  setFilters,
} from '../store/usersSlice';
import { UserTable } from '../components/UserTable';
import { UserFilters } from '../components/UserFilters';
import { DeleteUserModal } from '../components/DeleteUserModal';
import { User, UserStatus } from '../types';
import { usersApi } from '../services/usersApi';
import { toast } from 'sonner';

export const UsersPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { users, loading, filters } = useSelector((state: RootState) => state.users);

  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState<User[]>(users);

  useEffect(() => {
    dispatch(fetchUsers(filters));
  }, [dispatch, filters]);

  useEffect(() => {
    // Client-side filtering for search
    let filtered = users;

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.email.toLowerCase().includes(searchLower) ||
          user.first_name.toLowerCase().includes(searchLower) ||
          user.last_name.toLowerCase().includes(searchLower)
      );
    }

    if (filters.department) {
      filtered = filtered.filter(
        (user) =>
          user.department?.toLowerCase().includes(filters.department?.toLowerCase() || '')
      );
    }

    setFilteredUsers(filtered);
  }, [users, filters.search, filters.department]);

  const handleEdit = (user: User) => {
    navigate(`/dashboard/users/${user.id || user._id}/edit`);
  };

  const handleView = (user: User) => {
    navigate(`/dashboard/users/${user.id || user._id}`);
  };

  const handleDelete = (user: User) => {
    setUserToDelete(user);
  };

  const confirmDelete = async () => {
    if (userToDelete) {
      await dispatch(deleteUser(userToDelete.id || userToDelete._id || ''));
      setUserToDelete(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedUsers.length} user(s)?`)) {
      await dispatch(bulkDeleteUsers(selectedUsers));
      setSelectedUsers([]);
    }
  };

  const handleBulkStatusUpdate = async (status: UserStatus) => {
    if (selectedUsers.length === 0) return;
    
    await dispatch(bulkUpdateUserStatus({ userIds: selectedUsers, status }));
    setSelectedUsers([]);
  };

  const handleExport = () => {
    const csv = usersApi.exportToCSV(filteredUsers);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_${new Date().toISOString()}.csv`;
    a.click();
    toast.success('Users exported successfully');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage user accounts, roles, and permissions
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleExport}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <svg
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Export
          </button>
          <button
            onClick={() => navigate('/dashboard/users/create')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <svg
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add User
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
              <svg
                className="h-6 w-6 text-indigo-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <p className="text-2xl font-semibold text-gray-900">{users.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Active</p>
              <p className="text-2xl font-semibold text-gray-900">
                {users.filter((u) => u.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
              <svg
                className="h-6 w-6 text-yellow-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-2xl font-semibold text-gray-900">
                {users.filter((u) => u.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                />
              </svg>
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Suspended</p>
              <p className="text-2xl font-semibold text-gray-900">
                {users.filter((u) => u.status === 'suspended').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <UserFilters
        filters={filters}
        onFiltersChange={(newFilters) => dispatch(setFilters(newFilters))}
      />

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-indigo-800">
              {selectedUsers.length} user(s) selected
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => handleBulkStatusUpdate(UserStatus.ACTIVE)}
                className="text-sm text-indigo-600 hover:text-indigo-900"
              >
                Activate
              </button>
              <button
                onClick={() => handleBulkStatusUpdate(UserStatus.SUSPENDED)}
                className="text-sm text-indigo-600 hover:text-indigo-900"
              >
                Suspend
              </button>
              <button
                onClick={handleBulkDelete}
                className="text-sm text-red-600 hover:text-red-900"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <UserTable
            users={filteredUsers}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={handleView}
            selectedUsers={selectedUsers}
            onSelectionChange={setSelectedUsers}
          />
        )}
      </div>

      {/* Delete Modal */}
      {userToDelete && (
        <DeleteUserModal
          user={userToDelete}
          onConfirm={confirmDelete}
          onCancel={() => setUserToDelete(null)}
          loading={loading}
        />
      )}
    </div>
  );
};
