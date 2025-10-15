// Enums matching backend
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  EMPLOYEE = 'employee',
  CUSTOMER = 'customer',
  VENDOR = 'vendor',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
}

export enum Permission {
  // User Management
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  
  // Inventory Management
  INVENTORY_CREATE = 'inventory:create',
  INVENTORY_READ = 'inventory:read',
  INVENTORY_UPDATE = 'inventory:update',
  INVENTORY_DELETE = 'inventory:delete',
  
  // Sales Management
  SALES_CREATE = 'sales:create',
  SALES_READ = 'sales:read',
  SALES_UPDATE = 'sales:update',
  SALES_DELETE = 'sales:delete',
  
  // Finance Management
  FINANCE_CREATE = 'finance:create',
  FINANCE_READ = 'finance:read',
  FINANCE_UPDATE = 'finance:update',
  FINANCE_DELETE = 'finance:delete',
  
  // HR Management
  HR_CREATE = 'hr:create',
  HR_READ = 'hr:read',
  HR_UPDATE = 'hr:update',
  HR_DELETE = 'hr:delete',
  
  // AI Features
  AI_ACCESS = 'ai:access',
  AI_ADMIN = 'ai:admin',
}

// User interface
export interface User {
  id?: string;
  _id?: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  department?: string;
  phone?: string;
  status: UserStatus;
  permissions: Permission[];
  created_at: string;
  updated_at: string;
  last_login?: string;
}

// Create user data
export interface CreateUserData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  department?: string;
  phone?: string;
}

// Update user data
export interface UpdateUserData {
  first_name?: string;
  last_name?: string;
  role?: UserRole;
  department?: string;
  phone?: string;
  status?: UserStatus;
}

// Change password
export interface ChangePasswordData {
  current_password: string;
  new_password: string;
}

// Role permissions mapping
export interface RolePermissions {
  [key: string]: Permission[];
}

// Session interface
export interface Session {
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

// Audit log interface
export interface AuditLog {
  id: string;
  user_id: string;
  user_email: string;
  action: string;
  resource: string;
  resource_id?: string;
  details?: Record<string, any>;
  ip_address: string;
  user_agent: string;
  timestamp: string;
  status: 'success' | 'failure';
}

// Security settings
export interface SecuritySettings {
  password_min_length: number;
  password_require_uppercase: boolean;
  password_require_lowercase: boolean;
  password_require_numbers: boolean;
  password_require_special: boolean;
  password_expiry_days: number;
  max_login_attempts: number;
  lockout_duration_minutes: number;
  session_timeout_minutes: number;
  enable_2fa: boolean;
  enable_ip_whitelist: boolean;
  allowed_ips: string[];
}

// User filters for listing
export interface UserFilters {
  role?: UserRole;
  status?: UserStatus;
  department?: string;
  search?: string;
  skip?: number;
  limit?: number;
}

// Audit log filters
export interface AuditFilters {
  user_id?: string;
  action?: string;
  resource?: string;
  status?: 'success' | 'failure';
  start_date?: string;
  end_date?: string;
  skip?: number;
  limit?: number;
}

// Pagination response
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  skip: number;
  limit: number;
}

// User statistics
export interface UserStatistics {
  total_users: number;
  active_users: number;
  inactive_users: number;
  suspended_users: number;
  users_by_role: Record<string, number>;
  users_by_department: Record<string, number>;
  recent_registrations: number;
  recent_logins: number;
}

// Access control entry
export interface AccessControlEntry {
  id: string;
  user_id: string;
  user_email: string;
  resource: string;
  permissions: Permission[];
  granted_by: string;
  granted_at: string;
  expires_at?: string;
}

