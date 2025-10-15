import { authApi } from '../../../shared/api/client';
import {
  User,
  CreateUserData,
  UpdateUserData,
  ChangePasswordData,
  UserFilters,
  Permission,
  RolePermissions,
  Session,
  AuditLog,
  AuditFilters,
  SecuritySettings,
  UserStatistics,
  AccessControlEntry,
} from '../types';

/**
 * Users API Service
 * Comprehensive API methods for user management
 */
export const usersApi = {
  // ==================== User CRUD Operations ====================
  
  /**
   * Get all users with optional filters
   */
  getAll: async (filters?: UserFilters): Promise<User[]> => {
    const params = new URLSearchParams();
    if (filters?.role) params.append('role', filters.role);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.skip !== undefined) params.append('skip', filters.skip.toString());
    if (filters?.limit !== undefined) params.append('limit', filters.limit.toString());
    
    const response = await authApi.get(`/api/v1/users/?${params.toString()}`);
    return response.data;
  },

  /**
   * Get user by ID
   */
  getById: async (id: string): Promise<User> => {
    const response = await authApi.get(`/api/v1/users/${id}`);
    return response.data;
  },

  /**
   * Create new user
   */
  create: async (data: CreateUserData): Promise<User> => {
    const response = await authApi.post('/api/v1/users/', data);
    return response.data;
  },

  /**
   * Update existing user
   */
  update: async (id: string, data: UpdateUserData): Promise<User> => {
    const response = await authApi.put(`/api/v1/users/${id}`, data);
    return response.data;
  },

  /**
   * Delete user (soft delete)
   */
  delete: async (id: string): Promise<void> => {
    await authApi.delete(`/api/v1/users/${id}`);
  },

  // ==================== Permissions Management ====================

  /**
   * Update user permissions
   */
  updatePermissions: async (userId: string, permissions: Permission[]): Promise<void> => {
    await authApi.put(`/api/v1/users/${userId}/permissions`, permissions);
  },

  /**
   * Get role-based permissions mapping
   */
  getRolePermissions: async (): Promise<RolePermissions> => {
    const response = await authApi.get('/api/v1/users/roles/permissions');
    return response.data;
  },

  // ==================== Password Management ====================

  /**
   * Change user password
   */
  changePassword: async (data: ChangePasswordData): Promise<void> => {
    await authApi.post('/api/v1/auth/change-password', data);
  },

  /**
   * Request password reset
   */
  forgotPassword: async (email: string): Promise<void> => {
    await authApi.post('/api/v1/auth/forgot-password', { email });
  },

  /**
   * Reset password with token
   */
  resetPassword: async (token: string, new_password: string): Promise<void> => {
    await authApi.post('/api/v1/auth/reset-password', { token, new_password });
  },

  // ==================== User Statistics ====================

  /**
   * Get user statistics (mock for now - can be implemented in backend)
   */
  getStatistics: async (): Promise<UserStatistics> => {
    // This would call a real endpoint in production
    const users = await usersApi.getAll();
    
    const stats: UserStatistics = {
      total_users: users.length,
      active_users: users.filter(u => u.status === 'active').length,
      inactive_users: users.filter(u => u.status === 'inactive').length,
      suspended_users: users.filter(u => u.status === 'suspended').length,
      users_by_role: {},
      users_by_department: {},
      recent_registrations: 0,
      recent_logins: 0,
    };

    // Count users by role
    users.forEach(user => {
      stats.users_by_role[user.role] = (stats.users_by_role[user.role] || 0) + 1;
      if (user.department) {
        stats.users_by_department[user.department] = (stats.users_by_department[user.department] || 0) + 1;
      }
    });

    return stats;
  },

  // ==================== Bulk Operations ====================

  /**
   * Bulk delete users
   */
  bulkDelete: async (userIds: string[]): Promise<void> => {
    await Promise.all(userIds.map(id => usersApi.delete(id)));
  },

  /**
   * Bulk update user status
   */
  bulkUpdateStatus: async (userIds: string[], status: string): Promise<void> => {
    await Promise.all(
      userIds.map(id => usersApi.update(id, { status: status as any }))
    );
  },

  /**
   * Export users to CSV (client-side)
   */
  exportToCSV: (users: User[]): string => {
    const headers = ['ID', 'Email', 'First Name', 'Last Name', 'Role', 'Status', 'Department', 'Phone', 'Created At'];
    const rows = users.map(u => [
      u.id || u._id,
      u.email,
      u.first_name,
      u.last_name,
      u.role,
      u.status,
      u.department || '',
      u.phone || '',
      u.created_at,
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    return csv;
  },
};

/**
 * Sessions API Service
 * For session management
 */
export const sessionsApi = {
  /**
   * Get all active sessions
   */
  getAll: async (): Promise<Session[]> => {
    // Mock data for now - implement backend endpoint
    return [];
  },

  /**
   * Get sessions for specific user
   */
  getByUserId: async (userId: string): Promise<Session[]> => {
    // Mock data for now - implement backend endpoint
    return [];
  },

  /**
   * Terminate session
   */
  terminate: async (sessionId: string): Promise<void> => {
    // Mock data for now - implement backend endpoint
    console.log('Terminating session:', sessionId);
  },

  /**
   * Terminate all sessions for a user
   */
  terminateAllForUser: async (userId: string): Promise<void> => {
    // Mock data for now - implement backend endpoint
    console.log('Terminating all sessions for user:', userId);
  },
};

/**
 * Audit Logs API Service
 * For audit trail and activity logs
 */
export const auditLogsApi = {
  /**
   * Get audit logs with filters
   */
  getAll: async (filters?: AuditFilters): Promise<AuditLog[]> => {
    // Mock data for now - implement backend endpoint
    const mockLogs: AuditLog[] = [];
    return mockLogs;
  },

  /**
   * Get audit logs for specific user
   */
  getByUserId: async (userId: string): Promise<AuditLog[]> => {
    // Mock data for now - implement backend endpoint
    return [];
  },

  /**
   * Export audit logs to CSV
   */
  exportToCSV: (logs: AuditLog[]): string => {
    const headers = ['ID', 'User Email', 'Action', 'Resource', 'Status', 'IP Address', 'Timestamp'];
    const rows = logs.map(log => [
      log.id,
      log.user_email,
      log.action,
      log.resource,
      log.status,
      log.ip_address,
      log.timestamp,
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    return csv;
  },
};

/**
 * Security Settings API Service
 */
export const securityApi = {
  /**
   * Get security settings
   */
  getSettings: async (): Promise<SecuritySettings> => {
    // Mock data for now - implement backend endpoint
    return {
      password_min_length: 8,
      password_require_uppercase: true,
      password_require_lowercase: true,
      password_require_numbers: true,
      password_require_special: true,
      password_expiry_days: 90,
      max_login_attempts: 5,
      lockout_duration_minutes: 30,
      session_timeout_minutes: 60,
      enable_2fa: false,
      enable_ip_whitelist: false,
      allowed_ips: [],
    };
  },

  /**
   * Update security settings
   */
  updateSettings: async (settings: Partial<SecuritySettings>): Promise<SecuritySettings> => {
    // Mock data for now - implement backend endpoint
    console.log('Updating security settings:', settings);
    return await securityApi.getSettings();
  },
};

/**
 * Access Control API Service
 */
export const accessControlApi = {
  /**
   * Get all access control entries
   */
  getAll: async (): Promise<AccessControlEntry[]> => {
    // Mock data for now - implement backend endpoint
    return [];
  },

  /**
   * Grant access to user
   */
  grantAccess: async (
    userId: string,
    resource: string,
    permissions: Permission[],
    expiresAt?: string
  ): Promise<AccessControlEntry> => {
    // Mock data for now - implement backend endpoint
    const entry: AccessControlEntry = {
      id: Date.now().toString(),
      user_id: userId,
      user_email: '',
      resource,
      permissions,
      granted_by: 'current_user',
      granted_at: new Date().toISOString(),
      expires_at: expiresAt,
    };
    return entry;
  },

  /**
   * Revoke access from user
   */
  revokeAccess: async (entryId: string): Promise<void> => {
    // Mock data for now - implement backend endpoint
    console.log('Revoking access:', entryId);
  },
};

export default usersApi;
