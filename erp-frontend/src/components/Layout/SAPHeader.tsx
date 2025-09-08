import React from 'react';
import { IconChevronDown, IconBell, IconSettings, IconMenu2 } from '@tabler/icons-react';
import './SAPHeader.css';

interface SAPHeaderProps {
  onMenuToggle?: () => void;
}

export const SAPHeader: React.FC<SAPHeaderProps> = ({ onMenuToggle }) => {
  return (
    <div className="sap-header">
      <div className="sap-header-left">
        <button className="sap-mobile-menu-button" onClick={onMenuToggle}>
          <IconMenu2 size={20} />
        </button>
        <button className="sap-system-selector">
          <span>Choose a System Selector</span>
          <IconChevronDown size={16} />
        </button>
      </div>
      
      <div className="sap-header-right">
        <div className="sap-user-info">
          <span className="sap-user-name">Michael Marks</span>
          <IconChevronDown size={16} />
        </div>
        
        <button className="sap-header-icon">
          <IconBell size={20} />
        </button>
        
        <button className="sap-header-icon">
          <IconSettings size={20} />
        </button>
      </div>
    </div>
  );
};
