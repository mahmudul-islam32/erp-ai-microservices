import { Card, SimpleGrid, Group, Text, RingProgress, useMantineTheme, Title } from '@mantine/core';
import { IconUsers, IconUserCheck, IconUserPlus, IconUserX } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserService } from '../services/user';
import { UserRole, UserStatus } from '../types/auth';

const Dashboard = () => {
  const theme = useMantineTheme();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    newUsersThisMonth: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // In a real application, you would have an API endpoint specifically for stats
        // For now, we'll use the users endpoint and calculate stats client-side
        const response = await UserService.getUsers();
        const users = response.users;

        const activeUsers = users.filter(user => user.status === UserStatus.ACTIVE);
        const inactiveUsers = users.filter(user => user.status === UserStatus.INACTIVE);
        
        // Calculate new users this month
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const newUsers = users.filter(user => {
          const createdAt = new Date(user.created_at);
          return createdAt >= firstDayOfMonth;
        });

        setStats({
          totalUsers: users.length,
          activeUsers: activeUsers.length,
          inactiveUsers: inactiveUsers.length,
          newUsersThisMonth: newUsers.length
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Dashboard cards data
  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: <IconUsers size={28} color={theme.colors.blue[6]} />,
      color: 'blue'
    },
    {
      title: 'Active Users',
      value: stats.activeUsers,
      icon: <IconUserCheck size={28} color={theme.colors.green[6]} />,
      color: 'green'
    },
    {
      title: 'Inactive Users',
      value: stats.inactiveUsers,
      icon: <IconUserX size={28} color={theme.colors.red[6]} />,
      color: 'red'
    },
    {
      title: 'New This Month',
      value: stats.newUsersThisMonth,
      icon: <IconUserPlus size={28} color={theme.colors.violet[6]} />,
      color: 'violet'
    }
  ];

  return (
    <div>
      <Title order={2} mb={30}>Dashboard</Title>
      
      {loading ? (
        <Text>Loading dashboard data...</Text>
      ) : (
        <>
          <SimpleGrid cols={4} breakpoints={[
            { maxWidth: 'md', cols: 2 },
            { maxWidth: 'xs', cols: 1 }
          ]} mb={30}>
            {statCards.map((stat) => (
              <Card key={stat.title} shadow="sm" p="lg" radius="md" withBorder>
                <Group position="apart" mb="xs">
                  <Text weight={500}>{stat.title}</Text>
                  {stat.icon}
                </Group>
                <Text size="xl" weight={700}>{stat.value}</Text>
              </Card>
            ))}
          </SimpleGrid>

          <SimpleGrid cols={2} breakpoints={[{ maxWidth: 'sm', cols: 1 }]}>
            <Card shadow="sm" p="lg" radius="md" withBorder>
              <Title order={3} size="h4" mb="md">User Status Distribution</Title>
              <Group position="center">
                <RingProgress
                  size={200}
                  roundCaps
                  thickness={20}
                  sections={[
                    { value: (stats.activeUsers / stats.totalUsers) * 100, color: theme.colors.green[6] },
                    { value: (stats.inactiveUsers / stats.totalUsers) * 100, color: theme.colors.red[6] }
                  ]}
                  label={
                    <Text color="blue" weight={700} align="center" size="xl">
                      {stats.totalUsers}
                    </Text>
                  }
                />
                <div>
                  <Group mb="xs">
                    <div style={{ width: 12, height: 12, backgroundColor: theme.colors.green[6], borderRadius: '50%' }} />
                    <Text size="sm">Active ({Math.round((stats.activeUsers / stats.totalUsers) * 100)}%)</Text>
                  </Group>
                  <Group>
                    <div style={{ width: 12, height: 12, backgroundColor: theme.colors.red[6], borderRadius: '50%' }} />
                    <Text size="sm">Inactive ({Math.round((stats.inactiveUsers / stats.totalUsers) * 100)}%)</Text>
                  </Group>
                </div>
              </Group>
            </Card>

            <Card shadow="sm" p="lg" radius="md" withBorder>
              <Title order={3} size="h4" mb="md">Welcome, {user?.first_name}!</Title>
              <Text mb="md">
                This is your ERP dashboard where you can manage users, departments, and other system resources.
              </Text>
              <Text size="sm" color="dimmed">
                Your role: <Text component="span" color={theme.colors.blue[6]} weight={500}>{user?.role.toUpperCase()}</Text>
              </Text>
              {user?.permissions && (
                <Text size="sm" color="dimmed" mt="xs">
                  You have {user.permissions.length} permission{user.permissions.length !== 1 ? 's' : ''}
                </Text>
              )}
            </Card>
          </SimpleGrid>
        </>
      )}
    </div>
  );
};

export default Dashboard;
