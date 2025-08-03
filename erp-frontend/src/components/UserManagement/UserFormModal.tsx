import { useState, useEffect } from 'react';
import { 
  Modal, 
  TextInput, 
  Select, 
  Button, 
  Group, 
  Stack, 
  PasswordInput, 
  MultiSelect,
  Switch,
  Text,
  Alert,
  Divider,
  Badge
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconUser, IconLock, IconShield } from '@tabler/icons-react';
import { User, UserRole, UserStatus, Permission } from '../../types/auth';
import { UserService } from '../../services/user';
import { useAuth } from '../../context/AuthContext';

interface UserFormModalProps {
  opened: boolean;
  onClose: () => void;
  user: User | null;
  onSave: () => void;
}

interface UserFormData {
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  department: string;
  phone: string;
  status: UserStatus;
  password?: string;
  permissions: Permission[];
  send_welcome_email: boolean;
}

const UserFormModal = ({ opened, onClose, user, onSave }: UserFormModalProps) => {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const isEditing = !!user;
  const isCurrentUser = user?.id === currentUser?.id;

  // Available permissions grouped by category
  const permissionCategories = {
    'User Management': [
      Permission.CREATE_USER,
      Permission.READ_USER,
      Permission.UPDATE_USER,
      Permission.DELETE_USER,
    ],
    'System Administration': [
      Permission.MANAGE_PERMISSIONS,
      Permission.MANAGE_SYSTEM,
    ],
    'Reporting': [
      Permission.VIEW_REPORTS,
    ],
  };

  const form = useForm<UserFormData>({
    initialValues: {
      email: user?.email || '',
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      role: user?.role || UserRole.EMPLOYEE,
      department: user?.department || '',
      phone: user?.phone || '',
      status: user?.status || UserStatus.ACTIVE,
      password: '',
      permissions: user?.permissions || [],
      send_welcome_email: !isEditing,
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      first_name: (value) => (value.length > 0 ? null : 'First name is required'),
      last_name: (value) => (value.length > 0 ? null : 'Last name is required'),
      password: (value) => {
        if (!isEditing && (!value || value.length < 8)) {
          return 'Password must be at least 8 characters';
        }
        return null;
      },
    },
  });

  // Update form when user changes
  useEffect(() => {
    if (user) {
      form.setValues({
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        department: user.department || '',
        phone: user.phone || '',
        status: user.status,
        password: '',
        permissions: user.permissions,
        send_welcome_email: false,
      });
    } else {
      form.reset();
    }
  }, [user]);

  // Update permissions when role changes
  useEffect(() => {
    if (!isEditing) {
      const rolePermissions = getRoleDefaultPermissions(form.values.role);
      form.setFieldValue('permissions', rolePermissions);
    }
  }, [form.values.role, isEditing]);

  const getRoleDefaultPermissions = (role: UserRole): Permission[] => {
    switch (role) {
      case UserRole.ADMIN:
        return Object.values(Permission);
      case UserRole.MANAGER:
        return [
          Permission.READ_USER,
          Permission.UPDATE_USER,
          Permission.VIEW_REPORTS,
        ];
      case UserRole.USER:
        return [Permission.READ_USER];
      default:
        return [];
    }
  };

  const handleSubmit = async (values: UserFormData) => {
    try {
      setLoading(true);
      setError(null);

      if (isEditing && user) {
        // Update existing user
        const updateData: any = {
          first_name: values.first_name,
          last_name: values.last_name,
          department: values.department,
          phone: values.phone,
          status: values.status,
        };

        // Only admin can change roles and permissions
        if (currentUser?.role === UserRole.ADMIN) {
          updateData.role = values.role;
        }

        await UserService.updateUser(user.id, updateData);

        // Update permissions separately if admin
        if (currentUser?.role === UserRole.ADMIN && !isCurrentUser) {
          await UserService.updateUserPermissions(user.id, values.permissions);
        }

        // Change password if provided
        if (values.password) {
          // This would require a separate change password endpoint
          // For now, we'll skip this - normally you'd handle password changes separately
        }
      } else {
        // Create new user
        const createData = {
          email: values.email,
          first_name: values.first_name,
          last_name: values.last_name,
          role: values.role,
          department: values.department,
          phone: values.phone,
          status: values.status,
          password: values.password!,
        };

        const newUser = await UserService.createUser(createData);
        
        // Set permissions
        if (currentUser?.role === UserRole.ADMIN) {
          await UserService.updateUserPermissions(newUser.id, values.permissions);
        }
      }

      onSave();
      onClose();
    } catch (err: any) {
      console.error('Error saving user:', err);
      setError(err.response?.data?.detail || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  const canEditRole = () => {
    return currentUser?.role === UserRole.ADMIN && !isCurrentUser;
  };

  const canEditPermissions = () => {
    return currentUser?.role === UserRole.ADMIN && !isCurrentUser;
  };

  const canEditStatus = () => {
    return currentUser?.role === UserRole.ADMIN && !isCurrentUser;
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group>
          <IconUser size={20} />
          <Text weight={600}>
            {isEditing ? `Edit User: ${user?.first_name} ${user?.last_name}` : 'Create New User'}
          </Text>
        </Group>
      }
      size="lg"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          {error && (
            <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
              {error}
            </Alert>
          )}

          {/* Basic Information */}
          <div>
            <Text size="sm" weight={600} mb="xs">
              Basic Information
            </Text>
            <Stack spacing="sm">
              <TextInput
                label="Email"
                placeholder="user@company.com"
                {...form.getInputProps('email')}
                disabled={isEditing}
                required
              />
              
              <Group grow>
                <TextInput
                  label="First Name"
                  placeholder="John"
                  {...form.getInputProps('first_name')}
                  required
                />
                <TextInput
                  label="Last Name"
                  placeholder="Doe"
                  {...form.getInputProps('last_name')}
                  required
                />
              </Group>

              <Group grow>
                <TextInput
                  label="Department"
                  placeholder="Engineering"
                  {...form.getInputProps('department')}
                />
                <TextInput
                  label="Phone"
                  placeholder="+1 (555) 123-4567"
                  {...form.getInputProps('phone')}
                />
              </Group>
            </Stack>
          </div>

          <Divider />

          {/* Security & Access */}
          <div>
            <Group>
              <IconShield size={16} />
              <Text size="sm" weight={600}>
                Security & Access
              </Text>
            </Group>
            
            <Stack spacing="sm" mt="xs">
              {!isEditing && (
                <PasswordInput
                  label="Password"
                  placeholder="Minimum 8 characters"
                  {...form.getInputProps('password')}
                  required
                />
              )}

              <Group grow>
                <Select
                  label="Role"
                  data={[
                    { value: UserRole.USER, label: 'User' },
                    { value: UserRole.MANAGER, label: 'Manager' },
                    { value: UserRole.ADMIN, label: 'Administrator' },
                  ]}
                  {...form.getInputProps('role')}
                  disabled={!canEditRole()}
                  required
                />
                
                <Select
                  label="Status"
                  data={[
                    { value: UserStatus.ACTIVE, label: 'Active' },
                    { value: UserStatus.INACTIVE, label: 'Inactive' },
                    { value: UserStatus.PENDING, label: 'Pending' },
                  ]}
                  {...form.getInputProps('status')}
                  disabled={!canEditStatus()}
                  required
                />
              </Group>
            </Stack>
          </div>

          {/* Advanced Permissions */}
          {canEditPermissions() && (
            <>
              <Divider />
              <div>
                <Group mb="xs">
                  <IconLock size={16} />
                  <Text size="sm" weight={600}>
                    Permissions
                  </Text>
                  <Button
                    variant="subtle"
                    size="xs"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                  >
                    {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
                  </Button>
                </Group>

                {showAdvanced && (
                  <Stack spacing="sm">
                    {Object.entries(permissionCategories).map(([category, permissions]) => (
                      <div key={category}>
                        <Text size="xs" color="dimmed" mb={4}>
                          {category}
                        </Text>
                        <Group spacing="xs">
                          {permissions.map((permission) => (
                            <Badge
                              key={permission}
                              variant={form.values.permissions.includes(permission) ? 'filled' : 'outline'}
                              style={{ cursor: 'pointer' }}
                              onClick={() => {
                                const current = form.values.permissions;
                                const updated = current.includes(permission)
                                  ? current.filter(p => p !== permission)
                                  : [...current, permission];
                                form.setFieldValue('permissions', updated);
                              }}
                            >
                              {permission.replace('_', ' ').toLowerCase()}
                            </Badge>
                          ))}
                        </Group>
                      </div>
                    ))}
                  </Stack>
                )}
              </div>
            </>
          )}

          {/* Options */}
          {!isEditing && (
            <>
              <Divider />
              <Switch
                label="Send welcome email to user"
                {...form.getInputProps('send_welcome_email', { type: 'checkbox' })}
              />
            </>
          )}

          {/* Actions */}
          <Group position="right" mt="md">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {isEditing ? 'Update User' : 'Create User'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

export default UserFormModal;
