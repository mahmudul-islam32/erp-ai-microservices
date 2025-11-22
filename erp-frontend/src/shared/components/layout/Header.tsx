import React from 'react';
import { Menu, X, LogOut, User, Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Menu as HeadlessMenu, Transition } from '@headlessui/react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { logout } from '../../../features/auth/store/authSlice';
import { toggleTheme } from '../../../features/theme/store/themeSlice';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { NotificationBell } from '../../../features/notifications';
import { ChatButton } from '../../../features/chat';

interface HeaderProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isSidebarOpen, onToggleSidebar }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { mode } = useAppSelector((state) => state.theme);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  const handleToggleTheme = () => {
    dispatch(toggleTheme());
  };

  return (
    <header className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left section */}
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
          >
            {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-3">
          {/* Dark Mode Toggle */}
          <button
            onClick={handleToggleTheme}
            className="p-2 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle dark mode"
          >
            {mode === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>

          {/* Chat */}
          <ChatButton />
          
          {/* Notifications */}
          <NotificationBell />

          {/* User menu */}
          <HeadlessMenu as="div" className="relative">
            <HeadlessMenu.Button className="flex items-center gap-2 p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-medium">
                {user?.profile_image ? (
                  <img 
                    src={user.profile_image} 
                    alt={user?.full_name || 'User'}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  (user?.full_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'User').charAt(0).toUpperCase()
                )}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {user?.full_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'User'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{user?.role || 'User'}</p>
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
              <HeadlessMenu.Items className="absolute right-0 mt-2 w-56 origin-top-right bg-white dark:bg-slate-800 rounded-md shadow-lg border border-slate-200 dark:border-slate-700 focus:outline-none">
                <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {user?.full_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'User'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{user?.email}</p>
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
                        onClick={() => navigate('/dashboard/profile')}
                        className={`${
                          active ? 'bg-slate-100 dark:bg-slate-700' : ''
                        } flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-md`}
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
                          active ? 'bg-slate-100 dark:bg-slate-700' : ''
                        } flex w-full items-center gap-2 px-3 py-2 text-sm text-danger-600 dark:text-danger-400 rounded-md`}
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

