import React, { useState } from 'react';
import {
  Container,
  Paper,
  Title,
  Stack,
  TextInput,
  Select,
  Button,
  Group,
  Notification,
  PasswordInput,
  Textarea,
  Switch,
  Alert,
  Breadcrumbs,
  Anchor,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconCheck, IconAlertCircle, IconUser } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../types/auth';
import { useAuth } from '../context/AuthContext';

interface CreateUserFormData {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  isActive: boolean;
  department?: string;
  phone?: string;
  bio?: string;
}

export function CreateUserPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const form = useForm<CreateUserFormData>({
    initialValues: {
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      password: '',
      confirmPassword: '',
      role: UserRole.EMPLOYEE,
      isActive: true,
      department: '',
      phone: '',
      bio: '',
    },
    validate: {
      username: (value) => 
        value.length < 3 ? 'Username must be at least 3 characters' : null,
      email: (value) => 
        !/^\S+@\S+$/.test(value) ? 'Invalid email' : null,
      firstName: (value) => 
        value.length < 2 ? 'First name must be at least 2 characters' : null,
      lastName: (value) => 
        value.length < 2 ? 'Last name must be at least 2 characters' : null,
      password: (value) => 
        value.length < 8 ? 'Password must be at least 8 characters' : null,
      confirmPassword: (value, values) =>
        value !== values.password ? 'Passwords do not match' : null,
    },
  });

  const handleSubmit = async (values: CreateUserFormData) => {
    setLoading(true);
    setNotification(null);

    try {
      const response = await fetch('http://localhost:8001/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          username: values.username,
          email: values.email,
          first_name: values.firstName,
          last_name: values.lastName,
          password: values.password,
          role: values.role,
          is_active: values.isActive,
          department: values.department,
          phone: values.phone,
          bio: values.bio,
        }),
      });

      if (response.ok) {
        setNotification({
          type: 'success',
          message: 'User created successfully!',
        });
        
        // Reset form
        form.reset();
        
        // Navigate back to users page after 2 seconds
        setTimeout(() => {
          navigate('/dashboard/users');
        }, 2000);
      } else {
        const error = await response.json();
        setNotification({
          type: 'error',
          message: error.detail || 'Failed to create user',
        });
      }
    } catch (error) {
      console.error('Error creating user:', error);
      setNotification({
        type: 'error',
        message: 'Network error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    { value: UserRole.EMPLOYEE, label: 'Employee' },
    { value: UserRole.MANAGER, label: 'Manager' },
    { value: UserRole.CUSTOMER, label: 'Customer' },
    { value: UserRole.VENDOR, label: 'Vendor' },
    ...(user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN ? [
      { value: UserRole.ADMIN, label: 'Admin' }
    ] : []),
    ...(user?.role === UserRole.SUPER_ADMIN ? [
      { value: UserRole.SUPER_ADMIN, label: 'Super Admin' }
    ] : []),
  ];

  const breadcrumbItems = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'User Management', href: '/dashboard/users' },
    { title: 'Create User', href: '/dashboard/users/create' },
  ].map((item, index) => (
    <Anchor key={index} component="button" onClick={() => navigate(item.href)}>
      {item.title}
    </Anchor>
  ));

  return (
    <Container size="md" py="xl">
      <Stack spacing="lg">
        <Group position="apart" align="center">
          <div>
            <Breadcrumbs>{breadcrumbItems}</Breadcrumbs>
            <Title order={2} mt="sm">
              <Group spacing="sm">
                <IconUser size={28} />
                Create New User
              </Group>
            </Title>
          </div>
          <Button variant="outline" onClick={() => navigate('/dashboard/users')}>
            Back to Users
          </Button>
        </Group>

        {notification && (
          <Notification
            icon={notification.type === 'success' ? <IconCheck size={18} /> : <IconAlertCircle size={18} />}
            color={notification.type === 'success' ? 'green' : 'red'}
            onClose={() => setNotification(null)}
            withCloseButton
          >
            {notification.message}
          </Notification>
        )}

        <Paper p="xl" shadow="sm" radius="md">
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack spacing="lg">
              <Alert color="blue" title="User Creation Guidelines">
                Please ensure all required fields are filled correctly. The new user will receive an email with their login credentials.
              </Alert>

              <Group grow>
                <TextInput
                  label="First Name"
                  placeholder="Enter first name"
                  required
                  {...form.getInputProps('firstName')}
                />
                <TextInput
                  label="Last Name"
                  placeholder="Enter last name"
                  required
                  {...form.getInputProps('lastName')}
                />
              </Group>

              <Group grow>
                <TextInput
                  label="Username"
                  placeholder="Enter username"
                  required
                  {...form.getInputProps('username')}
                />
                <TextInput
                  label="Email"
                  placeholder="Enter email address"
                  type="email"
                  required
                  {...form.getInputProps('email')}
                />
              </Group>

              <Group grow>
                <PasswordInput
                  label="Password"
                  placeholder="Enter password"
                  required
                  {...form.getInputProps('password')}
                />
                <PasswordInput
                  label="Confirm Password"
                  placeholder="Confirm password"
                  required
                  {...form.getInputProps('confirmPassword')}
                />
              </Group>

              <Group grow>
                <Select
                  label="Role"
                  placeholder="Select user role"
                  data={roleOptions}
                  required
                  {...form.getInputProps('role')}
                />
                <TextInput
                  label="Department"
                  placeholder="Enter department (optional)"
                  {...form.getInputProps('department')}
                />
              </Group>

              <TextInput
                label="Phone Number"
                placeholder="Enter phone number (optional)"
                {...form.getInputProps('phone')}
              />

              <Textarea
                label="Bio"
                placeholder="Enter user bio (optional)"
                minRows={3}
                {...form.getInputProps('bio')}
              />

              <Switch
                label="Active User"
                description="User can log in and access the system"
                {...form.getInputProps('isActive', { type: 'checkbox' })}
              />

              <Group position="right" mt="xl">
                <Button
                  variant="outline"
                  onClick={() => navigate('/dashboard/users')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={loading}
                  leftIcon={<IconUser size={16} />}
                >
                  Create User
                </Button>
              </Group>
            </Stack>
          </form>
        </Paper>
      </Stack>
    </Container>
  );
}
