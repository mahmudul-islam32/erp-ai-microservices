import React, { useState } from 'react';
import {
  Box,
  Title,
  Text,
  Card,
  Grid,
  Stack,
  Table,
  Badge,
  Group,
  TextInput,
  Select,
  Button,
  ActionIcon,
  Tooltip,
  Alert,
  Pagination,
} from '@mantine/core';
import {
  IconFingerprint,
  IconSearch,
  IconFilter,
  IconDownload,
  IconEye,
  IconInfoCircle,
  IconLogin,
  IconLogout,
  IconUserPlus,
  IconUserMinus,
  IconEdit,
  IconShield,
  IconAlertTriangle,
} from '@tabler/icons-react';

interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  userEmail: string;
  userName: string;
  action: string;
  resource: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'failure' | 'warning';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

const AuditLogsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Mock data
  const auditLogs: AuditLog[] = [
    {
      id: '1',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      userId: 'user1',
      userEmail: 'admin@example.com',
      userName: 'John Admin',
      action: 'User Login',
      resource: 'authentication',
      details: 'Successful login from Chrome browser',
      ipAddress: '192.168.1.100',
      userAgent: 'Chrome/120.0',
      status: 'success',
      severity: 'low',
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      userId: 'user2',
      userEmail: 'hacker@suspicious.com',
      userName: 'Unknown User',
      action: 'Failed Login',
      resource: 'authentication',
      details: 'Failed login attempt - invalid credentials',
      ipAddress: '203.0.113.45',
      userAgent: 'curl/7.68.0',
      status: 'failure',
      severity: 'high',
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      userId: 'user1',
      userEmail: 'admin@example.com',
      userName: 'John Admin',
      action: 'User Created',
      resource: 'users',
      details: 'Created new user: jane.doe@example.com',
      ipAddress: '192.168.1.100',
      userAgent: 'Chrome/120.0',
      status: 'success',
      severity: 'medium',
    },
    {
      id: '4',
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      userId: 'user3',
      userEmail: 'manager@example.com',
      userName: 'Jane Manager',
      action: 'Permission Updated',
      resource: 'access_control',
      details: 'Modified role permissions for user role',
      ipAddress: '192.168.1.101',
      userAgent: 'Firefox/119.0',
      status: 'success',
      severity: 'high',
    },
    {
      id: '5',
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
      userId: 'user1',
      userEmail: 'admin@example.com',
      userName: 'John Admin',
      action: 'System Settings',
      resource: 'system',
      details: 'Updated security policy configuration',
      ipAddress: '192.168.1.100',
      userAgent: 'Chrome/120.0',
      status: 'success',
      severity: 'critical',
    },
    {
      id: '6',
      timestamp: new Date(Date.now() - 75 * 60 * 1000),
      userId: 'user4',
      userEmail: 'user@example.com',
      userName: 'Bob User',
      action: 'Data Export',
      resource: 'reports',
      details: 'Exported user report (CSV format)',
      ipAddress: '192.168.1.102',
      userAgent: 'Chrome/120.0',
      status: 'success',
      severity: 'medium',
    },
  ];

  const getActionIcon = (action: string) => {
    if (action.includes('Login')) return <IconLogin size={16} />;
    if (action.includes('Logout')) return <IconLogout size={16} />;
    if (action.includes('Created')) return <IconUserPlus size={16} />;
    if (action.includes('Deleted')) return <IconUserMinus size={16} />;
    if (action.includes('Updated') || action.includes('Modified')) return <IconEdit size={16} />;
    if (action.includes('Failed')) return <IconAlertTriangle size={16} />;
    if (action.includes('Security') || action.includes('Permission')) return <IconShield size={16} />;
    return <IconFingerprint size={16} />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'green';
      case 'failure': return 'red';
      case 'warning': return 'orange';
      default: return 'gray';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'blue';
      case 'medium': return 'yellow';
      case 'high': return 'orange';
      case 'critical': return 'red';
      default: return 'gray';
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ipAddress.includes(searchTerm);
    
    const matchesAction = actionFilter === 'all' || log.action.toLowerCase().includes(actionFilter.toLowerCase());
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    
    return matchesSearch && matchesAction && matchesStatus;
  });

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage);

  const criticalLogs = auditLogs.filter(log => log.severity === 'critical' || log.status === 'failure');
  const recentActivity = auditLogs.filter(log => log.timestamp > new Date(Date.now() - 60 * 60 * 1000)); // Last hour

  return (
    <Box>
      <Stack spacing="lg">
        <Box>
          <Title order={2} mb="xs">Audit Logs</Title>
          <Text color="dimmed" size="sm">
            Track authentication events, user activities, and security-related actions
          </Text>
        </Box>

        {criticalLogs.length > 0 && (
          <Alert icon={<IconAlertTriangle size={16} />} title="Security Alerts" color="red">
            <Text size="sm">
              {criticalLogs.length} critical events or failures detected in the last 24 hours.
              <Button variant="subtle" size="xs" ml="xs">View Details</Button>
            </Text>
          </Alert>
        )}

        <Grid>
          <Grid.Col span={12} md={3}>
            <Card shadow="sm" p="md" radius="md" withBorder>
              <Stack spacing="xs">
                <Group spacing="xs">
                  <IconFingerprint size={16} />
                  <Text size="sm" weight={500}>Total Events</Text>
                </Group>
                <Text size="lg" weight={700}>{auditLogs.length}</Text>
                <Text size="xs" color="dimmed">Last 24 hours</Text>
              </Stack>
            </Card>
          </Grid.Col>
          
          <Grid.Col span={12} md={3}>
            <Card shadow="sm" p="md" radius="md" withBorder>
              <Stack spacing="xs">
                <Group spacing="xs">
                  <IconAlertTriangle size={16} />
                  <Text size="sm" weight={500}>Critical Events</Text>
                </Group>
                <Text size="lg" weight={700} color="red">{criticalLogs.length}</Text>
                <Text size="xs" color="dimmed">Requires attention</Text>
              </Stack>
            </Card>
          </Grid.Col>
          
          <Grid.Col span={12} md={3}>
            <Card shadow="sm" p="md" radius="md" withBorder>
              <Stack spacing="xs">
                <Group spacing="xs">
                  <IconLogin size={16} />
                  <Text size="sm" weight={500}>Recent Activity</Text>
                </Group>
                <Text size="lg" weight={700}>{recentActivity.length}</Text>
                <Text size="xs" color="dimmed">Last hour</Text>
              </Stack>
            </Card>
          </Grid.Col>
          
          <Grid.Col span={12} md={3}>
            <Card shadow="sm" p="md" radius="md" withBorder>
              <Stack spacing="xs">
                <Group spacing="xs">
                  <IconShield size={16} />
                  <Text size="sm" weight={500}>Security Score</Text>
                </Group>
                <Text size="lg" weight={700} color="green">98%</Text>
                <Text size="xs" color="dimmed">System health</Text>
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>

        <Card shadow="sm" p="lg" radius="md" withBorder>
          <Stack spacing="lg">
            <Group position="apart">
              <Title order={4}>Audit Trail</Title>
              <Group spacing="xs">
                <Button
                  leftIcon={<IconDownload size={16} />}
                  variant="light"
                  size="sm"
                >
                  Export
                </Button>
                <Button
                  leftIcon={<IconFilter size={16} />}
                  variant="light"
                  size="sm"
                >
                  Advanced Filter
                </Button>
              </Group>
            </Group>

            <Grid>
              <Grid.Col span={12} md={4}>
                <TextInput
                  placeholder="Search logs..."
                  icon={<IconSearch size={16} />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Grid.Col>
              <Grid.Col span={12} md={2}>
                <Select
                  placeholder="Action"
                  value={actionFilter}
                  onChange={(value) => setActionFilter(value || 'all')}
                  data={[
                    { value: 'all', label: 'All Actions' },
                    { value: 'login', label: 'Login Events' },
                    { value: 'user', label: 'User Management' },
                    { value: 'permission', label: 'Permissions' },
                    { value: 'system', label: 'System Changes' },
                  ]}
                />
              </Grid.Col>
              <Grid.Col span={12} md={2}>
                <Select
                  placeholder="Status"
                  value={statusFilter}
                  onChange={(value) => setStatusFilter(value || 'all')}
                  data={[
                    { value: 'all', label: 'All Status' },
                    { value: 'success', label: 'Success' },
                    { value: 'failure', label: 'Failure' },
                    { value: 'warning', label: 'Warning' },
                  ]}
                />
              </Grid.Col>
              <Grid.Col span={12} md={4}>
                <TextInput
                  placeholder="Date range filter coming soon..."
                  disabled
                />
              </Grid.Col>
            </Grid>

            <Box style={{ overflowX: 'auto' }}>
              <Table striped highlightOnHover>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Resource</th>
                    <th>Status</th>
                    <th>Severity</th>
                    <th>IP Address</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedLogs.map((log) => (
                    <tr key={log.id}>
                      <td>
                        <Text size="sm">{formatTimestamp(log.timestamp)}</Text>
                      </td>
                      <td>
                        <Box>
                          <Text size="sm" weight={500}>{log.userName}</Text>
                          <Text size="xs" color="dimmed">{log.userEmail}</Text>
                        </Box>
                      </td>
                      <td>
                        <Group spacing="xs">
                          {getActionIcon(log.action)}
                          <Text size="sm">{log.action}</Text>
                        </Group>
                      </td>
                      <td>
                        <Badge variant="light" size="sm">
                          {log.resource}
                        </Badge>
                      </td>
                      <td>
                        <Badge color={getStatusColor(log.status)} variant="light" size="sm">
                          {log.status}
                        </Badge>
                      </td>
                      <td>
                        <Badge color={getSeverityColor(log.severity)} variant="light" size="sm">
                          {log.severity}
                        </Badge>
                      </td>
                      <td>
                        <Text size="sm" style={{ fontFamily: 'monospace' }}>{log.ipAddress}</Text>
                      </td>
                      <td>
                        <Tooltip label="View Details">
                          <ActionIcon variant="light" color="blue" size="sm">
                            <IconEye size={14} />
                          </ActionIcon>
                        </Tooltip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Box>

            {displayedLogs.length === 0 && (
              <Text color="dimmed" ta="center" py="xl">
                No audit logs found matching your criteria
              </Text>
            )}

            {totalPages > 1 && (
              <Group position="center">
                <Pagination
                  value={currentPage}
                  onChange={setCurrentPage}
                  total={totalPages}
                  size="sm"
                />
              </Group>
            )}
          </Stack>
        </Card>

        <Alert icon={<IconInfoCircle size={16} />} title="Audit Log Retention" color="blue">
          <Text size="sm">
            Audit logs are retained for 90 days. Critical security events are archived for 1 year.
            Logs are automatically exported to secure storage for compliance requirements.
          </Text>
        </Alert>
      </Stack>
    </Box>
  );
};

export default AuditLogsPage;
