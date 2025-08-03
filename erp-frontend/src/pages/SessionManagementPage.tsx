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
  Badge,
  ActionIcon,
  Group,
  TextInput,
  Select,
  Alert,
  Progress,
  Tooltip,
} from '@mantine/core';
import {
  IconKey,
  IconRefresh,
  IconTrash,
  IconSearch,
  IconDeviceDesktop,
  IconDeviceMobile,
  IconBrowser,
  IconInfoCircle,
  IconShieldCheck,
  IconAlertTriangle,
} from '@tabler/icons-react';

interface ActiveSession {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  ipAddress: string;
  location: string;
  loginTime: Date;
  lastActivity: Date;
  expiresAt: Date;
  isCurrentSession: boolean;
}

const SessionManagementPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState<string>('all');

  // Mock data
  const activeSessions: ActiveSession[] = [
    {
      id: '1',
      userId: 'user1',
      userEmail: 'admin@example.com',
      userName: 'John Admin',
      deviceType: 'desktop',
      browser: 'Chrome 120.0',
      ipAddress: '192.168.1.100',
      location: 'New York, US',
      loginTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      lastActivity: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      expiresAt: new Date(Date.now() + 13 * 60 * 1000), // 13 minutes from now
      isCurrentSession: true,
    },
    {
      id: '2',
      userId: 'user2',
      userEmail: 'manager@example.com',
      userName: 'Jane Manager',
      deviceType: 'mobile',
      browser: 'Safari Mobile',
      ipAddress: '192.168.1.101',
      location: 'London, UK',
      loginTime: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      lastActivity: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
      isCurrentSession: false,
    },
    {
      id: '3',
      userId: 'user3',
      userEmail: 'user@example.com',
      userName: 'Bob User',
      deviceType: 'desktop',
      browser: 'Firefox 119.0',
      ipAddress: '192.168.1.102',
      location: 'Toronto, CA',
      loginTime: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      lastActivity: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
      expiresAt: new Date(Date.now() + 13 * 60 * 1000), // 13 minutes from now
      isCurrentSession: false,
    },
  ];

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'desktop':
        return <IconDeviceDesktop size={16} />;
      case 'mobile':
        return <IconDeviceMobile size={16} />;
      default:
        return <IconBrowser size={16} />;
    }
  };

  const getTimeRemaining = (expiresAt: Date) => {
    const now = new Date();
    const remaining = expiresAt.getTime() - now.getTime();
    const minutes = Math.max(0, Math.floor(remaining / (1000 * 60)));
    return minutes;
  };

  const getProgressColor = (minutes: number) => {
    if (minutes <= 2) return 'red';
    if (minutes <= 5) return 'orange';
    return 'green';
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m ago`;
    return `${minutes}m ago`;
  };

  const filteredSessions = activeSessions.filter(session => {
    const matchesSearch = 
      session.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.ipAddress.includes(searchTerm);
    
    const matchesFilter = 
      filterBy === 'all' ||
      (filterBy === 'current' && session.isCurrentSession) ||
      (filterBy === 'expiring' && getTimeRemaining(session.expiresAt) <= 5) ||
      (filterBy === 'desktop' && session.deviceType === 'desktop') ||
      (filterBy === 'mobile' && session.deviceType === 'mobile');
    
    return matchesSearch && matchesFilter;
  });

  return (
    <Box>
      <Stack spacing="lg">
        <Box>
          <Title order={2} mb="xs">Session Management</Title>
          <Text color="dimmed" size="sm">
            Monitor and manage active user sessions and authentication tokens
          </Text>
        </Box>

        <Grid>
          <Grid.Col span={12} md={8}>
            <Alert icon={<IconInfoCircle size={16} />} title="Session Security" color="blue" mb="lg">
              <Text size="sm">
                Sessions use secure HTTP-only cookies with automatic refresh tokens. 
                Access tokens expire in 15 minutes, refresh tokens in 7 days.
              </Text>
            </Alert>
          </Grid.Col>
          
          <Grid.Col span={12} md={4}>
            <Card shadow="sm" p="md" radius="md" withBorder>
              <Group spacing="xs" mb="xs">
                <IconShieldCheck size={20} color="green" />
                <Text size="sm" weight={500}>Security Status</Text>
              </Group>
              <Badge color="green" variant="light" size="sm">All Sessions Secure</Badge>
            </Card>
          </Grid.Col>
        </Grid>

        <Card shadow="sm" p="lg" radius="md" withBorder>
          <Stack spacing="lg">
            <Group position="apart">
              <Title order={4}>Active Sessions ({activeSessions.length})</Title>
              <Group spacing="xs">
                <Button
                  leftIcon={<IconRefresh size={16} />}
                  variant="light"
                  size="sm"
                >
                  Refresh
                </Button>
                <Button
                  leftIcon={<IconTrash size={16} />}
                  color="red"
                  variant="light"
                  size="sm"
                >
                  Revoke All
                </Button>
              </Group>
            </Group>

            <Group>
              <TextInput
                placeholder="Search by user, email, or IP..."
                icon={<IconSearch size={16} />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ flex: 1 }}
              />
              <Select
                placeholder="Filter sessions"
                value={filterBy}
                onChange={(value) => setFilterBy(value || 'all')}
                data={[
                  { value: 'all', label: 'All Sessions' },
                  { value: 'current', label: 'Current Session' },
                  { value: 'expiring', label: 'Expiring Soon' },
                  { value: 'desktop', label: 'Desktop' },
                  { value: 'mobile', label: 'Mobile' },
                ]}
                style={{ minWidth: 150 }}
              />
            </Group>

            <Box style={{ overflowX: 'auto' }}>
              <Table striped highlightOnHover>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Device</th>
                    <th>Location</th>
                    <th>Login Time</th>
                    <th>Last Activity</th>
                    <th>Token Expires</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSessions.map((session) => {
                    const timeRemaining = getTimeRemaining(session.expiresAt);
                    const progressColor = getProgressColor(timeRemaining);
                    
                    return (
                      <tr key={session.id}>
                        <td>
                          <Box>
                            <Group spacing="xs">
                              <Text size="sm" weight={500}>
                                {session.userName}
                              </Text>
                              {session.isCurrentSession && (
                                <Badge color="blue" size="xs">You</Badge>
                              )}
                            </Group>
                            <Text size="xs" color="dimmed">{session.userEmail}</Text>
                          </Box>
                        </td>
                        <td>
                          <Group spacing="xs">
                            {getDeviceIcon(session.deviceType)}
                            <Box>
                              <Text size="sm">{session.browser}</Text>
                              <Text size="xs" color="dimmed">{session.ipAddress}</Text>
                            </Box>
                          </Group>
                        </td>
                        <td>
                          <Text size="sm">{session.location}</Text>
                        </td>
                        <td>
                          <Text size="sm">{formatRelativeTime(session.loginTime)}</Text>
                        </td>
                        <td>
                          <Text size="sm">{formatRelativeTime(session.lastActivity)}</Text>
                        </td>
                        <td>
                          <Box style={{ minWidth: 120 }}>
                            <Group spacing="xs" mb={4}>
                              <Text size="sm">{timeRemaining}m</Text>
                              {timeRemaining <= 5 && (
                                <Tooltip label="Session expiring soon">
                                  <IconAlertTriangle size={14} color="orange" />
                                </Tooltip>
                              )}
                            </Group>
                            <Progress
                              value={(timeRemaining / 15) * 100}
                              color={progressColor}
                              size="xs"
                            />
                          </Box>
                        </td>
                        <td>
                          <Group spacing="xs">
                            <Tooltip label="Refresh Token">
                              <ActionIcon
                                variant="light"
                                color="blue"
                                size="sm"
                                disabled={session.isCurrentSession}
                              >
                                <IconRefresh size={14} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Revoke Session">
                              <ActionIcon
                                variant="light"
                                color="red"
                                size="sm"
                                disabled={session.isCurrentSession}
                              >
                                <IconTrash size={14} />
                              </ActionIcon>
                            </Tooltip>
                          </Group>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </Box>

            {filteredSessions.length === 0 && (
              <Text color="dimmed" ta="center" py="xl">
                No sessions found matching your criteria
              </Text>
            )}
          </Stack>
        </Card>

        <Grid>
          <Grid.Col span={12} md={4}>
            <Card shadow="sm" p="md" radius="md" withBorder>
              <Stack spacing="xs">
                <Group spacing="xs">
                  <IconKey size={16} />
                  <Text size="sm" weight={500}>Token Statistics</Text>
                </Group>
                <Text size="lg" weight={700}>{activeSessions.length}</Text>
                <Text size="xs" color="dimmed">Active Sessions</Text>
              </Stack>
            </Card>
          </Grid.Col>
          
          <Grid.Col span={12} md={4}>
            <Card shadow="sm" p="md" radius="md" withBorder>
              <Stack spacing="xs">
                <Group spacing="xs">
                  <IconAlertTriangle size={16} />
                  <Text size="sm" weight={500}>Expiring Soon</Text>
                </Group>
                <Text size="lg" weight={700} color="orange">
                  {activeSessions.filter(s => getTimeRemaining(s.expiresAt) <= 5).length}
                </Text>
                <Text size="xs" color="dimmed">Sessions ≤ 5 min</Text>
              </Stack>
            </Card>
          </Grid.Col>
          
          <Grid.Col span={12} md={4}>
            <Card shadow="sm" p="md" radius="md" withBorder>
              <Stack spacing="xs">
                <Group spacing="xs">
                  <IconDeviceMobile size={16} />
                  <Text size="sm" weight={500}>Mobile Sessions</Text>
                </Group>
                <Text size="lg" weight={700}>
                  {activeSessions.filter(s => s.deviceType === 'mobile').length}
                </Text>
                <Text size="xs" color="dimmed">Mobile Devices</Text>
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>
      </Stack>
    </Box>
  );
};

export default SessionManagementPage;
