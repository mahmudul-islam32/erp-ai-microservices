import React from 'react';
import {
  SimpleGrid,
  Card,
  Text,
  ThemeIcon,
  Group,
  Badge,
  Stack,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { 
  IconUsers, 
  IconUserPlus, 
  IconUsersGroup, 
  IconShield, 
  IconLock,
  IconKey,
  IconFingerprint,
  IconArrowRight,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/auth';

interface QuickActionCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  color: string;
  roles: UserRole[];
  badge?: string;
}

export function AuthQuickActions() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const quickActions: QuickActionCard[] = [
    {
      title: 'User Management',
      description: 'View, edit, and manage user accounts',
      icon: <IconUsers size={24} />,
      path: '/dashboard/users',
      color: 'blue',
      roles: [UserRole.ADMIN, UserRole.MANAGER],
      badge: 'Core',
    },
    {
      title: 'Create User',
      description: 'Add new users to the system',
      icon: <IconUserPlus size={24} />,
      path: '/dashboard/users/create',
      color: 'green',
      roles: [UserRole.ADMIN],
      badge: 'Quick',
    },
    {
      title: 'Role Management',
      description: 'Configure roles and permissions',
      icon: <IconUsersGroup size={24} />,
      path: '/dashboard/roles',
      color: 'violet',
      roles: [UserRole.ADMIN],
      badge: 'Config',
    },
    {
      title: 'Security Settings',
      description: 'Authentication and security policies',
      icon: <IconShield size={24} />,
      path: '/dashboard/security',
      color: 'orange',
      roles: [UserRole.ADMIN],
    },
    {
      title: 'Access Control',
      description: 'Manage role-based permissions',
      icon: <IconLock size={24} />,
      path: '/dashboard/access-control',
      color: 'red',
      roles: [UserRole.ADMIN],
    },
    {
      title: 'Session Management',
      description: 'Monitor active sessions and tokens',
      icon: <IconKey size={24} />,
      path: '/dashboard/sessions',
      color: 'teal',
      roles: [UserRole.ADMIN],
    },
    {
      title: 'Audit Logs',
      description: 'View authentication and activity logs',
      icon: <IconFingerprint size={24} />,
      path: '/dashboard/audit',
      color: 'dark',
      roles: [UserRole.ADMIN, UserRole.MANAGER],
      badge: 'Monitor',
    },
  ];

  const accessibleActions = quickActions.filter(action => 
    user?.role && action.roles.includes(user.role)
  );

  return (
    <SimpleGrid 
      cols={3} 
      spacing="lg"
      breakpoints={[
        { maxWidth: 'md', cols: 2 },
        { maxWidth: 'sm', cols: 1 },
      ]}
    >
      {accessibleActions.map((action, index) => (
        <Card
          key={index}
          shadow="sm"
          p="lg"
          radius="md"
          withBorder
          style={{ cursor: 'pointer', transition: 'transform 0.2s ease' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
          }}
          onClick={() => navigate(action.path)}
        >
          <Stack spacing="sm">
            <Group position="apart">
              <ThemeIcon
                size="xl"
                radius="md"
                variant="light"
                color={action.color}
              >
                {action.icon}
              </ThemeIcon>
              {action.badge && (
                <Badge variant="light" color={action.color} size="xs">
                  {action.badge}
                </Badge>
              )}
            </Group>

            <div>
              <Text weight={500} size="lg" mb={5}>
                {action.title}
              </Text>
              <Text size="sm" color="dimmed" lineClamp={2}>
                {action.description}
              </Text>
            </div>

            <Group position="right" mt="auto">
              <Tooltip label={`Go to ${action.title}`}>
                <ActionIcon
                  variant="light"
                  color={action.color}
                  size="sm"
                >
                  <IconArrowRight size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Stack>
        </Card>
      ))}
    </SimpleGrid>
  );
}
