import { Card, Group, Text, ActionIcon, Stack, Badge } from '@mantine/core';
import { IconUsers, IconShield, IconKey, IconUserPlus, IconChevronRight } from '@tabler/icons-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole, Permission } from '../../types/auth';

interface UserManagementQuickActionsProps {
  onNavigateToUsers: () => void;
}

const UserManagementQuickActions = ({ onNavigateToUsers }: UserManagementQuickActionsProps) => {
  const { user } = useAuth();

  const canManageUsers = user?.permissions.includes(Permission.CREATE_USER) || 
                        user?.permissions.includes(Permission.UPDATE_USER) ||
                        user?.permissions.includes(Permission.DELETE_USER);

  const canManagePermissions = user?.permissions.includes(Permission.MANAGE_PERMISSIONS);

  if (!canManageUsers) {
    return null;
  }

  const quickActions = [
    {
      icon: IconUsers,
      title: 'User Management',
      description: 'Manage users, roles, and access levels',
      color: 'blue',
      onClick: onNavigateToUsers,
      available: canManageUsers,
    },
    {
      icon: IconUserPlus,
      title: 'Add New User',
      description: 'Create new user accounts',
      color: 'green',
      onClick: onNavigateToUsers,
      available: user?.permissions.includes(Permission.CREATE_USER),
    },
    {
      icon: IconShield,
      title: 'Role Management',
      description: 'Configure roles and permissions',
      color: 'orange',
      onClick: onNavigateToUsers,
      available: canManagePermissions,
    },
    {
      icon: IconKey,
      title: 'Security Settings',
      description: 'Password policies and security',
      color: 'red',
      onClick: onNavigateToUsers,
      available: user?.role === UserRole.ADMIN,
    },
  ];

  const availableActions = quickActions.filter(action => action.available);

  if (availableActions.length === 0) {
    return null;
  }

  return (
    <Card shadow="sm" p="md" withBorder>
      <Stack spacing="xs">
        <Group position="apart">
          <Text weight={600} size="lg">User Management</Text>
          {user?.role === UserRole.ADMIN && (
            <Badge variant="light" color="red" size="sm">Admin</Badge>
          )}
        </Group>
        
        <Text size="sm" color="dimmed" mb="md">
          Quick access to user management features
        </Text>

        {availableActions.map((action, index) => (
          <Card
            key={index}
            padding="sm"
            style={{ cursor: 'pointer', border: '1px solid #e9ecef' }}
            onClick={action.onClick}
          >
            <Group position="apart">
              <Group>
                <ActionIcon color={action.color} variant="light" size="lg">
                  <action.icon size={20} />
                </ActionIcon>
                <div>
                  <Text size="sm" weight={500}>{action.title}</Text>
                  <Text size="xs" color="dimmed">{action.description}</Text>
                </div>
              </Group>
              <ActionIcon variant="subtle" size="sm">
                <IconChevronRight size={16} />
              </ActionIcon>
            </Group>
          </Card>
        ))}
      </Stack>
    </Card>
  );
};

export default UserManagementQuickActions;
