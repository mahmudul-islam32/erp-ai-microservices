import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { AppDispatch, RootState } from '../../../app/store';
import { fetchUserById } from '../store/usersSlice';
import { formatDistanceToNow, format } from 'date-fns';
import { UserRole, UserStatus, Permission, AuditLog } from '../types';
import { usePermissions } from '../../../shared/hooks/usePermissions';
import { auditLogsApi } from '../services/usersApi';
import { toast } from 'sonner';

export const UserDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { selectedUser, loading } = useSelector((state: RootState) => state.users);
  const { hasPermission } = usePermissions();
  const [activities, setActivities] = useState<AuditLog[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  
  const canEdit = hasPermission(Permission.USER_UPDATE);

  useEffect(() => {
    if (id) {
      dispatch(fetchUserById(id));
      loadUserActivities(id);
    }
  }, [dispatch, id]);

  const loadUserActivities = async (userId: string) => {
    setLoadingActivities(true);
    try {
      const logs = await auditLogsApi.getByUserId(userId, 10); // Get last 10 activities
      setActivities(logs);
    } catch (error: any) {
      console.error('Failed to load user activities:', error);
      const errorMessage = error?.response?.data?.detail || 'Failed to load activities';
      toast.error(errorMessage);
    } finally {
      setLoadingActivities(false);
    }
  };

  if (loading && !selectedUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!selectedUser) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">User not found</p>
        <button
          onClick={() => navigate('/dashboard/users')}
          className="mt-4 text-primary-600 hover:text-primary-900"
        >
          Back to Users
        </button>
      </div>
    );
  }

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case UserStatus.ACTIVE:
        return 'bg-green-100 text-green-800';
      case UserStatus.INACTIVE:
        return 'bg-gray-100 text-gray-800';
      case UserStatus.SUSPENDED:
        return 'bg-red-100 text-red-800';
      case UserStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return 'bg-purple-100 text-purple-800';
      case UserRole.ADMIN:
        return 'bg-blue-100 text-blue-800';
      case UserRole.MANAGER:
        return 'bg-primary-100 text-primary-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('create') || action.includes('login')) {
      return (
        <div className="p-2 bg-green-100 rounded-full">
          <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
      );
    }
    if (action.includes('update') || action.includes('edit')) {
      return (
        <div className="p-2 bg-blue-100 rounded-full">
          <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
      );
    }
    if (action.includes('delete')) {
      return (
        <div className="p-2 bg-red-100 rounded-full">
          <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
      );
    }
    return (
      <div className="p-2 bg-gray-100 rounded-full">
        <svg className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    );
  };

  const formatActivityDescription = (log: AuditLog) => {
    const action = log.action.replace(/_/g, ' ').toLowerCase();
    const resource = log.resource.replace(/_/g, ' ').toLowerCase();
    return `${action} ${resource}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <div>
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

      {/* Header */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {selectedUser.first_name} {selectedUser.last_name}
              </h1>
              <p className="mt-1 text-sm text-gray-500">{selectedUser.email}</p>
            </div>
            {canEdit && (
              <div className="flex space-x-3">
                <button
                  onClick={() => navigate(`/dashboard/users/${id}/edit`)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Edit User
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Basic Information
              </h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {selectedUser.first_name} {selectedUser.last_name}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{selectedUser.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {selectedUser.phone || 'Not provided'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Department</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {selectedUser.department || 'Not assigned'}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Role & Status */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Role & Status
              </h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Role</dt>
                  <dd className="mt-1">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(
                        selectedUser.role
                      )}`}
                    >
                      {selectedUser.role.replace('_', ' ').toUpperCase()}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                        selectedUser.status
                      )}`}
                    >
                      {selectedUser.status.toUpperCase()}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Login</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {selectedUser.last_login
                      ? formatDistanceToNow(new Date(selectedUser.last_login), {
                          addSuffix: true,
                        })
                      : 'Never'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created At</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {format(new Date(selectedUser.created_at), 'PPpp')}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Permissions */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Permissions</h3>
        </div>
        <div className="px-6 py-6">
          {selectedUser.permissions && selectedUser.permissions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {selectedUser.permissions.map((permission) => (
                <div
                  key={permission}
                  className="flex items-center space-x-2 text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded"
                >
                  <svg
                    className="h-4 w-4 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{permission}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No permissions assigned</p>
          )}
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
            {activities.length > 0 && (
              <button
                onClick={() => navigate(`/dashboard/audit?user_id=${id}`)}
                className="text-sm text-primary-600 hover:text-primary-800"
              >
                View all
              </button>
            )}
          </div>
        </div>
        <div className="px-6 py-6">
          {loadingActivities ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : activities.length === 0 ? (
            <p className="text-gray-500 text-sm">No recent activity found</p>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  {getActionIcon(activity.action)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {formatActivityDescription(activity)}
                      </p>
                      <span
                        className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                          activity.status === 'success'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {activity.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(activity.timestamp), 'PPpp')} • {activity.ip_address}
                      {activity.resource_id && (
                        <span className="ml-1 text-gray-400">
                          • {activity.resource} #{activity.resource_id.slice(0, 8)}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

