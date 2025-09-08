import React from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setActiveMenu, toggleMenuExpansion } from '../../store/slices/uiSlice';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/auth';
import { 
  IconHome, 
  IconUsers, 
  IconUserPlus, 
  IconUsersGroup, 
  IconShield, 
  IconLock, 
  IconKey, 
  IconFingerprint,
  IconPackage, 
  IconShoppingCart, 
  IconCurrencyDollar, 
  IconUserCircle,
  IconCash,
  IconBriefcase,
  IconReportAnalytics,
  IconCalendar,
  IconSettings,
  IconChevronRight,
  IconChevronDown
} from '@tabler/icons-react';
import './SAPSidebar.css';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  children?: NavItem[];
  roles?: UserRole[];
}

const getNavigationItems = (userRole: UserRole): NavItem[] => {
  const hasRole = (roles: UserRole[]) => roles.includes(userRole);

  return [
    {
      id: 'HOME',
      label: 'HOME',
      icon: <IconHome size={20} />,
      path: '/dashboard'
    },
    {
      id: 'AUTHENTICATION',
      label: 'AUTHENTICATION & USERS',
      icon: <IconUsers size={20} />,
      children: [
        {
          id: 'USER_MANAGEMENT',
          label: 'USER MANAGEMENT',
          icon: <IconUsers size={16} />,
          path: '/dashboard/users',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER]
        },
        {
          id: 'CREATE_USER',
          label: 'CREATE USER',
          icon: <IconUserPlus size={16} />,
          path: '/dashboard/users/create',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN]
        },
        {
          id: 'ROLE_MANAGEMENT',
          label: 'ROLE MANAGEMENT',
          icon: <IconUsersGroup size={16} />,
          path: '/dashboard/roles',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN]
        },
        {
          id: 'SECURITY_SETTINGS',
          label: 'SECURITY SETTINGS',
          icon: <IconShield size={16} />,
          path: '/dashboard/security',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN]
        },
        {
          id: 'ACCESS_CONTROL',
          label: 'ACCESS CONTROL',
          icon: <IconLock size={16} />,
          path: '/dashboard/access-control',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN]
        },
        {
          id: 'SESSION_MANAGEMENT',
          label: 'SESSION MANAGEMENT',
          icon: <IconKey size={16} />,
          path: '/dashboard/sessions',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN]
        },
        {
          id: 'AUDIT_LOGS',
          label: 'AUDIT LOGS',
          icon: <IconFingerprint size={16} />,
          path: '/dashboard/audit',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER]
        }
      ].filter(item => !item.roles || hasRole(item.roles))
    },
    {
      id: 'INVENTORY',
      label: 'INVENTORY MANAGEMENT',
      icon: <IconPackage size={20} />,
      children: [
        {
          id: 'INVENTORY_DASHBOARD',
          label: 'INVENTORY DASHBOARD',
          icon: <IconReportAnalytics size={16} />,
          path: '/dashboard/inventory',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE]
        },
        {
          id: 'PRODUCTS',
          label: 'PRODUCTS',
          icon: <IconPackage size={16} />,
          path: '/dashboard/inventory/products',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE]
        },
        {
          id: 'STOCK_MANAGEMENT',
          label: 'STOCK MANAGEMENT',
          icon: <IconPackage size={16} />,
          path: '/dashboard/inventory/stock',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE]
        },
        {
          id: 'WAREHOUSES',
          label: 'WAREHOUSES',
          icon: <IconBriefcase size={16} />,
          path: '/dashboard/inventory/warehouses',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER]
        },
        {
          id: 'CATEGORIES',
          label: 'CATEGORIES',
          icon: <IconUsersGroup size={16} />,
          path: '/dashboard/inventory/categories',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER]
        }
      ].filter(item => !item.roles || hasRole(item.roles))
    },
    {
      id: 'SALES',
      label: 'SALES MANAGEMENT',
      icon: <IconShoppingCart size={20} />,
      children: [
        {
          id: 'CREATE_ORDER',
          label: 'CREATE ORDER',
          icon: <IconCash size={16} />,
          path: '/dashboard/sales/orders/create',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE]
        },
        {
          id: 'ORDERS',
          label: 'ORDERS',
          icon: <IconShoppingCart size={16} />,
          path: '/dashboard/sales/orders',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE]
        },
        {
          id: 'CUSTOMERS',
          label: 'CUSTOMERS',
          icon: <IconUserCircle size={16} />,
          path: '/dashboard/sales/customers',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE]
        },
        {
          id: 'INVOICES',
          label: 'INVOICES',
          icon: <IconCurrencyDollar size={16} />,
          path: '/dashboard/sales/invoices',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER]
        },
        {
          id: 'SALES_REPORTS',
          label: 'SALES REPORTS',
          icon: <IconReportAnalytics size={16} />,
          path: '/dashboard/sales/reports',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER]
        }
      ].filter(item => !item.roles || hasRole(item.roles))
    },
    {
      id: 'FINANCE',
      label: 'FINANCE MANAGEMENT',
      icon: <IconCurrencyDollar size={20} />,
      children: [
        {
          id: 'ACCOUNTING',
          label: 'ACCOUNTING',
          icon: <IconCurrencyDollar size={16} />,
          path: '/dashboard/finance/accounting',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER]
        },
        {
          id: 'PAYMENTS',
          label: 'PAYMENTS',
          icon: <IconCurrencyDollar size={16} />,
          path: '/dashboard/finance/payments',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER]
        },
        {
          id: 'BUDGET',
          label: 'BUDGET',
          icon: <IconReportAnalytics size={16} />,
          path: '/dashboard/finance/budget',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER]
        },
        {
          id: 'FINANCE_REPORTS',
          label: 'FINANCE REPORTS',
          icon: <IconReportAnalytics size={16} />,
          path: '/dashboard/finance/reports',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER]
        }
      ].filter(item => !item.roles || hasRole(item.roles))
    },
    {
      id: 'HR',
      label: 'HUMAN RESOURCES',
      icon: <IconUsers size={20} />,
      children: [
        {
          id: 'EMPLOYEES',
          label: 'EMPLOYEES',
          icon: <IconUsers size={16} />,
          path: '/dashboard/hr/employees',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER]
        },
        {
          id: 'PAYROLL',
          label: 'PAYROLL',
          icon: <IconCurrencyDollar size={16} />,
          path: '/dashboard/hr/payroll',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER]
        },
        {
          id: 'ATTENDANCE',
          label: 'ATTENDANCE',
          icon: <IconCalendar size={16} />,
          path: '/dashboard/hr/attendance',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER]
        },
        {
          id: 'PERFORMANCE',
          label: 'PERFORMANCE',
          icon: <IconReportAnalytics size={16} />,
          path: '/dashboard/hr/performance',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER]
        }
      ].filter(item => !item.roles || hasRole(item.roles))
    },
    {
      id: 'BUSINESS_OPERATIONS',
      label: 'BUSINESS OPERATIONS',
      icon: <IconBriefcase size={20} />,
      children: [
        {
          id: 'DEPARTMENTS',
          label: 'DEPARTMENTS',
          icon: <IconBriefcase size={16} />,
          path: '/dashboard/departments',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER]
        },
        {
          id: 'CALENDAR',
          label: 'CALENDAR',
          icon: <IconCalendar size={16} />,
          path: '/dashboard/calendar',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE]
        },
        {
          id: 'REPORTS',
          label: 'REPORTS',
          icon: <IconReportAnalytics size={16} />,
          path: '/dashboard/reports',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER]
        }
      ].filter(item => !item.roles || hasRole(item.roles))
    },
    {
      id: 'SYSTEM',
      label: 'SYSTEM',
      icon: <IconSettings size={20} />,
      children: [
        {
          id: 'SYSTEM_SETTINGS',
          label: 'SYSTEM SETTINGS',
          icon: <IconSettings size={16} />,
          path: '/dashboard/settings',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN]
        }
      ].filter(item => !item.roles || hasRole(item.roles))
    }
  ].filter(item => !item.children || item.children.length > 0);
};

interface SAPSidebarProps {
  collapsed?: boolean;
}

export const SAPSidebar: React.FC<SAPSidebarProps> = ({ collapsed = false }) => {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const { activeMenu, expandedMenus } = useAppSelector(state => state.ui.navigation);

  const navigationItems = user ? getNavigationItems(user.role as UserRole) : [];

  const handleMenuClick = (item: NavItem) => {
    if (item.children) {
      dispatch(toggleMenuExpansion(item.id));
    } else if (item.path) {
      dispatch(setActiveMenu(item.id));
      // Navigate to the path if it exists
      window.location.href = item.path;
    }
  };

  const renderNavItem = (item: NavItem, level: number = 0) => {
    const isExpanded = expandedMenus.includes(item.id);
    const isActive = activeMenu === item.id;
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.id}>
        <div
          className={`sap-nav-item ${isActive ? 'sap-nav-item-active' : ''}`}
          style={{ paddingLeft: `${12 + level * 16}px` }}
          onClick={() => handleMenuClick(item)}
        >
          <div className="sap-nav-item-icon">
            {item.icon}
          </div>
          {!collapsed && (
            <>
              <span className="sap-nav-item-text">{item.label}</span>
              {hasChildren && (
                <div className="sap-nav-item-arrow">
                  {isExpanded ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
                </div>
              )}
            </>
          )}
        </div>
        
        {hasChildren && isExpanded && !collapsed && (
          <div className="sap-nav-children">
            {item.children!.map(child => renderNavItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`sap-sidebar ${collapsed ? 'sap-sidebar-collapsed' : ''}`}>
      {/* Logo Section */}
      <div className="sap-sidebar-header">
        <div className="sap-logo">
          <div className="sap-logo-icon">
            <div className="sap-logo-circle">
              <div className="sap-logo-inner"></div>
            </div>
          </div>
          {!collapsed && (
            <div className="sap-logo-text">
              <span className="sap-logo-title">ERP System</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="sap-sidebar-nav">
        {navigationItems.map(item => renderNavItem(item))}
      </div>

      {/* Footer */}
      {!collapsed && (
        <div className="sap-sidebar-footer">
          <div className="sap-footer-links">
            <a href="#" className="sap-footer-link">Term and Conditions</a>
            <span className="sap-footer-separator">|</span>
            <a href="#" className="sap-footer-link">Release Notes</a>
            <span className="sap-footer-separator">|</span>
            <a href="#" className="sap-footer-link">User Guide</a>
            <span className="sap-footer-separator">|</span>
            <a href="#" className="sap-footer-link">Support</a>
            <span className="sap-footer-separator">|</span>
            <a href="#" className="sap-footer-link">Audit Reports</a>
          </div>
          <div className="sap-footer-copyright">
            <div className="sap-footer-logo-small">
              <div className="sap-logo-circle-small">
                <div className="sap-logo-inner-small"></div>
              </div>
            </div>
            <span>Copyright © ERP System 2024</span>
          </div>
        </div>
      )}
    </div>
  );
};
