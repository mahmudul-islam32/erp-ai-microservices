import { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Group, 
  Text, 
  Title, 
  Badge, 
  ActionIcon, 
  Modal, 
  TextInput, 
  Select,
  Stack,
  Alert,
  Tabs,
  Switch,
  PasswordInput,
  Pagination,
  Center,
  Menu,
  Paper,
  Box
} from '@mantine/core';
import { 
  IconEdit, 
  IconTrash, 
  IconSearch,
  IconFilter,
  IconShield,
  IconKey,
  IconMail,
  IconDotsVertical,
  IconUserCheck,
  IconUserX,
  IconRefresh,
  IconUsers,
  IconUserPlus
} from '@tabler/icons-react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeTab, setActiveTab] = useState('users');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false);
  const [passwordResetModalOpen, setPasswordResetModalOpen] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await UserService.getUsers(currentPage, pageSize, {
        search: searchTerm,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
      });
      setUsers(response.users);
      setTotalUsers(response.total);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = () => {
    setSelectedUser(null);
    setModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setModalOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await UserService.deleteUser(userId);
        fetchUsers();
      } catch (err) {
        console.error('Error deleting user:', err);
        setError('Failed to delete user');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedUsers.length} users? This action cannot be undone.`)) {
      try {
        await Promise.all(selectedUsers.map(id => UserService.deleteUser(id)));
        setSelectedUsers([]);
        fetchUsers();
      } catch (err) {
        console.error('Error deleting users:', err);
        setError('Failed to delete users');
      }
    }
  };

  const handleStatusChange = async (userId: string, newStatus: UserStatus) => {
    try {
      await UserService.updateUser(userId, { status: newStatus });
      fetchUsers();
    } catch (err) {
      console.error('Error updating user status:', err);
      setError('Failed to update user status');
    }
  };

  const handleManagePermissions = (user: User) => {
    setSelectedUser(user);
    setPermissionsModalOpen(true);
  };

  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    setPasswordResetModalOpen(true);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = !roleFilter || user.role === roleFilter;
    const matchesStatus = !statusFilter || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

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

  const canEditUser = (user: User) => {
    if (!currentUser) return false;
    if (currentUser.role === UserRole.ADMIN) return true;
    if (currentUser.role === UserRole.MANAGER && user.role !== UserRole.ADMIN) return true;
    return currentUser.id === user.id; // Users can edit themselves
  };

  const canDeleteUser = (user: User) => {
    if (!currentUser) return false;
    if (currentUser.id === user.id) return false; // Can't delete yourself
    return currentUser.role === UserRole.ADMIN;
  };

  const canManagePermissions = () => {
    return currentUser?.role === UserRole.ADMIN;
  };

  const getUserStats = () => {
    const activeUsers = users.filter(u => u.status === UserStatus.ACTIVE).length;
    const pendingUsers = users.filter(u => u.status === UserStatus.PENDING).length;
    const adminUsers = users.filter(u => u.role === UserRole.ADMIN).length;
    const managerUsers = users.filter(u => u.role === UserRole.MANAGER).length;

    return { activeUsers, pendingUsers, adminUsers, managerUsers };
  };

  const stats = getUserStats();

  return (
    <Box>
      {/* Header with Statistics */}
      <Group position="apart" mb="xl">
        <div>
          <Title order={2}>User Management</Title>
          <Text color="dimmed" size="sm">
            Manage users, roles, and permissions across your organization
          </Text>
        </div>
        {currentUser?.permissions.includes(Permission.CREATE_USER) && (
          <Button 
            leftIcon={<IconUserPlus size={16} />} 
            onClick={handleCreateUser}
          >
            Add User
          </Button>
        )}
      </Group>

      {/* Statistics Cards */}
      <Group mb="lg" grow>
        <Paper withBorder p="md" radius="md">
          <Group position="apart">
            <div>
              <Text color="dimmed" size="xs" transform="uppercase" weight={700}>
                Total Users
              </Text>
              <Text weight={700} size="xl">
                {users.length}
              </Text>
            </div>
            <IconUsers size={22} color="#228be6" />
          </Group>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Group position="apart">
            <div>
              <Text color="dimmed" size="xs" transform="uppercase" weight={700}>
                Active Users
              </Text>
              <Text weight={700} size="xl">
                {stats.activeUsers}
              </Text>
            </div>
            <IconUserCheck size={22} color="#51cf66" />
          </Group>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Group position="apart">
            <div>
              <Text color="dimmed" size="xs" transform="uppercase" weight={700}>
                Pending Users
              </Text>
              <Text weight={700} size="xl">
                {stats.pendingUsers}
              </Text>
            </div>
            <IconUserX size={22} color="#ffd43b" />
          </Group>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Group position="apart">
            <div>
              <Text color="dimmed" size="xs" transform="uppercase" weight={700}>
                Administrators
              </Text>
              <Text weight={700} size="xl">
                {stats.adminUsers}
              </Text>
            </div>
            <IconShield size={22} color="#f06595" />
          </Group>
        </Paper>
      </Group>

      {error && (
        <Alert color="red" mb="md" onClose={() => setError(null)} withCloseButton>
          {error}
        </Alert>
      )}

      {/* Tabs for different views */}
      <Tabs value={activeTab} onTabChange={setActiveTab} mb="md">
        <Tabs.List>
          <Tabs.Tab value="users" icon={<IconUsers size={14} />}>
            Users
          </Tabs.Tab>
          <Tabs.Tab value="roles" icon={<IconShield size={14} />}>
            Roles & Permissions
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="users" pt="lg">
          {/* Search and Filters */}
          <Paper withBorder p="md" mb="md">
            <Group>
              <TextInput
                placeholder="Search users..."
                icon={<IconSearch size={16} />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ flex: 1 }}
              />
              <Select
                placeholder="Filter by role"
                icon={<IconFilter size={16} />}
                data={[
                  { value: '', label: 'All Roles' },
                  { value: UserRole.SUPER_ADMIN, label: 'Super Administrator' },
                  { value: UserRole.ADMIN, label: 'Administrator' },
                  { value: UserRole.MANAGER, label: 'Manager' },
                  { value: UserRole.EMPLOYEE, label: 'Employee' },
                  { value: UserRole.CUSTOMER, label: 'Customer' },
                  { value: UserRole.VENDOR, label: 'Vendor' },
                ]}
                value={roleFilter}
                onChange={(value) => setRoleFilter(value || '')}
                clearable
              />
              <Select
                placeholder="Filter by status"
                icon={<IconFilter size={16} />}
                data={[
                  { value: '', label: 'All Status' },
                  { value: UserStatus.ACTIVE, label: 'Active' },
                  { value: UserStatus.INACTIVE, label: 'Inactive' },
                  { value: UserStatus.PENDING, label: 'Pending' },
                ]}
                value={statusFilter}
                onChange={(value) => setStatusFilter(value || '')}
                clearable
              />
              <Button variant="light" leftIcon={<IconRefresh size={16} />} onClick={fetchUsers}>
                Refresh
              </Button>
            </Group>
          </Paper>

          {/* Bulk Actions */}
          {selectedUsers.length > 0 && (
            <Paper withBorder p="sm" mb="md" style={{ background: '#f8f9fa' }}>
              <Group position="apart">
                <Text size="sm">
                  {selectedUsers.length} user(s) selected
                </Text>
                <Group spacing="xs">
                  <Button 
                    size="xs" 
                    color="red" 
                    variant="light"
                    onClick={handleBulkDelete}
                  >
                    Delete Selected
                  </Button>
                </Group>
              </Group>
            </Paper>
          )}

          {/* Users Table */}
          <Card shadow="sm" withBorder>
            {loading ? (
              <Center p="xl">
                <Text>Loading users...</Text>
              </Center>
            ) : filteredUsers.length === 0 ? (
              <Center p="xl">
                <Stack align="center" spacing="sm">
                  <IconUsers size={48} color="#ced4da" />
                  <Text color="dimmed">No users found</Text>
                  <Button variant="light" size="sm" onClick={() => setSearchTerm('')}>
                    Clear filters
                  </Button>
                </Stack>
              </Center>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>
                      <input 
                        type="checkbox" 
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers(filteredUsers.map(u => u.id));
                          } else {
                            setSelectedUsers([]);
                          }
                        }}
                        checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                      />
                    </th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Last Login</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <input 
                          type="checkbox" 
                          checked={selectedUsers.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers([...selectedUsers, user.id]);
                            } else {
                              setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                            }
                          }}
                        />
                      </td>
                      <td>
                        <Group spacing="sm">
                          <div>
                            <Text size="sm" weight={500}>
                              {user.first_name} {user.last_name}
                            </Text>
                            {user.id === currentUser?.id && (
                              <Badge size="xs" color="blue">You</Badge>
                            )}
                          </div>
                        </Group>
                      </td>
                      <td>
                        <Text size="sm">{user.email}</Text>
                      </td>
                      <td>
                        <Badge color={getRoleBadgeColor(user.role)} variant="light">
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Badge>
                      </td>
                      <td>
                        <Text size="sm">{user.department || '-'}</Text>
                      </td>
                      <td>
                        <Badge color={getStatusBadgeColor(user.status)} variant="light">
                          {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                        </Badge>
                      </td>
                      <td>
                        <Text size="sm" color="dimmed">
                          {user.last_login 
                            ? new Date(user.last_login).toLocaleDateString()
                            : 'Never'
                          }
                        </Text>
                      </td>
                      <td>
                        <Group spacing={4}>
                          <Menu position="bottom-end">
                            <Menu.Target>
                              <ActionIcon variant="light">
                                <IconDotsVertical size={16} />
                              </ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown>
                              {canEditUser(user) && (
                                <Menu.Item 
                                  icon={<IconEdit size={14} />}
                                  onClick={() => handleEditUser(user)}
                                >
                                  Edit User
                                </Menu.Item>
                              )}
                              
                              {canManagePermissions() && user.id !== currentUser?.id && (
                                <Menu.Item 
                                  icon={<IconShield size={14} />}
                                  onClick={() => handleManagePermissions(user)}
                                >
                                  Manage Permissions
                                </Menu.Item>
                              )}

                              {canManagePermissions() && user.id !== currentUser?.id && (
                                <Menu.Item 
                                  icon={<IconKey size={14} />}
                                  onClick={() => handleResetPassword(user)}
                                >
                                  Reset Password
                                </Menu.Item>
                              )}

                              {canManagePermissions() && user.id !== currentUser?.id && (
                                <Menu.Item 
                                  icon={<IconMail size={14} />}
                                >
                                  Send Welcome Email
                                </Menu.Item>
                              )}

                              <Menu.Divider />

                              {canManagePermissions() && user.id !== currentUser?.id && (
                                <>
                                  <Menu.Item 
                                    icon={<IconUserCheck size={14} />}
                                    onClick={() => handleStatusChange(user.id, UserStatus.ACTIVE)}
                                    disabled={user.status === UserStatus.ACTIVE}
                                  >
                                    Activate User
                                  </Menu.Item>
                                  <Menu.Item 
                                    icon={<IconUserX size={14} />}
                                    onClick={() => handleStatusChange(user.id, UserStatus.INACTIVE)}
                                    disabled={user.status === UserStatus.INACTIVE}
                                  >
                                    Deactivate User
                                  </Menu.Item>
                                </>
                              )}

                              {canDeleteUser(user) && (
                                <>
                                  <Menu.Divider />
                                  <Menu.Item 
                                    color="red"
                                    icon={<IconTrash size={14} />}
                                    onClick={() => handleDeleteUser(user.id)}
                                  >
                                    Delete User
                                  </Menu.Item>
                                </>
                              )}
                            </Menu.Dropdown>
                          </Menu>
                        </Group>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>

          {/* Pagination */}
          {totalUsers > pageSize && (
            <Center mt="lg">
              <Pagination
                value={currentPage}
                onChange={setCurrentPage}
                total={Math.ceil(totalUsers / pageSize)}
              />
            </Center>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="roles" pt="lg">
          <RolePermissionManager />
        </Tabs.Panel>
      </Tabs>

      {/* User Create/Edit Modal */}
      <UserFormModal
        opened={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onSave={fetchUsers}
      />

      {/* Permissions Management Modal */}
      <PermissionsModal
        opened={permissionsModalOpen}
        onClose={() => {
          setPermissionsModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onSave={fetchUsers}
      />

      {/* Password Reset Modal */}
      <PasswordResetModal
        opened={passwordResetModalOpen}
        onClose={() => {
          setPasswordResetModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
      />
    </Box>
  );
};

// User Form Modal Component
interface UserFormModalProps {
  opened: boolean;
  onClose: () => void;
  user: User | null;
  onSave: () => void;
}

const UserFormModal = ({ opened, onClose, user, onSave }: UserFormModalProps) => {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: UserRole.EMPLOYEE,
    department: '',
    phone: '',
    status: UserStatus.ACTIVE,
    password: '',
  });

  const isEditing = !!user;

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        department: user.department || '',
        phone: user.phone || '',
        status: user.status,
        password: '',
      });
    } else {
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        role: UserRole.EMPLOYEE,
        department: '',
        phone: '',
        status: UserStatus.ACTIVE,
        password: '',
      });
    }
    setError(null);
  }, [user, opened]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isEditing && user) {
        const updateData = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          department: formData.department,
          phone: formData.phone,
          status: formData.status,
          ...(currentUser?.role === UserRole.ADMIN && { role: formData.role }),
        };
        await UserService.updateUser(user.id, updateData);
      } else {
        await UserService.createUser({ ...formData });
      }
      onSave();
      onClose();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save user';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isEditing ? `Edit User` : 'Create New User'}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <Stack>
          {error && <Alert color="red">{error}</Alert>}
          <TextInput
            label="Email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            disabled={isEditing}
            required
          />
          <Group grow>
            <TextInput
              label="First Name"
              value={formData.first_name}
              onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
              required
            />
            <TextInput
              label="Last Name"
              value={formData.last_name}
              onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
              required
            />
          </Group>
          {!isEditing && (
            <PasswordInput
              label="Password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              required
            />
          )}
          <Group grow>
            <Select
              label="Role"
              data={Object.values(UserRole).map(role => ({ value: role, label: role }))}
              value={formData.role}
              onChange={(value) => setFormData(prev => ({ ...prev, role: value as UserRole }))}
              disabled={currentUser?.role !== UserRole.ADMIN}
            />
            <Select
              label="Status"
              data={Object.values(UserStatus).map(status => ({ value: status, label: status }))}
              value={formData.status}
              onChange={(value) => setFormData(prev => ({ ...prev, status: value as UserStatus }))}
            />
          </Group>
          <Group position="right">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

// Permissions Modal Component
const PermissionsModal = ({ opened, onClose, user, onSave }: { opened: boolean; onClose: () => void; user: User | null; onSave: () => void }) => {
  const [permissions, setPermissions] = useState<Permission[]>([]);

  useEffect(() => {
    if (user) setPermissions(user.permissions);
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await UserService.updateUserPermissions(user.id, permissions);
      onSave();
      onClose();
    } catch (err) {
      console.error('Error updating permissions:', err);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Manage Permissions" size="lg">
      <form onSubmit={handleSubmit}>
        <Stack>
          {Object.values(Permission).map((permission) => (
            <Switch
              key={permission}
              label={permission.replace('_', ' ')}
              checked={permissions.includes(permission)}
              onChange={(e) => {
                if (e.target.checked) {
                  setPermissions([...permissions, permission]);
                } else {
                  setPermissions(permissions.filter(p => p !== permission));
                }
              }}
            />
          ))}
          <Group position="right">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Update Permissions</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

// Password Reset Modal Component
const PasswordResetModal = ({ opened, onClose, user }: { opened: boolean; onClose: () => void; user: User | null }) => {
  const [newPassword, setNewPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Reset password for', user?.email, 'to', newPassword);
    onClose();
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Reset Password">
      <form onSubmit={handleSubmit}>
        <Stack>
          <PasswordInput
            label="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <Group position="right">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Reset Password</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

// Role Permission Manager Component
const RolePermissionManager = () => {
  return (
    <Stack>
      <Title order={3}>Role & Permission Management</Title>
      <Text color="dimmed">Configure default permissions for each role.</Text>
      <Alert color="blue" variant="light">
        Role management features will be implemented here.
      </Alert>
    </Stack>
  );
};

export default UsersPage;
