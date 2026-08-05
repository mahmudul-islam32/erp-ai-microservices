import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AppearanceLoader } from '../AppearanceLoader';
import { HorizontalLayout } from './HorizontalLayout';
import { useLayout } from '../../contexts/LayoutContext';

export const MainLayout: React.FC = () => {
  const { layoutType } = useLayout();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Force remount when layout type changes
  useEffect(() => {
    // This will cause a re-render when layoutType changes
  }, [layoutType]);

  // Render horizontal layout if selected
  if (layoutType === 'horizontal') {
    return <HorizontalLayout key={`horizontal-${layoutType}`} />;
  }

  // Default vertical layout
  return (
    <>
      <AppearanceLoader />
      <div className="min-h-screen bg-background-body" key={`vertical-${layoutType}`}>
        {/* Fixed Sidebar - starts from top, includes logo */}
        <Sidebar isOpen={isSidebarOpen} />
        
        {/* Fixed Header - starts from top, matches sidebar, full width */}
        <div className="fixed top-0 left-0 right-0 z-20 lg:left-64">
          <Header isSidebarOpen={isSidebarOpen} onToggleSidebar={toggleSidebar} showLogo={false} />
        </div>
        
        {/* Main Content Area - starts below header, with proper margins */}
        <main className="fixed top-[64px] left-0 right-0 bottom-0 overflow-y-auto bg-background-body scrollbar-hide lg:left-64 px-6 pt-12 pb-8">
          <Outlet />
        </main>
      </div>
    </>
  );
};

