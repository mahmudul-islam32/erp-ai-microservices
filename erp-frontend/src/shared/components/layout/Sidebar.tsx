import React, { useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
import { useAppSelector } from '../../../app/hooks';
import { settingsApi, SettingsCategory } from '../../../features/settings/services/settingsApi';
import { useNavigate } from 'react-router-dom';

export interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  children?: NavItem[];
  // Badge count to display on the right side of the item
  badge?: number;
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
export const baseNavigation: NavItem[] = [
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
  const manuallyCollapsedRef = React.useRef<Set<string>>(new Set());
  const previousPathnameRef = React.useRef<string>('');
  const navigationRef = React.useRef<NavItem[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const { hasPermission, hasAnyPermission, hasAllPermissions, hasServiceAccess, hasAnyRole, isSuperAdmin, user } = usePermissions();
  const { user: authUser } = useAppSelector((state) => state.auth);
  const [companyLogo, setCompanyLogo] = React.useState<string | null>(null);
  const [companyName, setCompanyName] = React.useState<string>('');

  React.useEffect(() => {
    const loadCompanySettings = async () => {
      try {
        const companySettings = await settingsApi.getByCategory(SettingsCategory.COMPANY);
        if (companySettings.company_info) {
          if (companySettings.company_info.logo_url) {
            setCompanyLogo(companySettings.company_info.logo_url);
          }
          if (companySettings.company_info.company_name) {
            setCompanyName(companySettings.company_info.company_name);
          }
        }
      } catch (error) {
        console.error('Error loading company settings:', error);
      }
    };

    loadCompanySettings();
  }, []);

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
    
    const filtered = filterNavItems(baseNavigation);
    navigationRef.current = filtered;
    return filtered;
  }, [hasPermission, hasAnyPermission, hasAllPermissions, hasServiceAccess, hasAnyRole, isSuperAdmin, user]);

  const toggleExpanded = (path: string) => {
    setExpandedItems((prev) => {
      const isCurrentlyExpanded = prev.includes(path);
      if (isCurrentlyExpanded) {
        // User is closing it - remember this manual action immediately
        manuallyCollapsedRef.current.add(path);
        return prev.filter((p) => p !== path);
      } else {
        // User is opening it - remove from manually collapsed if it was there
        manuallyCollapsedRef.current.delete(path);
        return [...prev, path];
      }
    });
  };

  // Auto-expand parent items when their children are active
  React.useEffect(() => {
    // Only run if pathname actually changed
    if (location.pathname === previousPathnameRef.current) {
      return;
    }
    
    previousPathnameRef.current = location.pathname;
    
    const findActiveParents = (items: NavItem[]): string[] => {
      const activeParents: string[] = [];
      const currentPath = location.pathname;
      
      items.forEach(item => {
        if (item.children) {
          // Check if current path matches the parent path exactly
          const isParentActive = currentPath === item.path;
          
          // Check if any child matches
          const hasActiveChild = item.children.some(child => {
            return currentPath === child.path || currentPath.startsWith(child.path + '/');
          });
          
          if (isParentActive || hasActiveChild) {
            activeParents.push(item.path);
            // Also check nested children recursively
            const nestedParents = findActiveParents(item.children);
            activeParents.push(...nestedParents);
          }
        }
      });
      
      return activeParents;
    };
    
    const activeParents = findActiveParents(navigationRef.current);
    if (activeParents.length > 0) {
      setExpandedItems((prev) => {
        // Only add parents that aren't manually collapsed
        const parentsToAdd = activeParents.filter(path => !manuallyCollapsedRef.current.has(path));
        if (parentsToAdd.length === 0) {
          return prev; // No new items to add
        }
        const newExpanded = [...new Set([...prev, ...parentsToAdd])];
        // Only update if there are actually new items to add
        if (newExpanded.length === prev.length) {
          return prev; // No change
        }
        return newExpanded;
      });
    }
  }, [location.pathname]); // Removed navigation from dependencies - using ref instead

  // Helper function to check if a path matches the current location
  // For parent items: only active if the path itself matches (not if a child is active)
  // For child items: active if the path matches
  const isItemActive = (item: NavItem): boolean => {
    const currentPath = location.pathname;
    
    // Only check if current path exactly matches the item path
    // Don't check children - that would make parent active when child is active
    return currentPath === item.path;
  };

  const renderNavItem = (item: NavItem, depth: number = 0, isLast: boolean = false) => {
    const isExpanded = expandedItems.includes(item.path);
    const hasChildren = item.children && item.children.length > 0;
    const isActive = isItemActive(item);

    return (
      <div key={item.path}>
        {hasChildren ? (
          <>
            <div className="mx-2">
              <button
                onClick={() => toggleExpanded(item.path)}
                className={clsx(
                  'w-full flex items-center gap-3 py-3 text-sm font-normal transition-colors',
                  depth > 0 && 'pl-6',
                  isActive
                    ? 'bg-slate-100 text-[#333] px-4'
                    : 'text-[#333] hover:bg-slate-50 px-4'
                )}
              >
                <item.icon className={clsx('h-5 w-5 flex-shrink-0', isActive && 'text-primary')} />
                <span className="flex-1 text-left">{item.name}</span>
                {item.badge !== undefined && (
                  <span className={clsx(
                    'text-xs font-medium px-2 py-0.5 rounded-full',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'bg-slate-200 text-slate-600'
                  )}>
                    {item.badge}
                  </span>
                )}
                <svg
                  className={clsx('h-4 w-4 transition-transform flex-shrink-0', isExpanded && 'rotate-90', isActive && 'text-primary')}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mx-2">
              <NavLink
                to={item.path}
                end
                className={({ isActive }) =>
                  clsx(
                    'w-full flex items-center gap-3 py-3 text-sm font-normal transition-colors',
                    depth > 0 && 'pl-6',
                    isActive
                      ? 'bg-slate-100 text-[#333] px-4'
                      : 'text-[#333] hover:bg-slate-50 px-4'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={clsx('h-5 w-5 flex-shrink-0', isActive && 'text-primary')} />
                    <span className="flex-1">{item.name}</span>
                    {item.badge !== undefined && (
                      <span className={clsx(
                        'text-xs font-medium px-2 py-0.5 rounded-full',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'bg-slate-200 text-slate-600'
                      )}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            </div>
          </>
        )}
        {hasChildren && isExpanded && (
          <div className="ml-4 mt-1 space-y-1">
            {item.children!.map((child, index) => 
              renderNavItem(child, depth + 1, index === item.children!.length - 1)
            )}
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
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => {}}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed top-0 left-0 bottom-0 z-30 w-64 bg-white dark:bg-slate-800 shadow-sm transition-transform duration-300',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* User Information Section - at top */}
          <div className="px-4 pt-6 pb-4 border-b border-slate-200">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full overflow-hidden mb-3 bg-primary flex items-center justify-center">
                {authUser?.profile_image ? (
                  <img 
                    src={authUser.profile_image} 
                    alt={authUser?.full_name || `${authUser?.first_name || ''} ${authUser?.last_name || ''}`.trim() || 'User'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-xl font-semibold">
                    {(authUser?.full_name || `${authUser?.first_name || ''} ${authUser?.last_name || ''}`.trim() || 'User').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <h3 className="text-base font-semibold text-slate-900">
                {authUser?.full_name || `${authUser?.first_name || ''} ${authUser?.last_name || ''}`.trim() || 'User'}
              </h3>
            </div>
          </div>
          
          {/* Logo Section - under profile */}
          <div className="px-4 pt-4 pb-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer w-full justify-center"
            >
              {companyLogo ? (
                <img 
                  src={companyLogo} 
                  alt={companyName || 'Company Logo'}
                  className="h-12 w-auto object-contain rounded-lg"
                />
              ) : (
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-lg">
                  {(companyName || 'E').charAt(0).toUpperCase()}
                </div>
              )}
              {companyName && (
                <div className="flex flex-col items-start">
                  <span className="text-base font-bold text-slate-900">{companyName}</span>
                  <span className="text-xs text-slate-500">Responsive Dashboard</span>
                </div>
              )}
            </button>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-2 pt-6 scrollbar-thin px-4">
            {navigation.map((item, index) => 
              renderNavItem(item, 0, index === navigation.length - 1)
            )}
          </nav>
        </div>
      </aside>
    </>
  );
};

