import { useState, useEffect } from 'react';
import { Card, Table, Button, Group, Text, Title, Badge, ActionIcon, Modal, TextInput, Select } from '@mantine/core';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import { UserService } from '../services/user';
import { User, UserRole, UserStatus, Permission } from '../types/auth';

const UsersPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await UserService.getUsers(1, 100);
      setUsers(response.users);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setModalOpen(true);
  };

  const handleDelete = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await UserService.deleteUser(userId);
        fetchUsers();
      } catch (err) {
        console.error('Error deleting user:', err);
        setError('Failed to delete user');
      }
    }
  };

  const handleSave = async (updatedUser: User) => {
    try {
      if (selectedUser) {
        await UserService.updateUser(selectedUser.id, updatedUser);
      }
      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Failed to update user');
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'red';
      case UserRole.MANAGER:
        return 'blue';
      default:
        return 'green';
    }
  };

  const getStatusBadgeColor = (status: UserStatus) => {
    switch (status) {
      case UserStatus.ACTIVE:
        return 'green';
      case UserStatus.INACTIVE:
        return 'gray';
      case UserStatus.PENDING:
        return 'orange';
      default:
        return 'gray';
    }
  };

  const canEdit = (user: User) => {
    if (!currentUser) return false;
    if (currentUser.role === UserRole.ADMIN) return true;
    if (currentUser.role === UserRole.MANAGER && user.role !== UserRole.ADMIN) return true;
    return false;
  };

  const canDelete = (user: User) => {
    if (!currentUser) return false;
    if (currentUser.id === user.id) return false;  // Can't delete yourself
    return currentUser.role === UserRole.ADMIN;
  };

  return (
    <div>
      <Group position="apart" mb={20}>
        <Title order={2}>Users</Title>
        {currentUser?.permissions.includes(Permission.CREATE_USER) && (
          <Button onClick={() => { setSelectedUser(null); setModalOpen(true); }}>
            Add User
          </Button>
        )}
      </Group>

      {error && <Text color="red" mb={10}>{error}</Text>}

      <Card shadow="sm" p="lg">
        {loading ? (
          <Text>Loading users...</Text>
        ) : (
          <Table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.first_name} {user.last_name}</td>
                  <td>{user.email}</td>
                  <td>
                    <Badge color={getRoleBadgeColor(user.role)}>
                      {user.role}
                    </Badge>
                  </td>
                  <td>{user.department || '-'}</td>
                  <td>
                    <Badge color={getStatusBadgeColor(user.status)}>
                      {user.status}
                    </Badge>
                  </td>
                  <td>
                    <Group spacing={5}>
                      {canEdit(user) && (
                        <ActionIcon color="blue" onClick={() => handleEdit(user)}>
                          <IconEdit size={16} />
                        </ActionIcon>
                      )}
                      {canDelete(user) && (
                        <ActionIcon color="red" onClick={() => handleDelete(user.id)}>
                          <IconTrash size={16} />
                        </ActionIcon>
                      )}
                    </Group>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {/* User Edit Modal */}
      {selectedUser && (
        <Modal
          opened={modalOpen}
          onClose={() => setModalOpen(false)}
          title={selectedUser ? "Edit User" : "Add User"}
        >
          <UserForm user={selectedUser} onSave={handleSave} onCancel={() => setModalOpen(false)} />
        </Modal>
      )}
    </div>
  );
};

interface UserFormProps {
  user: User | null;
  onSave: (user: User) => void;
  onCancel: () => void;
}

const UserForm = ({ user, onSave, onCancel }: UserFormProps) => {
  const [formData, setFormData] = useState<Partial<User>>(user || {
    email: '',
    first_name: '',
    last_name: '',
    role: UserRole.USER,
    department: '',
    status: UserStatus.ACTIVE
  });

  const handleChange = (name: keyof User, value: any) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData as User);
  };

  return (
    <form onSubmit={handleSubmit}>
      <TextInput
        label="Email"
        value={formData.email || ''}
        onChange={(e) => handleChange('email', e.target.value)}
        required
        mb={10}
      />
      <TextInput
        label="First Name"
        value={formData.first_name || ''}
        onChange={(e) => handleChange('first_name', e.target.value)}
        required
        mb={10}
      />
      <TextInput
        label="Last Name"
        value={formData.last_name || ''}
        onChange={(e) => handleChange('last_name', e.target.value)}
        required
        mb={10}
      />
      <Select
        label="Role"
        data={Object.values(UserRole).map(role => ({ value: role, label: role }))}
        value={formData.role || ''}
        onChange={(value) => handleChange('role', value)}
        required
        mb={10}
      />
      <TextInput
        label="Department"
        value={formData.department || ''}
        onChange={(e) => handleChange('department', e.target.value)}
        mb={10}
      />
      <Select
        label="Status"
        data={Object.values(UserStatus).map(status => ({ value: status, label: status }))}
        value={formData.status || ''}
        onChange={(value) => handleChange('status', value as UserStatus)}
        required
        mb={20}
      />
      <Group position="right">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save</Button>
      </Group>
    </form>
  );
};

export default UsersPage;
