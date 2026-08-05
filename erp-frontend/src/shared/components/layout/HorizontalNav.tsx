import React, { useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';
import { Menu as HeadlessMenu, Transition } from '@headlessui/react';
import { usePermissions } from '../../hooks/usePermissions';
import { baseNavigation, NavItem } from './Sidebar';

export const HorizontalNav: React.FC = () => {
  const location = useLocation();
  const { hasPermission, hasAnyPermission, hasAllPermissions, hasServiceAccess, hasAnyRole, user } = usePermissions();

  // Filter navigation items based on permissions (same logic as Sidebar)
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
              return false;
            }
            return true;
          }
          
          return true;
        })
        .map((item) => {
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
  }, [hasPermission, hasAnyPermission, hasAllPermissions, hasServiceAccess, hasAnyRole, user]);

  const isItemActive = (item: NavItem): boolean => {
    const currentPath = location.pathname;
    return currentPath === item.path;
  };

  const hasActiveChild = (item: NavItem): boolean => {
    if (!item.children) return false;
    const currentPath = location.pathname;
    return item.children.some(child => 
      currentPath === child.path || currentPath.startsWith(child.path + '/')
    );
  };

  return (
    <nav className="flex items-center gap-1 h-full">
      {navigation.map((item) => {
        const isActive = isItemActive(item) || hasActiveChild(item);
        const hasChildren = item.children && item.children.length > 0;

        if (hasChildren) {
          return (
            <HeadlessMenu key={item.path} as="div" className="relative">
              <HeadlessMenu.Button
                className={clsx(
                  'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'text-white/90 hover:bg-white/10 hover:text-white'
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
                <ChevronDown className="h-4 w-4" />
              </HeadlessMenu.Button>

              <Transition
                enter="transition duration-100 ease-out"
                enterFrom="transform scale-95 opacity-0"
                enterTo="transform scale-100 opacity-100"
                leave="transition duration-75 ease-in"
                leaveFrom="transform scale-100 opacity-100"
                leaveTo="transform scale-95 opacity-0"
              >
                <HeadlessMenu.Items className="absolute top-full left-0 mt-1 w-56 origin-top-left bg-white rounded-md shadow-lg border border-slate-200 focus:outline-none z-50">
                  <div className="py-1">
                    {item.children!.map((child) => {
                      const isChildActive = location.pathname === child.path;
                      return (
                        <HeadlessMenu.Item key={child.path}>
                          {({ active }) => (
                            <NavLink
                              to={child.path}
                              className={clsx(
                                'flex items-center gap-3 px-4 py-2 text-sm transition-colors',
                                isChildActive || active
                                  ? 'bg-primary text-white'
                                  : 'text-slate-700 hover:bg-slate-100'
                              )}
                            >
                              <child.icon className="h-4 w-4" />
                              <span>{child.name}</span>
                            </NavLink>
                          )}
                        </HeadlessMenu.Item>
                      );
                    })}
                  </div>
                </HeadlessMenu.Items>
              </Transition>
            </HeadlessMenu>
          );
        }

        return (
          <NavLink
            key={item.path}
            to={item.path}
            end
            className={({ isActive: navIsActive }) =>
              clsx(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors',
                navIsActive
                  ? 'bg-white/20 text-white'
                  : 'text-white/90 hover:bg-white/10 hover:text-white'
              )
            }
          >
            <item.icon className="h-4 w-4" />
            <span>{item.name}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};
