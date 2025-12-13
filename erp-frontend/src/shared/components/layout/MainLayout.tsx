import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AppearanceLoader } from '../AppearanceLoader';

export const MainLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <>
      <AppearanceLoader />
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        {/* Fixed Header with margins */}
        <div className="fixed top-4 left-6 right-6 z-20">
          <Header isSidebarOpen={isSidebarOpen} onToggleSidebar={toggleSidebar} />
        </div>
        
        {/* Fixed Sidebar - aligned with dashboard content */}
        <Sidebar isOpen={isSidebarOpen} />
        
        {/* Main Content Area - aligned with sidebar (sidebar: left-6 (24px) + w-64 (256px) + gap-4 (16px) = 296px) */}
        <main className="fixed top-24 left-6 right-6 lg:left-[296px] lg:right-6 bottom-4 overflow-y-auto bg-slate-50 dark:bg-slate-900 scrollbar-hide mt-6">
          <Outlet />
        </main>
      </div>
    </>
  );
};

