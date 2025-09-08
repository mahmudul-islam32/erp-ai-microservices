import React from 'react';
import './SAPCard.css';

interface SAPCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

export const SAPCard: React.FC<SAPCardProps> = ({
  children,
  title,
  subtitle,
  actions,
  className = '',
  hoverable = false
}) => {
  return (
    <div className={`sap-card ${hoverable ? 'sap-card-hoverable' : ''} ${className}`}>
      {(title || subtitle || actions) && (
        <div className="sap-card-header">
          <div className="sap-card-title-section">
            {title && <h3 className="sap-card-title">{title}</h3>}
            {subtitle && <p className="sap-card-subtitle">{subtitle}</p>}
          </div>
          {actions && (
            <div className="sap-card-actions">
              {actions}
            </div>
          )}
        </div>
      )}
      <div className="sap-card-content">
        {children}
      </div>
    </div>
  );
};
