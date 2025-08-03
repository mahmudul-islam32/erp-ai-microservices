import React from 'react';
import {
  Box,
  Title,
  Text,
  Card,
  Grid,
  Stack,
  Switch,
  Select,
  NumberInput,
  TextInput,
  Button,
  Group,
  Alert,
  Badge,
} from '@mantine/core';
import { IconSettings, IconDatabase, IconMail, IconBell, IconInfoCircle } from '@tabler/icons-react';

const SystemSettingsPage: React.FC = () => {
  return (
    <Box>
      <Stack spacing="lg">
        <Box>
          <Title order={2} mb="xs">System Settings</Title>
          <Text color="dimmed" size="sm">
            Configure global system settings and preferences
          </Text>
        </Box>

        <Alert icon={<IconInfoCircle size={16} />} title="System Configuration" color="blue">
          <Text size="sm">
            Changes to system settings may require administrator privileges and could affect all users.
            Please ensure you understand the impact before making changes.
          </Text>
        </Alert>

        <Grid>
          <Grid.Col span={12} md={6}>
            <Card shadow="sm" p="lg" radius="md" withBorder>
              <Stack spacing="md">
                <Group spacing="xs">
                  <IconSettings size={20} color="blue" />
                  <Title order={4}>General Settings</Title>
                </Group>
                
                <TextInput
                  label="Application Name"
                  description="Display name for the application"
                  value="ERP System"
                />
                
                <Select
                  label="Default Theme"
                  description="Default color scheme for new users"
                  value="light"
                  data={[
                    { value: 'light', label: 'Light Theme' },
                    { value: 'dark', label: 'Dark Theme' },
                    { value: 'auto', label: 'System Default' },
                  ]}
                />
                
                <Select
                  label="Default Language"
                  description="Default language for the application"
                  value="en"
                  data={[
                    { value: 'en', label: 'English' },
                    { value: 'es', label: 'Spanish' },
                    { value: 'fr', label: 'French' },
                    { value: 'de', label: 'German' },
                  ]}
                />
                
                <NumberInput
                  label="Session Timeout (minutes)"
                  description="Automatic logout after inactivity"
                  value={30}
                  min={5}
                  max={480}
                />
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={12} md={6}>
            <Card shadow="sm" p="lg" radius="md" withBorder>
              <Stack spacing="md">
                <Group spacing="xs">
                  <IconDatabase size={20} color="green" />
                  <Title order={4}>Database Settings</Title>
                </Group>
                
                <Switch
                  label="Enable Database Backup"
                  description="Automatic daily database backups"
                  checked={true}
                />
                
                <Select
                  label="Backup Frequency"
                  description="How often to create backups"
                  value="daily"
                  data={[
                    { value: 'hourly', label: 'Every Hour' },
                    { value: 'daily', label: 'Daily' },
                    { value: 'weekly', label: 'Weekly' },
                    { value: 'monthly', label: 'Monthly' },
                  ]}
                />
                
                <NumberInput
                  label="Backup Retention (days)"
                  description="How long to keep backup files"
                  value={30}
                  min={1}
                  max={365}
                />
                
                <Switch
                  label="Enable Query Logging"
                  description="Log database queries for debugging"
                  checked={false}
                />
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={12} md={6}>
            <Card shadow="sm" p="lg" radius="md" withBorder>
              <Stack spacing="md">
                <Group spacing="xs">
                  <IconMail size={20} color="orange" />
                  <Title order={4}>Email Settings</Title>
                </Group>
                
                <TextInput
                  label="SMTP Server"
                  description="Email server hostname"
                  placeholder="smtp.example.com"
                />
                
                <NumberInput
                  label="SMTP Port"
                  description="Email server port"
                  value={587}
                  min={25}
                  max={65535}
                />
                
                <TextInput
                  label="From Email"
                  description="Default sender email address"
                  placeholder="noreply@company.com"
                />
                
                <Switch
                  label="Enable Email Notifications"
                  description="Send system notifications via email"
                  checked={true}
                />
                
                <Switch
                  label="SSL/TLS Encryption"
                  description="Use encrypted email connection"
                  checked={true}
                />
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={12} md={6}>
            <Card shadow="sm" p="lg" radius="md" withBorder>
              <Stack spacing="md">
                <Group spacing="xs">
                  <IconBell size={20} color="purple" />
                  <Title order={4}>Notification Settings</Title>
                </Group>
                
                <Switch
                  label="In-App Notifications"
                  description="Show notifications within the application"
                  checked={true}
                />
                
                <Switch
                  label="Browser Notifications"
                  description="Show desktop/browser notifications"
                  checked={false}
                />
                
                <Switch
                  label="Email Alerts"
                  description="Send critical alerts via email"
                  checked={true}
                />
                
                <Select
                  label="Notification Retention"
                  description="How long to keep notifications"
                  value="30"
                  data={[
                    { value: '7', label: '7 days' },
                    { value: '30', label: '30 days' },
                    { value: '90', label: '90 days' },
                    { value: 'forever', label: 'Forever' },
                  ]}
                />
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>

        <Card shadow="sm" p="lg" radius="md" withBorder>
          <Stack spacing="md">
            <Title order={4}>System Status</Title>
            
            <Grid>
              <Grid.Col span={12} md={3}>
                <Group spacing="xs">
                  <Badge color="green" variant="light">Database</Badge>
                  <Text size="sm">Connected</Text>
                </Group>
              </Grid.Col>
              
              <Grid.Col span={12} md={3}>
                <Group spacing="xs">
                  <Badge color="green" variant="light">Email</Badge>
                  <Text size="sm">Configured</Text>
                </Group>
              </Grid.Col>
              
              <Grid.Col span={12} md={3}>
                <Group spacing="xs">
                  <Badge color="orange" variant="light">Backup</Badge>
                  <Text size="sm">Last: 2 hours ago</Text>
                </Group>
              </Grid.Col>
              
              <Grid.Col span={12} md={3}>
                <Group spacing="xs">
                  <Badge color="blue" variant="light">Version</Badge>
                  <Text size="sm">v1.0.0</Text>
                </Group>
              </Grid.Col>
            </Grid>
          </Stack>
        </Card>

        <Group position="right">
          <Button variant="outline">Reset to Defaults</Button>
          <Button>Save Settings</Button>
        </Group>
      </Stack>
    </Box>
  );
};

export default SystemSettingsPage;
