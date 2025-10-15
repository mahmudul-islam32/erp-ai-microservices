import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { AppDispatch, RootState } from '../../../app/store';
import { fetchUserById, updateUser } from '../store/usersSlice';
import { UserForm } from '../components/UserForm';
import { UpdateUserData } from '../types';

export const EditUserPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { selectedUser, loading } = useSelector((state: RootState) => state.users);

  useEffect(() => {
    if (id) {
      dispatch(fetchUserById(id));
    }
  }, [dispatch, id]);

  const handleSubmit = async (data: UpdateUserData) => {
    if (!id) return;
    
    const result = await dispatch(updateUser({ id, data }));
    if (updateUser.fulfilled.match(result)) {
      navigate('/dashboard/users');
    }
  };

  const handleCancel = () => {
    navigate('/dashboard/users');
  };

  if (loading && !selectedUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!selectedUser) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">User not found</p>
        <button
          onClick={() => navigate('/dashboard/users')}
          className="mt-4 text-indigo-600 hover:text-indigo-900"
        >
          Back to Users
        </button>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>
          <p className="mt-1 text-sm text-gray-500">
            Update user information and settings
          </p>
        </div>

        <UserForm
          initialData={{
            email: selectedUser.email,
            first_name: selectedUser.first_name,
            last_name: selectedUser.last_name,
            role: selectedUser.role,
            department: selectedUser.department,
            phone: selectedUser.phone,
            status: selectedUser.status,
          }}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isEdit={true}
          loading={loading}
        />
      </div>
    </div>
  );
};

