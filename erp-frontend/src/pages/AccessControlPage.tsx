import React, { useState } from 'react';
import {
  Box,
  Title,
  Text,
  Card,
  Grid,
  Stack,
  Table,
  Button,
  Modal,
  TextInput,
  Select,
  Checkbox,
  Group,
  Badge,
  ActionIcon,
  Alert,
} from '@mantine/core';
import { IconLock, IconEdit, IconTrash, IconPlus, IconInfoCircle } from '@tabler/icons-react';
import { UserRole } from '../types/auth';

interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
}

interface RolePermission {
  role: UserRole;
  permissions: string[];
}

const AccessControlPage: React.FC = () => {
  const [modalOpened, setModalOpened] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);

  // Mock data
  const permissions: Permission[] = [
    { id: '1', name: 'View Users', description: 'Can view user list', resource: 'users', action: 'read' },
    { id: '2', name: 'Create Users', description: 'Can create new users', resource: 'users', action: 'create' },
    { id: '3', name: 'Edit Users', description: 'Can modify user details', resource: 'users', action: 'update' },
    { id: '4', name: 'Delete Users', description: 'Can delete users', resource: 'users', action: 'delete' },
    { id: '5', name: 'View Reports', description: 'Can access reports', resource: 'reports', action: 'read' },
    { id: '6', name: 'Generate Reports', description: 'Can create reports', resource: 'reports', action: 'create' },
    { id: '7', name: 'System Settings', description: 'Can modify system settings', resource: 'system', action: 'update' },
  ];

  const rolePermissions: RolePermission[] = [
    { role: UserRole.SUPER_ADMIN, permissions: ['1', '2', '3', '4', '5', '6', '7'] },
    { role: UserRole.ADMIN, permissions: ['1', '2', '3', '4', '5', '6', '7'] },
    { role: UserRole.MANAGER, permissions: ['1', '2', '3', '5', '6'] },
    { role: UserRole.EMPLOYEE, permissions: ['1', '5'] },
  ];

  const getRolePermissions = (role: UserRole) => {
    return rolePermissions.find(rp => rp.role === role)?.permissions || [];
  };

  const hasPermission = (role: UserRole, permissionId: string) => {
    return getRolePermissions(role).includes(permissionId);
  };

  const openModal = (permission?: Permission) => {
    setEditingPermission(permission || null);
    setModalOpened(true);
  };

  const closeModal = () => {
    setModalOpened(false);
    setEditingPermission(null);
  };

  return (
    <Box>
      <Stack spacing="lg">
        <Box>
          <Title order={2} mb="xs">Access Control</Title>
          <Text color="dimmed" size="sm">
            Manage role-based permissions and access control for your ERP system
          </Text>
        </Box>

        <Alert icon={<IconInfoCircle size={16} />} title="Role-Based Access Control" color="blue">
          <Text size="sm">
            Permissions are assigned to roles, and users inherit permissions based on their assigned role.
            Changes to role permissions affect all users with that role immediately.
          </Text>
        </Alert>

        <Grid>
          <Grid.Col span={12} lg={8}>
            <Card shadow="sm" p="lg" radius="md" withBorder>
              <Stack spacing="md">
                <Group position="apart">
                  <Title order={4}>Permissions Matrix</Title>
                  <Button
                    leftIcon={<IconPlus size={16} />}
                    onClick={() => openModal()}
                    size="sm"
                  >
                    Add Permission
                  </Button>
                </Group>

                <Box style={{ overflowX: 'auto' }}>
                  <Table striped highlightOnHover>
                    <thead>
                      <tr>
                        <th>Permission</th>
                        <th>Resource</th>
                        <th>Admin</th>
                        <th>Manager</th>
                        <th>User</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {permissions.map((permission) => (
                        <tr key={permission.id}>
                          <td>
                            <Box>
                              <Text weight={500} size="sm">{permission.name}</Text>
                              <Text size="xs" color="dimmed">{permission.description}</Text>
                            </Box>
                          </td>
                          <td>
                            <Badge variant="light" size="sm">
                              {permission.resource}
                            </Badge>
                          </td>
                          <td>
                            <Checkbox
                              checked={hasPermission(UserRole.ADMIN, permission.id)}
                              readOnly
                            />
                          </td>
                          <td>
                            <Checkbox
                              checked={hasPermission(UserRole.MANAGER, permission.id)}
                              readOnly
                            />
                          </td>
                          <td>
                            <Checkbox
                              checked={hasPermission(UserRole.EMPLOYEE, permission.id)}
                              readOnly
                            />
                          </td>
                          <td>
                            <Group spacing="xs">
                              <ActionIcon
                                variant="light"
                                color="blue"
                                size="sm"
                                onClick={() => openModal(permission)}
                              >
                                <IconEdit size={14} />
                              </ActionIcon>
                              <ActionIcon
                                variant="light"
                                color="red"
                                size="sm"
                              >
                                <IconTrash size={14} />
                              </ActionIcon>
                            </Group>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Box>
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={12} lg={4}>
            <Stack spacing="md">
              <Card shadow="sm" p="lg" radius="md" withBorder>
                <Stack spacing="md">
                  <Group spacing="xs">
                    <IconLock size={20} color="red" />
                    <Title order={4}>Role Summary</Title>
                  </Group>

                  <Stack spacing="sm">
                    <Box>
                      <Text weight={500} size="sm" color="red">Administrator</Text>
                      <Text size="xs" color="dimmed">
                        Full system access - {getRolePermissions(UserRole.ADMIN).length} permissions
                      </Text>
                    </Box>

                    <Box>
                      <Text weight={500} size="sm" color="blue">Manager</Text>
                      <Text size="xs" color="dimmed">
                        User management & reports - {getRolePermissions(UserRole.MANAGER).length} permissions
                      </Text>
                    </Box>

                    <Box>
                      <Text weight={500} size="sm" color="green">Employee</Text>
                      <Text size="xs" color="dimmed">
                        Basic access - {getRolePermissions(UserRole.EMPLOYEE).length} permissions
                      </Text>
                    </Box>
                  </Stack>
                </Stack>
              </Card>

              <Card shadow="sm" p="lg" radius="md" withBorder>
                <Stack spacing="md">
                  <Title order={4}>Quick Actions</Title>
                  
                  <Button variant="light" fullWidth size="sm">
                    Export Permissions
                  </Button>
                  
                  <Button variant="light" fullWidth size="sm">
                    Audit Role Changes
                  </Button>
                  
                  <Button variant="light" fullWidth size="sm">
                    Reset to Defaults
                  </Button>
                </Stack>
              </Card>
            </Stack>
          </Grid.Col>
        </Grid>

        {/* Permission Modal */}
        <Modal
          opened={modalOpened}
          onClose={closeModal}
          title={editingPermission ? 'Edit Permission' : 'Create Permission'}
          size="md"
        >
          <Stack spacing="md">
            <TextInput
              label="Permission Name"
              placeholder="Enter permission name"
              value={editingPermission?.name || ''}
              required
            />
            
            <TextInput
              label="Description"
              placeholder="Enter permission description"
              value={editingPermission?.description || ''}
              required
            />
            
            <Select
              label="Resource"
              placeholder="Select resource"
              value={editingPermission?.resource || ''}
              data={[
                { value: 'users', label: 'Users' },
                { value: 'reports', label: 'Reports' },
                { value: 'system', label: 'System' },
                { value: 'departments', label: 'Departments' },
                { value: 'calendar', label: 'Calendar' },
              ]}
              required
            />
            
            <Select
              label="Action"
              placeholder="Select action"
              value={editingPermission?.action || ''}
              data={[
                { value: 'create', label: 'Create' },
                { value: 'read', label: 'Read' },
                { value: 'update', label: 'Update' },
                { value: 'delete', label: 'Delete' },
              ]}
              required
            />
            
            <Group position="right" mt="md">
              <Button variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button onClick={closeModal}>
                {editingPermission ? 'Update' : 'Create'} Permission
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Stack>
    </Box>
  );
};

export default AccessControlPage;
