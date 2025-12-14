import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { HorizontalNav } from './HorizontalNav';
import { AppearanceLoader } from '../AppearanceLoader';

export const HorizontalLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <>
      <AppearanceLoader />
      <div className="min-h-screen bg-background-body flex flex-col">
        {/* Top Header Bar - Full Width */}
        <div className="fixed top-0 left-0 right-0 z-30 bg-white dark:bg-slate-800 shadow-sm">
          <div className="w-full">
            <Header isSidebarOpen={isSidebarOpen} onToggleSidebar={toggleSidebar} showLogo={true} />
          </div>
        </div>
        
        {/* Secondary Horizontal Navigation Bar */}
        <div className="fixed top-[64px] left-0 right-0 z-20 bg-primary shadow-sm">
          <div className="flex items-center px-6 h-12">
            <HorizontalNav />
          </div>
        </div>
        
        {/* Main Content Area - starts below navigation */}
        <main className="pt-[116px] pb-4 px-6 flex-1 overflow-y-auto bg-background-body">
          <Outlet />
        </main>
      </div>
    </>
  );
};
