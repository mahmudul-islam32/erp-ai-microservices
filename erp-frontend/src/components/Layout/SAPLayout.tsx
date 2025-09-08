import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { SAPSidebar } from './SAPSidebar';
import { SAPHeader } from './SAPHeader';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setSidebarCollapsed } from '../../store/slices/uiSlice';
import './SAPLayout.css';

export const SAPLayout: React.FC = () => {
  const dispatch = useAppDispatch();
  const { sidebarCollapsed } = useAppSelector(state => state.ui.navigation);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSidebarToggle = () => {
    dispatch(setSidebarCollapsed(!sidebarCollapsed));
  };

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="sap-layout">
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="sap-sidebar-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`sap-sidebar-container ${mobileMenuOpen ? 'sap-sidebar-open' : ''}`}>
        <SAPSidebar collapsed={sidebarCollapsed} />
      </div>
      
      {/* Main Content */}
      <div className="sap-main-container">
        {/* Header */}
        <SAPHeader onMenuToggle={handleMobileMenuToggle} />
        
        {/* Content */}
        <main className="sap-main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
