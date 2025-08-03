import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Title,
  Stack,
  Badge,
  Button,
  Group,
  Modal,
  TextInput,
  Textarea,
  Checkbox,
  ActionIcon,
  Tooltip,
  Breadcrumbs,
  Anchor,
  Text,
  Card,
  SimpleGrid,
  ThemeIcon,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { 
  IconUsersGroup, 
  IconEdit, 
  IconTrash, 
  IconPlus, 
  IconShield,
  IconEye,
  IconSettings,
  IconDatabase,
  IconUsers,
  IconFileText,
  IconCurrencyDollar,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  userCount: number;
  isSystemRole: boolean;
}

const AVAILABLE_PERMISSIONS: Permission[] = [
  // User Management
  { id: 'users:read', name: 'View Users', description: 'Can view user profiles and information', category: 'User Management' },
  { id: 'users:create', name: 'Create Users', description: 'Can create new user accounts', category: 'User Management' },
  { id: 'users:update', name: 'Edit Users', description: 'Can modify user profiles and settings', category: 'User Management' },
  { id: 'users:delete', name: 'Delete Users', description: 'Can remove user accounts', category: 'User Management' },
  
  // Role Management
  { id: 'roles:read', name: 'View Roles', description: 'Can view role configurations', category: 'Role Management' },
  { id: 'roles:create', name: 'Create Roles', description: 'Can create new roles', category: 'Role Management' },
  { id: 'roles:update', name: 'Edit Roles', description: 'Can modify role permissions', category: 'Role Management' },
  { id: 'roles:delete', name: 'Delete Roles', description: 'Can remove roles', category: 'Role Management' },
  
  // System Settings
  { id: 'settings:read', name: 'View Settings', description: 'Can view system configurations', category: 'System Settings' },
  { id: 'settings:update', name: 'Update Settings', description: 'Can modify system settings', category: 'System Settings' },
  
  // Reports & Analytics
  { id: 'reports:read', name: 'View Reports', description: 'Can access reports and analytics', category: 'Reports & Analytics' },
  { id: 'reports:create', name: 'Create Reports', description: 'Can generate new reports', category: 'Reports & Analytics' },
  
  // Financial Management
  { id: 'finance:read', name: 'View Financial Data', description: 'Can view financial information', category: 'Financial Management' },
  { id: 'finance:create', name: 'Create Financial Records', description: 'Can create financial entries', category: 'Financial Management' },
  { id: 'finance:update', name: 'Edit Financial Data', description: 'Can modify financial records', category: 'Financial Management' },
];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'User Management': <IconUsers size={20} />,
  'Role Management': <IconUsersGroup size={20} />,
  'System Settings': <IconSettings size={20} />,
  'Reports & Analytics': <IconFileText size={20} />,
  'Financial Management': <IconCurrencyDollar size={20} />,
};

export function RoleManagementPage() {
  const navigate = useNavigate();
  const [roles, setRoles] = useState<Role[]>([]);
  const [modalOpened, setModalOpened] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const form = useForm({
    initialValues: {
      name: '',
      description: '',
      permissions: [] as string[],
    },
    validate: {
      name: (value) => value.length < 2 ? 'Role name must be at least 2 characters' : null,
      description: (value) => value.length < 10 ? 'Description must be at least 10 characters' : null,
    },
  });

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      // Mock data for demonstration
      setRoles([
        {
          id: '1',
          name: 'Administrator',
          description: 'Full system access with all permissions',
          permissions: AVAILABLE_PERMISSIONS,
          userCount: 2,
          isSystemRole: true,
        },
        {
          id: '2',
          name: 'Manager',
          description: 'Management level access with user and report permissions',
          permissions: AVAILABLE_PERMISSIONS.filter(p => 
            p.category === 'User Management' || 
            p.category === 'Reports & Analytics' ||
            (p.category === 'Financial Management' && p.id !== 'finance:update')
          ),
          userCount: 5,
          isSystemRole: true,
        },
        {
          id: '3',
          name: 'User',
          description: 'Basic user access with read-only permissions',
          permissions: AVAILABLE_PERMISSIONS.filter(p => p.id.includes(':read')),
          userCount: 15,
          isSystemRole: true,
        },
      ]);
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  };

  const handleCreateRole = () => {
    setEditingRole(null);
    setSelectedPermissions([]);
    form.reset();
    setModalOpened(true);
  };

  const handleEditRole = (role: Role) => {
    if (role.isSystemRole) return; // Prevent editing system roles
    
    setEditingRole(role);
    setSelectedPermissions(role.permissions.map(p => p.id));
    form.setValues({
      name: role.name,
      description: role.description,
      permissions: role.permissions.map(p => p.id),
    });
    setModalOpened(true);
  };

  const handleDeleteRole = async (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (role?.isSystemRole) return; // Prevent deleting system roles
    
    if (confirm('Are you sure you want to delete this role?')) {
      setRoles(roles.filter(r => r.id !== roleId));
    }
  };

  const handlePermissionToggle = (permissionId: string) => {
    const newPermissions = selectedPermissions.includes(permissionId)
      ? selectedPermissions.filter(id => id !== permissionId)
      : [...selectedPermissions, permissionId];
    
    setSelectedPermissions(newPermissions);
    form.setFieldValue('permissions', newPermissions);
  };

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const roleData = {
        ...values,
        permissions: AVAILABLE_PERMISSIONS.filter(p => selectedPermissions.includes(p.id)),
      };

      if (editingRole) {
        // Update existing role
        setRoles(roles.map(role => 
          role.id === editingRole.id 
            ? { ...role, ...roleData }
            : role
        ));
      } else {
        // Create new role
        const newRole: Role = {
          id: Date.now().toString(),
          ...roleData,
          userCount: 0,
          isSystemRole: false,
        };
        setRoles([...roles, newRole]);
      }

      setModalOpened(false);
      form.reset();
      setSelectedPermissions([]);
    } catch (error) {
      console.error('Error saving role:', error);
    }
  };

  const breadcrumbItems = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Role Management', href: '/dashboard/roles' },
  ].map((item, index) => (
    <Anchor key={index} component="button" onClick={() => navigate(item.href)}>
      {item.title}
    </Anchor>
  ));

  const groupedPermissions = AVAILABLE_PERMISSIONS.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <Container size="xl" py="xl">
      <Stack spacing="lg">
        <Group position="apart" align="center">
          <div>
            <Breadcrumbs>{breadcrumbItems}</Breadcrumbs>
            <Title order={2} mt="sm">
              <Group spacing="sm">
                <IconUsersGroup size={28} />
                Role Management
              </Group>
            </Title>
            <Text color="dimmed" size="sm" mt="xs">
              Configure roles and permissions for your organization
            </Text>
          </div>
          <Button leftIcon={<IconPlus size={16} />} onClick={handleCreateRole}>
            Create Role
          </Button>
        </Group>

        <SimpleGrid cols={3} spacing="lg" breakpoints={[{ maxWidth: 'md', cols: 1 }]}>
          {roles.map(role => (
            <Card key={role.id} shadow="sm" p="lg" radius="md" withBorder>
              <Stack spacing="sm">
                <Group position="apart">
                  <Group spacing="xs">
                    <ThemeIcon size="lg" radius="md" variant="light">
                      <IconShield size={20} />
                    </ThemeIcon>
                    <div>
                      <Text weight={500}>{role.name}</Text>
                      <Text size="xs" color="dimmed">{role.userCount} users</Text>
                    </div>
                  </Group>
                  {role.isSystemRole && (
                    <Badge color="blue" variant="light" size="xs">
                      System
                    </Badge>
                  )}
                </Group>

                <Text size="sm" color="dimmed" lineClamp={2}>
                  {role.description}
                </Text>

                <Text size="xs" color="dimmed">
                  {role.permissions.length} permissions
                </Text>

                <Group position="right" spacing="xs">
                  <Tooltip label="View Details">
                    <ActionIcon size="sm" variant="light">
                      <IconEye size={16} />
                    </ActionIcon>
                  </Tooltip>
                  {!role.isSystemRole && (
                    <>
                      <Tooltip label="Edit Role">
                        <ActionIcon 
                          size="sm" 
                          variant="light" 
                          color="blue"
                          onClick={() => handleEditRole(role)}
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Delete Role">
                        <ActionIcon 
                          size="sm" 
                          variant="light" 
                          color="red"
                          onClick={() => handleDeleteRole(role.id)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </>
                  )}
                </Group>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>

        <Modal
          opened={modalOpened}
          onClose={() => setModalOpened(false)}
          title={editingRole ? 'Edit Role' : 'Create New Role'}
          size="xl"
        >
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack spacing="lg">
              <TextInput
                label="Role Name"
                placeholder="Enter role name"
                required
                {...form.getInputProps('name')}
              />

              <Textarea
                label="Description"
                placeholder="Enter role description"
                required
                minRows={3}
                {...form.getInputProps('description')}
              />

              <div>
                <Text weight={500} size="sm" mb="md">
                  Permissions
                </Text>
                <Stack spacing="lg">
                  {Object.entries(groupedPermissions).map(([category, permissions]) => (
                    <Paper key={category} p="md" withBorder>
                      <Group spacing="sm" mb="sm">
                        <ThemeIcon size="sm" variant="light">
                          {CATEGORY_ICONS[category] || <IconDatabase size={16} />}
                        </ThemeIcon>
                        <Text weight={500} size="sm">
                          {category}
                        </Text>
                      </Group>
                      <Stack spacing="xs">
                        {permissions.map(permission => (
                          <Checkbox
                            key={permission.id}
                            label={
                              <div>
                                <Text size="sm">{permission.name}</Text>
                                <Text size="xs" color="dimmed">
                                  {permission.description}
                                </Text>
                              </div>
                            }
                            checked={selectedPermissions.includes(permission.id)}
                            onChange={() => handlePermissionToggle(permission.id)}
                          />
                        ))}
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </div>

              <Group position="right" mt="xl">
                <Button variant="outline" onClick={() => setModalOpened(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingRole ? 'Update Role' : 'Create Role'}
                </Button>
              </Group>
            </Stack>
          </form>
        </Modal>
      </Stack>
    </Container>
  );
}
