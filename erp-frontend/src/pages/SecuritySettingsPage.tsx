import React from 'react';
import {
  Box,
  Title,
  Text,
  Card,
  Grid,
  Stack,
  Switch,
  NumberInput,
  Select,
  Button,
  Alert,
  Badge,
  Group,
} from '@mantine/core';
import { IconShield, IconLock, IconClock, IconInfoCircle } from '@tabler/icons-react';

const SecuritySettingsPage: React.FC = () => {
  return (
    <Box>
      <Stack spacing="lg">
        <Box>
          <Title order={2} mb="xs">Security Settings</Title>
          <Text color="dimmed" size="sm">
            Configure authentication policies and security measures for your ERP system
          </Text>
        </Box>

        <Grid>
          <Grid.Col span={12} md={6}>
            <Card shadow="sm" p="lg" radius="md" withBorder>
              <Stack spacing="md">
                <Group spacing="xs">
                  <IconLock size={20} color="blue" />
                  <Title order={4}>Password Policy</Title>
                </Group>
                
                <NumberInput
                  label="Minimum Password Length"
                  description="Minimum number of characters required"
                  value={8}
                  min={6}
                  max={128}
                />
                
                <Switch
                  label="Require Uppercase Letters"
                  description="Password must contain at least one uppercase letter"
                  checked={true}
                />
                
                <Switch
                  label="Require Numbers"
                  description="Password must contain at least one number"
                  checked={true}
                />
                
                <Switch
                  label="Require Special Characters"
                  description="Password must contain at least one special character"
                  checked={true}
                />
                
                <NumberInput
                  label="Password Expiry (days)"
                  description="Number of days before password expires (0 = never)"
                  value={90}
                  min={0}
                  max={365}
                />
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={12} md={6}>
            <Card shadow="sm" p="lg" radius="md" withBorder>
              <Stack spacing="md">
                <Group spacing="xs">
                  <IconClock size={20} color="green" />
                  <Title order={4}>Session Management</Title>
                </Group>
                
                <NumberInput
                  label="Access Token Expiry (minutes)"
                  description="How long access tokens remain valid"
                  value={15}
                  min={5}
                  max={1440}
                />
                
                <NumberInput
                  label="Refresh Token Expiry (days)"
                  description="How long refresh tokens remain valid"
                  value={7}
                  min={1}
                  max={30}
                />
                
                <NumberInput
                  label="Max Failed Login Attempts"
                  description="Account lockout after this many failed attempts"
                  value={5}
                  min={3}
                  max={10}
                />
                
                <NumberInput
                  label="Account Lockout Duration (minutes)"
                  description="How long accounts stay locked after failed attempts"
                  value={30}
                  min={5}
                  max={1440}
                />
                
                <Switch
                  label="Force Logout on Password Change"
                  description="Invalidate all sessions when user changes password"
                  checked={true}
                />
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={12}>
            <Card shadow="sm" p="lg" radius="md" withBorder>
              <Stack spacing="md">
                <Group spacing="xs">
                  <IconShield size={20} color="orange" />
                  <Title order={4}>Security Features</Title>
                </Group>
                
                <Grid>
                  <Grid.Col span={12} md={6}>
                    <Switch
                      label="Two-Factor Authentication"
                      description="Require 2FA for admin accounts"
                      checked={false}
                    />
                  </Grid.Col>
                  
                  <Grid.Col span={12} md={6}>
                    <Switch
                      label="IP Whitelist"
                      description="Restrict access to specific IP addresses"
                      checked={false}
                    />
                  </Grid.Col>
                  
                  <Grid.Col span={12} md={6}>
                    <Switch
                      label="Remember Device"
                      description="Allow users to mark devices as trusted"
                      checked={true}
                    />
                  </Grid.Col>
                  
                  <Grid.Col span={12} md={6}>
                    <Switch
                      label="Email Notifications"
                      description="Send security alerts via email"
                      checked={true}
                    />
                  </Grid.Col>
                </Grid>
                
                <Select
                  label="Cookie Security Level"
                  description="Security settings for authentication cookies"
                  value="strict"
                  data={[
                    { value: 'strict', label: 'Strict (HTTPS only, SameSite=Strict)' },
                    { value: 'secure', label: 'Secure (HTTPS only, SameSite=Lax)' },
                    { value: 'standard', label: 'Standard (SameSite=Lax)' },
                  ]}
                />
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>

        <Alert icon={<IconInfoCircle size={16} />} title="Current Security Status" color="green">
          <Group spacing="xs">
            <Badge color="green" variant="light">Secure Cookies Enabled</Badge>
            <Badge color="green" variant="light">HTTPS Enforced</Badge>
            <Badge color="blue" variant="light">Role-Based Access Control</Badge>
            <Badge color="orange" variant="light">2FA Available</Badge>
          </Group>
        </Alert>

        <Group position="right">
          <Button variant="outline">Reset to Defaults</Button>
          <Button>Save Security Settings</Button>
        </Group>
      </Stack>
    </Box>
  );
};

export default SecuritySettingsPage;
