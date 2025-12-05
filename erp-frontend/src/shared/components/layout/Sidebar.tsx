import React, { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  FileText,
  Warehouse,
  Tag,
  Box,
  UserCog,
  Shield,
  Clock,
  FileSearch,
  MessageSquare,
  DollarSign,
  BookOpen,
  Receipt,
  BarChart3,
  UserCheck,
  Calendar,
  TrendingUp,
  Briefcase,
  GraduationCap,
  Heart,
  BarChart,
  Palette,
  Bot,
} from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';
import { Permission, UserRole } from '../../../features/users/types';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  children?: NavItem[];
  // Permission requirements - item is shown if user has any of these permissions (or all if requireAllPermissions is true)
  requiredPermissions?: (Permission | string)[];
  // If true, user must have ALL requiredPermissions, otherwise ANY is sufficient
  requireAllPermissions?: boolean;
  // Or check if user has access to a service
  requiredService?: 'user' | 'inventory' | 'sales' | 'finance' | 'hr' | 'ai';
  // Or check if user has specific role(s)
  requiredRole?: (UserRole | string)[];
  // Roles that should NOT see this item
  excludedRole?: (UserRole | string)[];
}

// Base navigation configuration with permission requirements
const baseNavigation: NavItem[] = [
  { 
    name: 'Dashboard', 
    path: '/dashboard', 
    icon: LayoutDashboard,
    // Hide dashboard for customers - they only see orders/invoices
    excludedRole: [UserRole.CUSTOMER],
  },
  { 
    name: 'Messages', 
    path: '/dashboard/messages', 
    icon: MessageSquare,
    // Messages accessible to all authenticated users
  },
  { 
    name: 'AI Assistant', 
    path: '/dashboard/ai-assistant', 
    icon: Bot,
    requiredService: 'ai',
    excludedRole: [UserRole.CUSTOMER],
  },
  {
    name: 'Users & Auth',
    path: '/dashboard/users',
    icon: Users,
    requiredService: 'user',
    excludedRole: [UserRole.CUSTOMER],
    children: [
      { 
        name: 'Users', 
        path: '/dashboard/users', 
        icon: Users,
        requiredPermissions: [Permission.USER_READ],
      },
      { 
        name: 'Roles', 
        path: '/dashboard/roles', 
        icon: UserCog,
        requiredPermissions: [Permission.USER_READ],
      },
      { 
        name: 'Access Control', 
        path: '/dashboard/access-control', 
        icon: Shield,
        requiredRole: [UserRole.SUPER_ADMIN],
      },
      { 
        name: 'Security', 
        path: '/dashboard/security', 
        icon: Shield,
        // Security page accessible to all for 2FA setup
      },
      { 
        name: 'Sessions', 
        path: '/dashboard/sessions', 
        icon: Clock,
        requiredPermissions: [Permission.USER_READ],
      },
      { 
        name: 'Audit Logs', 
        path: '/dashboard/audit', 
        icon: FileSearch,
        requiredPermissions: [Permission.USER_READ],
      },
    ],
  },
  {
    name: 'Inventory',
    path: '/dashboard/inventory',
    icon: Package,
    requiredService: 'inventory',
    excludedRole: [UserRole.CUSTOMER],
    children: [
      { 
        name: 'Overview', 
        path: '/dashboard/inventory', 
        icon: LayoutDashboard,
        requiredPermissions: [Permission.INVENTORY_READ],
      },
      { 
        name: 'Products', 
        path: '/dashboard/inventory/products', 
        icon: Box,
        requiredPermissions: [Permission.INVENTORY_READ],
      },
      { 
        name: 'Categories', 
        path: '/dashboard/inventory/categories', 
        icon: Tag,
        requiredPermissions: [Permission.INVENTORY_READ],
      },
      { 
        name: 'Warehouses', 
        path: '/dashboard/inventory/warehouses', 
        icon: Warehouse,
        requiredPermissions: [Permission.INVENTORY_READ],
      },
      { 
        name: 'Stock', 
        path: '/dashboard/inventory/stock', 
        icon: Package,
        requiredPermissions: [Permission.INVENTORY_READ],
      },
      { 
        name: 'Settings', 
        path: '/dashboard/inventory/settings', 
        icon: Settings,
        requiredPermissions: [Permission.INVENTORY_UPDATE, Permission.SETTINGS_READ],
        requireAllPermissions: true,
      },
    ],
  },
  {
    name: 'Sales',
    path: '/dashboard/sales',
    icon: ShoppingCart,
    requiredService: 'sales',
    children: [
      { 
        name: 'Overview', 
        path: '/dashboard/sales', 
        icon: LayoutDashboard,
        requiredPermissions: [Permission.SALES_READ],
        excludedRole: [UserRole.CUSTOMER],
      },
      { 
        name: 'Customers', 
        path: '/dashboard/sales/customers', 
        icon: Users,
        requiredPermissions: [Permission.SALES_READ],
        excludedRole: [UserRole.CUSTOMER],
      },
      { 
        name: 'Orders', 
        path: '/dashboard/sales/orders', 
        icon: ShoppingCart,
        requiredPermissions: [Permission.SALES_READ],
      },
      { 
        name: 'Quotes', 
        path: '/dashboard/sales/quotes', 
        icon: FileText,
        requiredPermissions: [Permission.SALES_READ],
        excludedRole: [UserRole.CUSTOMER],
      },
      { 
        name: 'Invoices', 
        path: '/dashboard/sales/invoices', 
        icon: Receipt,
        requiredPermissions: [Permission.SALES_READ],
      },
      { 
        name: 'Settings', 
        path: '/dashboard/sales/settings', 
        icon: Settings,
        requiredPermissions: [Permission.SALES_UPDATE, Permission.SETTINGS_READ],
        requireAllPermissions: true,
        excludedRole: [UserRole.CUSTOMER],
      },
    ],
  },
  {
    name: 'Finance',
    path: '/dashboard/finance',
    icon: DollarSign,
    requiredService: 'finance',
    excludedRole: [UserRole.CUSTOMER],
    children: [
      { 
        name: 'Overview', 
        path: '/dashboard/finance', 
        icon: LayoutDashboard,
        requiredPermissions: [Permission.FINANCE_READ],
      },
      { 
        name: 'Chart of Accounts', 
        path: '/dashboard/finance/accounts', 
        icon: BookOpen,
        requiredPermissions: [Permission.FINANCE_READ],
      },
      { 
        name: 'Journal Entries', 
        path: '/dashboard/finance/journal-entries', 
        icon: Receipt,
        requiredPermissions: [Permission.FINANCE_READ],
      },
      { 
        name: 'Financial Reports', 
        path: '/dashboard/finance/reports', 
        icon: BarChart3,
        requiredPermissions: [Permission.FINANCE_READ],
      },
      { 
        name: 'Settings', 
        path: '/dashboard/finance/settings', 
        icon: Settings,
        requiredPermissions: [Permission.FINANCE_UPDATE, Permission.SETTINGS_READ],
        requireAllPermissions: true,
      },
    ],
  },
  {
    name: 'HRM',
    path: '/dashboard/hrm',
    icon: UserCheck,
    requiredService: 'hr',
    excludedRole: [UserRole.CUSTOMER],
    children: [
      { 
        name: 'Overview', 
        path: '/dashboard/hrm', 
        icon: LayoutDashboard,
        requiredPermissions: [Permission.HR_READ],
      },
      { 
        name: 'Employees', 
        path: '/dashboard/hrm/employees', 
        icon: Users,
        requiredPermissions: [Permission.HR_READ],
      },
      { 
        name: 'Payroll', 
        path: '/dashboard/hrm/payroll', 
        icon: DollarSign,
        requiredPermissions: [Permission.HR_READ],
      },
      { 
        name: 'Attendance', 
        path: '/dashboard/hrm/attendance', 
        icon: Clock,
        requiredPermissions: [Permission.HR_READ],
      },
      { 
        name: 'Leave Management', 
        path: '/dashboard/hrm/leave', 
        icon: Calendar,
        requiredPermissions: [Permission.HR_READ],
      },
      { 
        name: 'Performance', 
        path: '/dashboard/hrm/performance', 
        icon: TrendingUp,
        requiredPermissions: [Permission.HR_READ],
      },
      { 
        name: 'Recruitment', 
        path: '/dashboard/hrm/recruitment', 
        icon: Briefcase,
        requiredPermissions: [Permission.HR_READ],
      },
      { 
        name: 'Training', 
        path: '/dashboard/hrm/training', 
        icon: GraduationCap,
        requiredPermissions: [Permission.HR_READ],
      },
      { 
        name: 'Benefits', 
        path: '/dashboard/hrm/benefits', 
        icon: Heart,
        requiredPermissions: [Permission.HR_READ],
      },
      { 
        name: 'Analytics', 
        path: '/dashboard/hrm/analytics', 
        icon: BarChart,
        requiredPermissions: [Permission.HR_READ],
      },
    ],
  },
  { 
    name: 'Settings', 
    path: '/dashboard/settings', 
    icon: Settings,
    requiredPermissions: [Permission.SETTINGS_READ],
    excludedRole: [UserRole.CUSTOMER],
    children: [
      { 
        name: 'General', 
        path: '/dashboard/settings', 
        icon: Settings,
        requiredPermissions: [Permission.SETTINGS_READ],
      },
      { 
        name: 'Appearance', 
        path: '/dashboard/settings/appearance', 
        icon: Palette,
        requiredPermissions: [Permission.SETTINGS_READ],
      },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);
  const { hasPermission, hasAnyPermission, hasAllPermissions, hasServiceAccess, hasAnyRole, isSuperAdmin, user } = usePermissions();

  // Filter navigation items based on permissions
  const navigation = useMemo(() => {
    const filterNavItems = (items: NavItem[]): NavItem[] => {
      return items
        .filter((item) => {
          // If item is excluded for customer role, hide it
          if (item.excludedRole && item.excludedRole.length > 0 && user?.role) {
            if (hasAnyRole(item.excludedRole)) {
              return false;
            }
          }
          
          // If item requires specific role(s), check that first
          if (item.requiredRole && item.requiredRole.length > 0) {
            if (!hasAnyRole(item.requiredRole)) {
              return false;
            }
          }
          
          // If item requires service access, check that
          if (item.requiredService) {
            if (!hasServiceAccess(item.requiredService)) {
              return false;
            }
          }
          
          // If item requires specific permissions, check those
          if (item.requiredPermissions && item.requiredPermissions.length > 0) {
            // Use hasAllPermissions if requireAllPermissions is true, otherwise use hasAnyPermission
            const hasRequiredPermissions = item.requireAllPermissions 
              ? hasAllPermissions(item.requiredPermissions)
              : hasAnyPermission(item.requiredPermissions);
            if (!hasRequiredPermissions) {
              return false;
            }
          }
          
          // If item has children, filter them and only show if at least one child is visible
          if (item.children && item.children.length > 0) {
            const filteredChildren = filterNavItems(item.children);
            if (filteredChildren.length === 0) {
              return false; // Hide parent if no children are visible
            }
            return true;
          }
          
          // Show item if no restrictions or all checks passed
          return true;
        })
        .map((item) => {
          // Recursively filter children
          if (item.children && item.children.length > 0) {
            return {
              ...item,
              children: filterNavItems(item.children),
            };
          }
          return item;
        });
    };
    
    return filterNavItems(baseNavigation);
  }, [hasPermission, hasAnyPermission, hasServiceAccess, isSuperAdmin]);

  const toggleExpanded = (path: string) => {
    setExpandedItems((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  const renderNavItem = (item: NavItem, depth: number = 0) => {
    const isExpanded = expandedItems.includes(item.path);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.path}>
        {hasChildren ? (
          <button
            onClick={() => toggleExpanded(item.path)}
            className={clsx(
              'w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors',
              'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700',
              depth > 0 && 'pl-6'
            )}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            <span className="flex-1 text-left">{item.name}</span>
            <svg
              className={clsx('h-4 w-4 transition-transform', isExpanded && 'rotate-90')}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : (
          <NavLink
            to={item.path}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                depth > 0 && 'pl-6',
                isActive
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              )
            }
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            <span>{item.name}</span>
          </NavLink>
        )}
        {hasChildren && isExpanded && (
          <div className="ml-4 mt-1 space-y-1">
            {item.children!.map((child) => renderNavItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => {}}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed top-0 left-0 z-30 h-screen w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-transform duration-300',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold">
                E
              </div>
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100">ERP System</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin">
            {navigation.map((item) => renderNavItem(item))}
          </nav>
        </div>
      </aside>
    </>
  );
};

