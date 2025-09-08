import React from 'react';
import './SAPPageLayout.css';

interface SAPPageLayoutProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const SAPPageLayout: React.FC<SAPPageLayoutProps> = ({
  title,
  subtitle,
  actions,
  children,
  className = ''
}) => {
  return (
    <div className={`sap-page-layout ${className}`}>
      <div className="sap-page-header">
        <div className="sap-page-title-section">
          <h1 className="sap-page-title">{title}</h1>
          {subtitle && <p className="sap-page-subtitle">{subtitle}</p>}
        </div>
        {actions && (
          <div className="sap-page-actions">
            {actions}
          </div>
        )}
      </div>
      
      <div className="sap-page-content">
        {children}
      </div>
    </div>
  );
};
