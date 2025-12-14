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
import {
  PageHeader,
  StatCard,
  BulkActionsBar,
  DataTableContainer,
} from '../../../shared/components/ui';
import { User, UserStatus, Permission } from '../types';
import { usersApi } from '../services/usersApi';
import { toast } from 'sonner';
import { Users, CheckCircle, Clock, XCircle, Download, Plus } from 'lucide-react';
import { usePermissions } from '../../../shared/hooks/usePermissions';
import { usePaginationSettings } from '../../../shared/hooks/usePaginationSettings';

import '@/styles/users.css';

export const UsersPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { users, loading, filters } = useSelector((state: RootState) => state.users);
  const { hasPermission } = usePermissions();
  const { defaultItemsPerPage } = usePaginationSettings();

  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>(users);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage);
  
  const canCreate = hasPermission(Permission.USER_CREATE);
  const canDelete = hasPermission(Permission.USER_DELETE);
  const canUpdate = hasPermission(Permission.USER_UPDATE);

  // Update itemsPerPage when settings change
  useEffect(() => {
    if (defaultItemsPerPage && itemsPerPage !== defaultItemsPerPage) {
      setItemsPerPage(defaultItemsPerPage);
      setCurrentPage(1);
    }
  }, [defaultItemsPerPage]);

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
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [users, filters.search, filters.department]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedUsers([]); // Clear selections when changing pages
  };

  const handleItemsPerPageChange = (perPage: number) => {
    setItemsPerPage(perPage);
    setCurrentPage(1); // Reset to first page
    setSelectedUsers([]); // Clear selections
  };

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

  // Calculate statistics
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === 'active').length;
  const pendingUsers = users.filter((u) => u.status === 'pending').length;
  const suspendedUsers = users.filter((u) => u.status === 'suspended').length;

  return (
    <div className="users-page">
      {/* Header */}
      <PageHeader
        title="Users Management"
        description="Manage user accounts, roles, and permissions"
        actions={[
          {
            label: 'Export',
            onClick: handleExport,
            variant: 'outline',
            icon: Download,
          },
          ...(canCreate ? [{
            label: 'Add User',
            onClick: () => navigate('/dashboard/users/create'),
            variant: 'primary' as const,
            icon: Plus,
          }] : []),
        ]}
        className="mb-8"
      />

      {/* Content sections with gap-6 spacing (matching dashboard card gap) */}
      <div className="flex flex-col gap-6">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Users"
            value={totalUsers}
            icon={Users}
            color="primary"
          />
          <StatCard
            title="Active"
            value={activeUsers}
            icon={CheckCircle}
            color="success"
          />
          <StatCard
            title="Pending"
            value={pendingUsers}
            icon={Clock}
            color="warning"
          />
          <StatCard
            title="Suspended"
            value={suspendedUsers}
            icon={XCircle}
            color="danger"
          />
        </div>

        {/* Filters */}
        <div>
          <UserFilters
            filters={filters}
            onFiltersChange={(newFilters) => dispatch(setFilters(newFilters))}
          />
        </div>

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <div>
            <BulkActionsBar
              selectedCount={selectedUsers.length}
              actions={[
                ...(canUpdate ? [
                  {
                    label: 'Activate',
                    onClick: () => handleBulkStatusUpdate(UserStatus.ACTIVE),
                    variant: 'default' as const,
                  },
                  {
                    label: 'Suspend',
                    onClick: () => handleBulkStatusUpdate(UserStatus.SUSPENDED),
                    variant: 'default' as const,
                  },
                ] : []),
                ...(canDelete ? [{
                  label: 'Delete',
                  onClick: handleBulkDelete,
                  variant: 'danger' as const,
                }] : []),
              ]}
              onClear={() => setSelectedUsers([])}
            />
          </div>
        )}

        {/* Users Table */}
        <DataTableContainer
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredUsers.length}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          isLoading={loading}
        >
          <UserTable
            users={paginatedUsers}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={handleView}
            selectedUsers={selectedUsers}
            onSelectionChange={setSelectedUsers}
            isLoading={loading}
          />
        </DataTableContainer>
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
