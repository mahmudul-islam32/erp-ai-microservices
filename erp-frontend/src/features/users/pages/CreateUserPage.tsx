import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppDispatch } from '../../../app/hooks';
import { createUser } from '../store/usersSlice';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { Card, CardContent, CardFooter } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Select } from '../../../shared/components/ui/Select';

const userSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  full_name: z.string().min(1, 'Full name is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.string().optional(),
  is_active: z.boolean().optional(),
});

type UserFormData = z.infer<typeof userSchema>;

export const CreateUserPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      is_active: true,
    },
  });

  const onSubmit = async (data: UserFormData) => {
    const result = await dispatch(createUser(data));
    if (createUser.fulfilled.match(result)) {
      navigate('/dashboard/users');
    }
  };

  return (
    <div>
      <PageHeader
        title="Create User"
        subtitle="Add a new user to the system"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Users', href: '/dashboard/users' },
          { label: 'Create' },
        ]}
      />

      <Card>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <Input
              label="Username"
              {...register('username')}
              error={errors.username?.message}
            />

            <Input
              label="Email"
              type="email"
              {...register('email')}
              error={errors.email?.message}
            />

            <Input
              label="Full Name"
              {...register('full_name')}
              error={errors.full_name?.message}
            />

            <Input
              label="Password"
              type="password"
              {...register('password')}
              error={errors.password?.message}
            />

            <Select
              label="Role"
              {...register('role')}
              error={errors.role?.message}
              options={[
                { value: '', label: 'Select a role' },
                { value: 'admin', label: 'Admin' },
                { value: 'manager', label: 'Manager' },
                { value: 'user', label: 'User' },
              ]}
            />

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                {...register('is_active')}
                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="is_active" className="text-sm text-slate-700">
                Active User
              </label>
            </div>
          </CardContent>

          <CardFooter align="right">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/dashboard/users')}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Create User
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
