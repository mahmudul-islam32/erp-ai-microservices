import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { AppDispatch, RootState } from '@/app/store';
import { UserForm } from '@/features/users/components/UserForm';
import { createUser } from '@/features/users/store/usersSlice';
import { CreateUserData } from '@/features/users/types';
import { Button } from '@/shared/components/ui/Button';

export const CreateUserPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { loading } = useSelector((state: RootState) => state.users);

  const handleSubmit = async (data: CreateUserData) => {
    const result = await dispatch(createUser(data));
    if (createUser.fulfilled.match(result)) {
      navigate('/dashboard/users');
    }
  };

  const handleCancel = () => {
    navigate('/dashboard/users');
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Button
          variant="tertiary"
          size="small"
          onClick={() => navigate('/dashboard/users')}
          leftIcon={<ArrowLeft size={16} />}
        >
          Back to Users
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Create New User</h1>
          <p className="mt-1 text-sm text-gray-500">
            Fill in the information below to create a new user account
          </p>
        </div>

        <UserForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
        />
      </div>
    </div>
  );
};
