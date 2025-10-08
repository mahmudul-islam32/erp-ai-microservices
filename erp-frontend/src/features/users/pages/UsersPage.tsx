import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Trash2, Edit } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { fetchUsers, deleteUser } from '../store/usersSlice';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { Card } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Table, Column } from '../../../shared/components/ui/Table';
import { Badge } from '../../../shared/components/ui/Badge';

export const UsersPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { users, isLoading } = useAppSelector((state) => state.users);
  const [search, setSearch] = useState('');

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      await dispatch(deleteUser(id));
    }
  };

  const columns: Column<any>[] = [
    { key: 'username', header: 'Username' },
    { key: 'full_name', header: 'Full Name' },
    { key: 'email', header: 'Email' },
    {
      key: 'is_active',
      header: 'Status',
      render: (user) => (
        <Badge variant={user.is_active ? 'success' : 'danger'}>
          {user.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'is_superuser',
      header: 'Role',
      render: (user) => (
        <Badge variant={user.is_superuser ? 'primary' : 'default'}>
          {user.is_superuser ? 'Admin' : user.role || 'User'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (user) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Edit className="h-3 w-3" />}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/dashboard/users/${user.id}/edit`);
            }}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="danger"
            leftIcon={<Trash2 className="h-3 w-3" />}
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(user.id);
            }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const filteredUsers = users.filter(
    (user) =>
      user.username?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="Manage system users and their permissions"
        actions={
          <Button
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => navigate('/dashboard/users/create')}
          >
            Add User
          </Button>
        }
      />

      <Card>
        <div className="p-4 border-b border-slate-200">
          <Input
            placeholder="Search users..."
            leftIcon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Table
          data={filteredUsers}
          columns={columns}
          isLoading={isLoading}
          emptyMessage="No users found"
        />
      </Card>
    </div>
  );
};
