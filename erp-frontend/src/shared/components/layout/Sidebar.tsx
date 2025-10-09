import React from 'react';
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
} from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  children?: NavItem[];
}

const navigation: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  {
    name: 'Users & Auth',
    path: '/dashboard/users',
    icon: Users,
    children: [
      { name: 'Users', path: '/dashboard/users', icon: Users },
      { name: 'Roles', path: '/dashboard/roles', icon: UserCog },
      { name: 'Access Control', path: '/dashboard/access-control', icon: Shield },
      { name: 'Security', path: '/dashboard/security', icon: Shield },
      { name: 'Sessions', path: '/dashboard/sessions', icon: Clock },
      { name: 'Audit Logs', path: '/dashboard/audit', icon: FileSearch },
    ],
  },
  {
    name: 'Inventory',
    path: '/dashboard/inventory',
    icon: Package,
    children: [
      { name: 'Overview', path: '/dashboard/inventory', icon: LayoutDashboard },
      { name: 'Products', path: '/dashboard/inventory/products', icon: Box },
      { name: 'Categories', path: '/dashboard/inventory/categories', icon: Tag },
      { name: 'Warehouses', path: '/dashboard/inventory/warehouses', icon: Warehouse },
      { name: 'Stock', path: '/dashboard/inventory/stock', icon: Package },
    ],
  },
  {
    name: 'Sales',
    path: '/dashboard/sales',
    icon: ShoppingCart,
    children: [
      { name: 'Overview', path: '/dashboard/sales', icon: LayoutDashboard },
      { name: 'Customers', path: '/dashboard/sales/customers', icon: Users },
      { name: 'Orders', path: '/dashboard/sales/orders', icon: ShoppingCart },
      { name: 'Quotes', path: '/dashboard/sales/quotes', icon: FileText },
      { name: 'Invoices', path: '/dashboard/sales/invoices', icon: FileText },
    ],
  },
  { name: 'Settings', path: '/dashboard/settings', icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);

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
              'text-slate-700 hover:bg-slate-100',
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
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-slate-700 hover:bg-slate-100'
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
          'fixed top-0 left-0 z-30 h-screen w-64 bg-white border-r border-slate-200 transition-transform duration-300',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold">
                E
              </div>
              <span className="text-lg font-bold text-slate-900">ERP System</span>
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

