import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextInput, PasswordInput, Button, Group, Box, Title, Text, Alert } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useAuth } from '../context/AuthContext';
import { LoginCredentials } from '../types/auth';

const LoginPage = () => {
  const { login, error, clearError } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginCredentials>({
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value) => (value.length < 6 ? 'Password should be at least 6 characters' : null),
    },
  });

  const handleSubmit = async (values: LoginCredentials) => {
    try {
      setIsLoading(true);
      await login(values);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      // Error is already set in the auth context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 400 }} mx="auto" mt={100}>
      <Title order={1} align="center" mb={30}>
        ERP System Login
      </Title>
      
      {error && (
        <Alert color="red" mb={20} onClose={clearError} withCloseButton>
          {error}
        </Alert>
      )}
      
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <TextInput
          required
          label="Email"
          placeholder="your@email.com"
          {...form.getInputProps('email')}
          mb={16}
        />
        
        <PasswordInput
          required
          label="Password"
          placeholder="Your password"
          {...form.getInputProps('password')}
          mb={30}
        />
        
        <Group position="apart">
          <Text size="sm" color="blue" sx={{ cursor: 'pointer' }} onClick={() => navigate('/forgot-password')}>
            Forgot password?
          </Text>
          <Button type="submit" loading={isLoading}>
            Log in
          </Button>
        </Group>
      </form>
    </Box>
  );
};

export default LoginPage;
