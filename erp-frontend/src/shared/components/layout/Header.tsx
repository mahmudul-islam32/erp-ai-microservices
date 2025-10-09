import React from 'react';
import { Menu, X, LogOut, User, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Menu as HeadlessMenu, Transition } from '@headlessui/react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { logout } from '../../../features/auth/store/authSlice';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface HeaderProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isSidebarOpen, onToggleSidebar }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-slate-200">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left section */}
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-md text-slate-600 hover:bg-slate-100 lg:hidden"
          >
            {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <button className="relative p-2 rounded-md text-slate-600 hover:bg-slate-100">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-danger-500 rounded-full" />
          </button>

          {/* User menu */}
          <HeadlessMenu as="div" className="relative">
            <HeadlessMenu.Button className="flex items-center gap-2 p-2 rounded-md hover:bg-slate-100 transition-colors">
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-medium">
                {user?.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-slate-900">{user?.full_name || 'User'}</p>
                <p className="text-xs text-slate-500">{user?.role || 'User'}</p>
              </div>
            </HeadlessMenu.Button>

            <Transition
              enter="transition duration-100 ease-out"
              enterFrom="transform scale-95 opacity-0"
              enterTo="transform scale-100 opacity-100"
              leave="transition duration-75 ease-out"
              leaveFrom="transform scale-100 opacity-100"
              leaveTo="transform scale-95 opacity-0"
            >
              <HeadlessMenu.Items className="absolute right-0 mt-2 w-56 origin-top-right bg-white rounded-md shadow-lg border border-slate-200 focus:outline-none">
                <div className="p-3 border-b border-slate-200">
                  <p className="text-sm font-medium text-slate-900">{user?.full_name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
                  {user?.is_superuser && (
                    <Badge variant="primary" size="sm" className="mt-2">
                      Admin
                    </Badge>
                  )}
                </div>
                <div className="p-1">
                  <HeadlessMenu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => navigate('/dashboard/settings')}
                        className={`${
                          active ? 'bg-slate-100' : ''
                        } flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 rounded-md`}
                      >
                        <User className="h-4 w-4" />
                        Profile Settings
                      </button>
                    )}
                  </HeadlessMenu.Item>
                  <HeadlessMenu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleLogout}
                        className={`${
                          active ? 'bg-slate-100' : ''
                        } flex w-full items-center gap-2 px-3 py-2 text-sm text-danger-600 rounded-md`}
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    )}
                  </HeadlessMenu.Item>
                </div>
              </HeadlessMenu.Items>
            </Transition>
          </HeadlessMenu>
        </div>
      </div>
    </header>
  );
};

