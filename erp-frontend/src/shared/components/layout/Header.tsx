import React, { useState, useEffect } from 'react';
import { Menu, X, LogOut, User, Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Menu as HeadlessMenu, Transition } from '@headlessui/react';
import { clsx } from 'clsx';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { logout } from '../../../features/auth/store/authSlice';
import { toggleTheme } from '../../../features/theme/store/themeSlice';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { NotificationBell } from '../../../features/notifications';
import { ChatButton } from '../../../features/chat';
import { settingsApi, SettingsCategory } from '../../../features/settings/services/settingsApi';

interface HeaderProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  showLogo?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ isSidebarOpen, onToggleSidebar, showLogo = false }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { mode } = useAppSelector((state) => state.theme);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>('');

  useEffect(() => {
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
        // Silently fail - use defaults
      }
    };

    loadCompanySettings();
  }, []);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  const handleToggleTheme = () => {
    dispatch(toggleTheme());
  };

  return (
    <header className="w-full bg-white dark:bg-slate-800 shadow-sm z-20 py-3">
      <div className={clsx(
        "flex items-center justify-between",
        showLogo ? "px-4 lg:px-6" : "px-4 lg:px-6"
      )}>
        {/* Left section - Logo and Menu */}
        <div className="flex items-center gap-4">
          {!showLogo && (
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-md text-[#333] hover:bg-slate-50 lg:hidden"
            >
              {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          )}
          {/* Logo - only show when showLogo is true (horizontal layout) */}
          {showLogo && (
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
            >
              {companyLogo ? (
                <img 
                  src={companyLogo} 
                  alt={companyName || 'Company Logo'}
                  className="w-24 h-auto object-contain rounded-lg"
                />
              ) : (
                <>
                  <div className="w-24 h-16 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xl">
                    {(companyName || 'E').charAt(0).toUpperCase()}
                  </div>
                  {companyName && (
                    <span className="text-lg font-bold text-slate-900 dark:text-white">{companyName}</span>
                  )}
                </>
              )}
            </button>
          )}
        </div>

        {/* Right section */}
        <div className="flex items-center gap-3">
          {/* Dark Mode Toggle */}
          <button
            onClick={handleToggleTheme}
            className="p-2 rounded-md text-[#333] hover:bg-slate-50 transition-colors"
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
            <HeadlessMenu.Button className="flex items-center gap-2 p-2 rounded-md hover:bg-slate-50 transition-colors">
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
                <p className="text-sm font-medium text-slate-900">
                  {user?.full_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'User'}
                </p>
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
                  <p className="text-sm font-medium text-slate-900">
                    {user?.full_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'User'}
                  </p>
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
                        onClick={() => navigate('/dashboard/profile')}
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

