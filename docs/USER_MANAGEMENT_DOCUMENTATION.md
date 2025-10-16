# User Management System - Complete Documentation

## Overview

This document provides comprehensive documentation for the user management system implemented in the ERP frontend application. The system includes full CRUD operations for users, role-based access control, permissions management, session monitoring, audit logging, and security settings.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Features](#features)
3. [API Integration](#api-integration)
4. [User Management](#user-management)
5. [Roles & Permissions](#roles--permissions)
6. [Access Control](#access-control)
7. [Session Management](#session-management)
8. [Audit Logs](#audit-logs)
9. [Security Settings](#security-settings)
10. [Components Reference](#components-reference)
11. [State Management](#state-management)
12. [Usage Examples](#usage-examples)
13. [Best Practices](#best-practices)

---

## Architecture Overview

### Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **State Management**: Redux Toolkit
- **Routing**: React Router v6
- **Forms**: React Hook Form
- **UI Components**: Custom components with Tailwind CSS
- **Date Handling**: date-fns
- **Notifications**: Sonner (Toast notifications)
- **HTTP Client**: Axios

### Project Structure

```
src/features/users/
├── components/          # Reusable UI components
│   ├── UserTable.tsx
│   ├── UserForm.tsx
│   ├── UserFilters.tsx
│   ├── DeleteUserModal.tsx
│   └── PermissionsEditor.tsx
├── pages/              # Page components
│   ├── UsersPage.tsx
│   ├── CreateUserPage.tsx
│   ├── EditUserPage.tsx
│   ├── UserDetailPage.tsx
│   ├── RolesPage.tsx
│   ├── AccessControlPage.tsx
│   ├── SessionsPage.tsx
│   ├── AuditLogsPage.tsx
│   └── SecurityPage.tsx
├── services/           # API services
│   └── usersApi.ts
├── store/              # Redux state
│   └── usersSlice.ts
└── types/              # TypeScript types
    └── index.ts
```

---

## Features

### ✅ User Management (CRUD)
- **Create Users**: Add new users with email, password, name, role, department, and phone
- **Read Users**: View all users with filtering, sorting, and search capabilities
- **Update Users**: Edit user information, role, status, and permissions
- **Delete Users**: Soft delete users with confirmation modal
- **Bulk Operations**: Select and perform actions on multiple users at once

### ✅ Roles & Permissions
- **Role Definitions**: 6 predefined roles (Super Admin, Admin, Manager, Employee, Customer, Vendor)
- **Permission System**: Granular permissions for different modules (User, Inventory, Sales, Finance, HR, AI)
- **Role Matrix**: Visual permission matrix showing all roles and their permissions
- **Permission Editor**: Interactive component for managing user permissions

### ✅ Access Control
- **Resource-Based Access**: Grant specific resource access to users
- **Temporary Access**: Set expiration dates for access grants
- **Access Revocation**: Revoke access at any time
- **Access Tracking**: Monitor who granted access and when

### ✅ Session Management
- **Active Sessions**: View all active user sessions
- **Session Details**: See IP address, device, creation time, and last activity
- **Session Termination**: Terminate individual or all sessions for a user
- **Session Filtering**: Filter by active/inactive status

### ✅ Audit Logs
- **Activity Tracking**: Log all user actions (login, create, update, delete, etc.)
- **Detailed Information**: Track user, action, resource, status, IP address, and timestamp
- **Advanced Filtering**: Filter by action, resource, status, and date range
- **Export Capability**: Export audit logs to CSV format

### ✅ Security Settings
- **Password Policy**: Configure password requirements (length, complexity)
- **Login Security**: Set max login attempts and lockout duration
- **Session Management**: Configure session timeout
- **Advanced Features**: Enable 2FA and IP whitelist

---

## API Integration

### Base Configuration

The API client is configured to communicate with the auth service:

```typescript
// Base URL: http://localhost:8001 (auth service)
// All endpoints are prefixed with /api/v1
```

### Endpoints Used

#### User Endpoints
```
GET    /api/v1/users/                    # Get all users
GET    /api/v1/users/:id                 # Get user by ID
POST   /api/v1/users/                    # Create user
PUT    /api/v1/users/:id                 # Update user
DELETE /api/v1/users/:id                 # Delete user
PUT    /api/v1/users/:id/permissions     # Update user permissions
GET    /api/v1/users/roles/permissions   # Get role permissions
```

#### Auth Endpoints
```
POST   /api/v1/auth/login                # User login
POST   /api/v1/auth/logout               # User logout
GET    /api/v1/auth/me                   # Get current user
POST   /api/v1/auth/change-password      # Change password
POST   /api/v1/auth/forgot-password      # Request password reset
POST   /api/v1/auth/reset-password       # Reset password
POST   /api/v1/auth/refresh              # Refresh token
```

### Authentication

All API requests include authentication via:
- HTTP-only cookies (access_token, refresh_token)
- Bearer token in Authorization header (fallback)

### Error Handling

API errors are handled with:
- Toast notifications for user feedback
- Redux state updates for error tracking
- Automatic retry on token expiration (via interceptors)

---

## User Management

### Users Page (`/dashboard/users`)

The main users page provides comprehensive user management capabilities.

#### Features

1. **User Statistics Dashboard**
   - Total users count
   - Active users count
   - Pending users count
   - Suspended users count

2. **Advanced Filtering**
   - Search by email or name
   - Filter by role
   - Filter by status
   - Filter by department

3. **User Table**
   - Sortable columns (email, name, role, status)
   - Status badges (color-coded)
   - Role badges (color-coded)
   - Last login information
   - Quick actions (View, Edit, Delete)

4. **Bulk Operations**
   - Select multiple users via checkboxes
   - Bulk activate/suspend users
   - Bulk delete users

5. **Export Functionality**
   - Export users to CSV format
   - Includes all user information

#### Usage

```typescript
// Access the users page
navigate('/dashboard/users');

// Filter users
dispatch(setFilters({ 
  role: UserRole.ADMIN, 
  status: UserStatus.ACTIVE 
}));

// Create new user
navigate('/dashboard/users/create');

// Edit user
navigate(`/dashboard/users/${userId}/edit`);

// View user details
navigate(`/dashboard/users/${userId}`);
```

### Create User Page (`/dashboard/users/create`)

#### Form Fields

- **Email** (required): User's email address (must be unique)
- **Password** (required): Minimum 8 characters
- **First Name** (required): 1-50 characters
- **Last Name** (required): 1-50 characters
- **Role** (required): Select from available roles
- **Department** (optional): Department assignment
- **Phone** (optional): Contact number

#### Validation Rules

```typescript
{
  email: {
    required: true,
    pattern: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
  },
  password: {
    required: true,
    minLength: 8
  },
  first_name: {
    required: true,
    minLength: 1,
    maxLength: 50
  },
  last_name: {
    required: true,
    minLength: 1,
    maxLength: 50
  },
  role: {
    required: true
  }
}
```

### Edit User Page (`/dashboard/users/:id/edit`)

Similar to Create User but:
- Email field is disabled (cannot be changed)
- Password field is not shown (use change password instead)
- Status field is available
- Pre-populated with existing user data

### User Detail Page (`/dashboard/users/:id`)

Displays comprehensive user information:

1. **Basic Information**
   - Full name
   - Email address
   - Phone number
   - Department

2. **Role & Status**
   - Current role (with badge)
   - Account status (with badge)
   - Last login time
   - Account creation date

3. **Permissions**
   - List of all assigned permissions
   - Grouped by category
   - Visual indicators

4. **Activity Log** (Coming Soon)
   - Recent user activities
   - Login history
   - Changes made

---

## Roles & Permissions

### Role Hierarchy

```
Super Admin > Admin > Manager > Employee / Customer / Vendor
```

### Available Roles

#### 1. Super Admin
- **Full system access**
- All permissions enabled
- Can manage all users and settings
- Cannot be restricted

#### 2. Admin
- **Administrative access**
- Most permissions enabled
- Can manage users (except super admins)
- Can configure system settings

#### 3. Manager
- **Management level access**
- Team oversight permissions
- Module-specific access (based on department)
- Cannot manage other managers or admins

#### 4. Employee
- **Standard access**
- Basic operational permissions
- Limited to assigned modules
- Cannot access admin features

#### 5. Customer
- **Customer portal access**
- View orders and account
- Limited to customer-facing features
- No backend access

#### 6. Vendor
- **Vendor portal access**
- Manage inventory and orders
- Limited to vendor-specific features
- No user management

### Permission Categories

#### User Management
- `user:create` - Create new users
- `user:read` - View user information
- `user:update` - Edit user details
- `user:delete` - Delete users

#### Inventory Management
- `inventory:create` - Add products/warehouses
- `inventory:read` - View inventory
- `inventory:update` - Edit inventory items
- `inventory:delete` - Remove inventory items

#### Sales Management
- `sales:create` - Create orders/quotes
- `sales:read` - View sales data
- `sales:update` - Edit orders/quotes
- `sales:delete` - Delete sales records

#### Finance Management
- `finance:create` - Create financial records
- `finance:read` - View financial data
- `finance:update` - Edit financial records
- `finance:delete` - Delete financial records

#### HR Management
- `hr:create` - Add HR records
- `hr:read` - View HR data
- `hr:update` - Edit HR records
- `hr:delete` - Delete HR records

#### AI Features
- `ai:access` - Access AI features
- `ai:admin` - Manage AI settings

### Role Permissions Matrix

| Permission | Super Admin | Admin | Manager | Employee | Customer | Vendor |
|------------|-------------|-------|---------|----------|----------|--------|
| user:create | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| user:read | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| user:update | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| user:delete | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| inventory:* | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| sales:* | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| finance:* | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| hr:* | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| ai:access | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| ai:admin | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

### Using Permissions in Code

```typescript
// Check if user has permission
const hasPermission = user.permissions.includes(Permission.USER_CREATE);

// Protect routes with permissions
<ProtectedRoute requiredPermission={Permission.USER_READ}>
  <UsersPage />
</ProtectedRoute>

// Show/hide UI elements
{hasPermission(Permission.USER_DELETE) && (
  <button onClick={handleDelete}>Delete</button>
)}
```

---

## Access Control

### Concept

Access Control allows granting temporary or permanent access to specific resources beyond role-based permissions.

### Use Cases

1. **Project-Based Access**: Grant access to specific projects
2. **Temporary Elevation**: Give temporary admin access
3. **Resource-Specific**: Allow access to specific products/orders
4. **Time-Limited**: Set expiration for access grants

### Access Control Entry Structure

```typescript
interface AccessControlEntry {
  id: string;
  user_id: string;
  user_email: string;
  resource: string;              // e.g., "project:123", "order:456"
  permissions: Permission[];      // Granted permissions
  granted_by: string;            // Who granted the access
  granted_at: string;            // When granted
  expires_at?: string;           // Optional expiration
}
```

### Managing Access

#### Grant Access
```typescript
await accessControlApi.grantAccess(
  userId,
  'project:123',
  [Permission.SALES_READ, Permission.SALES_UPDATE],
  '2024-12-31T23:59:59Z'  // Optional expiration
);
```

#### Revoke Access
```typescript
await accessControlApi.revokeAccess(entryId);
```

#### View Access
```typescript
const entries = await accessControlApi.getAll();
```

---

## Session Management

### Session Tracking

The system tracks all active user sessions with the following information:

```typescript
interface Session {
  id: string;
  user_id: string;
  user_email: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
  last_activity: string;
  expires_at: string;
  is_active: boolean;
}
```

### Session Operations

#### View All Sessions
```typescript
const sessions = await sessionsApi.getAll();
```

#### View User Sessions
```typescript
const userSessions = await sessionsApi.getByUserId(userId);
```

#### Terminate Session
```typescript
await sessionsApi.terminate(sessionId);
```

#### Terminate All User Sessions
```typescript
await sessionsApi.terminateAllForUser(userId);
```

### Session Security Features

1. **Timeout**: Automatic logout after inactivity
2. **Device Tracking**: Monitor login devices
3. **IP Tracking**: Track login locations
4. **Concurrent Sessions**: Limit or allow multiple sessions
5. **Force Logout**: Terminate sessions remotely

---

## Audit Logs

### Event Tracking

All significant user actions are logged:

```typescript
interface AuditLog {
  id: string;
  user_id: string;
  user_email: string;
  action: string;              // login, create, update, delete, etc.
  resource: string;            // user, product, order, etc.
  resource_id?: string;        // Specific resource ID
  details?: Record<string, any>; // Additional details
  ip_address: string;
  user_agent: string;
  timestamp: string;
  status: 'success' | 'failure';
}
```

### Logged Actions

- **Authentication**: login, logout, password_change
- **User Management**: user_create, user_update, user_delete
- **Inventory**: product_create, product_update, product_delete
- **Sales**: order_create, order_update, order_delete
- **Settings**: settings_update, role_update

### Filtering Audit Logs

```typescript
const logs = await auditLogsApi.getAll({
  user_id: 'user123',
  action: 'login',
  resource: 'user',
  status: 'success',
  start_date: '2024-01-01',
  end_date: '2024-12-31',
  skip: 0,
  limit: 50
});
```

### Export Audit Logs

```typescript
const csv = auditLogsApi.exportToCSV(logs);
// Download CSV file
```

### Best Practices

1. **Regular Monitoring**: Review audit logs regularly
2. **Suspicious Activity**: Set up alerts for failed login attempts
3. **Compliance**: Maintain audit logs for compliance requirements
4. **Retention**: Define log retention policies
5. **Privacy**: Protect sensitive information in logs

---

## Security Settings

### Password Policy Configuration

```typescript
{
  password_min_length: 8,           // Minimum password length
  password_require_uppercase: true,  // Require uppercase letters
  password_require_lowercase: true,  // Require lowercase letters
  password_require_numbers: true,    // Require numbers
  password_require_special: true,    // Require special chars
  password_expiry_days: 90          // Password expiration (0 = never)
}
```

### Login Security Configuration

```typescript
{
  max_login_attempts: 5,            // Max failed attempts before lockout
  lockout_duration_minutes: 30      // Lockout duration
}
```

### Session Configuration

```typescript
{
  session_timeout_minutes: 60       // Inactivity timeout
}
```

### Advanced Security Features

```typescript
{
  enable_2fa: false,                // Two-factor authentication
  enable_ip_whitelist: false,       // IP whitelist restriction
  allowed_ips: []                   // Whitelisted IPs
}
```

### Updating Security Settings

```typescript
await securityApi.updateSettings({
  password_min_length: 10,
  max_login_attempts: 3,
  session_timeout_minutes: 30
});
```

---

## Components Reference

### UserTable

Displays users in a sortable, filterable table.

```typescript
<UserTable
  users={users}
  onEdit={(user) => navigate(`/users/${user.id}/edit`)}
  onDelete={(user) => handleDelete(user)}
  onView={(user) => navigate(`/users/${user.id}`)}
  selectedUsers={selectedUsers}
  onSelectionChange={setSelectedUsers}
/>
```

**Props:**
- `users`: Array of users to display
- `onEdit`: Callback when edit is clicked
- `onDelete`: Callback when delete is clicked
- `onView`: Callback when view is clicked
- `selectedUsers`: Array of selected user IDs
- `onSelectionChange`: Callback when selection changes

### UserForm

Reusable form for creating and editing users.

```typescript
<UserForm
  initialData={user}
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  isEdit={true}
  loading={loading}
/>
```

**Props:**
- `initialData`: Initial form values (for edit mode)
- `onSubmit`: Form submission handler
- `onCancel`: Cancel button handler
- `isEdit`: Whether in edit mode
- `loading`: Loading state

### UserFilters

Advanced filtering component.

```typescript
<UserFilters
  filters={filters}
  onFiltersChange={(newFilters) => dispatch(setFilters(newFilters))}
/>
```

**Props:**
- `filters`: Current filter values
- `onFiltersChange`: Callback when filters change

### DeleteUserModal

Confirmation modal for user deletion.

```typescript
<DeleteUserModal
  user={userToDelete}
  onConfirm={handleConfirm}
  onCancel={handleCancel}
  loading={loading}
/>
```

**Props:**
- `user`: User to delete
- `onConfirm`: Confirm deletion handler
- `onCancel`: Cancel handler
- `loading`: Loading state

### PermissionsEditor

Interactive permission selection component.

```typescript
<PermissionsEditor
  selectedPermissions={user.permissions}
  onChange={setPermissions}
  readOnly={false}
/>
```

**Props:**
- `selectedPermissions`: Currently selected permissions
- `onChange`: Callback when permissions change
- `readOnly`: Whether editor is read-only

---

## State Management

### Redux Store Structure

```typescript
interface UsersState {
  users: User[];
  selectedUser: User | null;
  rolePermissions: RolePermissions | null;
  statistics: UserStatistics | null;
  loading: boolean;
  error: string | null;
  filters: UserFilters;
}
```

### Available Actions

#### Async Thunks
```typescript
dispatch(fetchUsers(filters));
dispatch(fetchUserById(userId));
dispatch(createUser(userData));
dispatch(updateUser({ id, data }));
dispatch(deleteUser(userId));
dispatch(updateUserPermissions({ userId, permissions }));
dispatch(fetchRolePermissions());
dispatch(fetchUserStatistics());
dispatch(bulkDeleteUsers(userIds));
dispatch(bulkUpdateUserStatus({ userIds, status }));
```

#### Synchronous Actions
```typescript
dispatch(setFilters(filters));
dispatch(clearFilters());
dispatch(setSelectedUser(user));
dispatch(clearError());
```

### Selectors

```typescript
const { users, loading, error, filters } = useSelector(
  (state: RootState) => state.users
);
```

---

## Usage Examples

### Example 1: Creating a User

```typescript
import { useDispatch } from 'react-redux';
import { createUser } from '../store/usersSlice';
import { UserRole } from '../types';

function CreateUserExample() {
  const dispatch = useDispatch();

  const handleCreate = async () => {
    const userData = {
      email: 'john.doe@example.com',
      password: 'SecurePassword123!',
      first_name: 'John',
      last_name: 'Doe',
      role: UserRole.EMPLOYEE,
      department: 'Sales',
      phone: '+1234567890'
    };

    await dispatch(createUser(userData));
    // User created, navigate to users list
    navigate('/dashboard/users');
  };

  return <button onClick={handleCreate}>Create User</button>;
}
```

### Example 2: Filtering Users

```typescript
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers, setFilters } from '../store/usersSlice';
import { UserRole, UserStatus } from '../types';

function FilterUsersExample() {
  const dispatch = useDispatch();
  const { users, filters } = useSelector(state => state.users);

  const filterActiveAdmins = () => {
    dispatch(setFilters({
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE
    }));
  };

  useEffect(() => {
    dispatch(fetchUsers(filters));
  }, [filters]);

  return (
    <>
      <button onClick={filterActiveAdmins}>Show Active Admins</button>
      <UserTable users={users} />
    </>
  );
}
```

### Example 3: Bulk Operations

```typescript
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { bulkDeleteUsers } from '../store/usersSlice';

function BulkOperationsExample() {
  const dispatch = useDispatch();
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const handleBulkDelete = async () => {
    if (window.confirm(`Delete ${selectedUsers.length} users?`)) {
      await dispatch(bulkDeleteUsers(selectedUsers));
      setSelectedUsers([]);
    }
  };

  return (
    <>
      <UserTable
        users={users}
        selectedUsers={selectedUsers}
        onSelectionChange={setSelectedUsers}
      />
      {selectedUsers.length > 0 && (
        <button onClick={handleBulkDelete}>
          Delete Selected ({selectedUsers.length})
        </button>
      )}
    </>
  );
}
```

### Example 4: Permission-Based UI

```typescript
import { useSelector } from 'react-redux';
import { Permission } from '../types';

function PermissionBasedUI() {
  const { user } = useSelector(state => state.auth);

  const canCreate = user?.permissions.includes(Permission.USER_CREATE);
  const canDelete = user?.permissions.includes(Permission.USER_DELETE);

  return (
    <div>
      {canCreate && (
        <button onClick={handleCreate}>Create User</button>
      )}
      {canDelete && (
        <button onClick={handleDelete}>Delete User</button>
      )}
    </div>
  );
}
```

---

## Best Practices

### Security

1. **Password Requirements**: Enforce strong password policies
2. **Session Management**: Implement proper session timeouts
3. **Audit Logging**: Log all sensitive operations
4. **Permission Checks**: Always verify permissions on backend
5. **Secure Communication**: Use HTTPS in production
6. **Token Management**: Implement token refresh mechanism
7. **Rate Limiting**: Prevent brute force attacks

### User Experience

1. **Loading States**: Show loading indicators during async operations
2. **Error Handling**: Provide clear error messages
3. **Confirmations**: Ask for confirmation on destructive actions
4. **Feedback**: Show success/error notifications
5. **Validation**: Validate forms before submission
6. **Accessibility**: Ensure components are keyboard accessible

### Performance

1. **Pagination**: Implement server-side pagination for large datasets
2. **Memoization**: Use React.memo for expensive components
3. **Debouncing**: Debounce search inputs
4. **Lazy Loading**: Load components on demand
5. **Caching**: Cache API responses when appropriate

### Code Quality

1. **TypeScript**: Use proper typing for all components
2. **Error Boundaries**: Implement error boundaries
3. **Testing**: Write unit tests for critical functions
4. **Documentation**: Document complex logic
5. **Code Review**: Review all changes before merging
6. **Linting**: Use ESLint and Prettier

### Maintenance

1. **Regular Updates**: Keep dependencies up to date
2. **Security Patches**: Apply security patches promptly
3. **Monitoring**: Monitor application errors
4. **Backup**: Regular database backups
5. **Documentation**: Keep documentation current

---

## Troubleshooting

### Common Issues

#### 1. Users not loading
**Problem**: Users list is empty  
**Solution**: 
- Check API connectivity
- Verify authentication tokens
- Check user permissions

#### 2. Permission denied errors
**Problem**: API returns 403 Forbidden  
**Solution**:
- Verify user has required permissions
- Check token validity
- Ensure role permissions are correctly configured

#### 3. Form validation errors
**Problem**: Form won't submit  
**Solution**:
- Check all required fields
- Verify password meets requirements
- Ensure email is valid and unique

#### 4. Session expired
**Problem**: User logged out unexpectedly  
**Solution**:
- Implement token refresh
- Increase session timeout
- Handle token expiration gracefully

---

## API Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| 400 | Bad Request | Check request payload format |
| 401 | Unauthorized | Login again or refresh token |
| 403 | Forbidden | Check user permissions |
| 404 | Not Found | Verify resource exists |
| 409 | Conflict | Email already exists |
| 422 | Validation Error | Check field validation |
| 500 | Server Error | Contact system administrator |

---

## Future Enhancements

### Planned Features

1. **Two-Factor Authentication (2FA)**
   - SMS-based 2FA
   - Authenticator app support
   - Backup codes

2. **Advanced Audit Logs**
   - Real-time log streaming
   - Log analytics dashboard
   - Automated alerts

3. **Enhanced Session Management**
   - Device fingerprinting
   - Geolocation tracking
   - Anomaly detection

4. **Role Templates**
   - Pre-configured role templates
   - Custom role creation
   - Role inheritance

5. **User Groups**
   - Organize users into groups
   - Group-based permissions
   - Bulk assignments

6. **Activity Dashboard**
   - Real-time activity feed
   - User activity timeline
   - System health metrics

7. **Integration Features**
   - LDAP/AD integration
   - SSO (Single Sign-On)
   - SAML support

---

## Support and Contact

For issues, questions, or feature requests:
- Create an issue in the project repository
- Contact the development team
- Refer to additional documentation in `/docs`

---

## Version History

### Version 1.0.0 (Current)
- Initial release
- Full CRUD operations for users
- Role-based access control
- Session management
- Audit logging
- Security settings

---

## License

This documentation is part of the ERP AI Microservices project.

---

**Last Updated**: October 9, 2025  
**Author**: Development Team  
**Version**: 1.0.0

