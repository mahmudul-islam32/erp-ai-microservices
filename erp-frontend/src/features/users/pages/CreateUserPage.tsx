import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AppDispatch, RootState } from '../../../app/store';
import { createUser } from '../store/usersSlice';
import { UserForm } from '../components/UserForm';
import { CreateUserData } from '../types';

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
        <button
          onClick={() => navigate('/dashboard/users')}
          className="flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <svg
            className="h-5 w-5 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Users
        </button>
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
