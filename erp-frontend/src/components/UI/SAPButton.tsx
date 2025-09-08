import React from 'react';
import './SAPButton.css';

interface SAPButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export const SAPButton: React.FC<SAPButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = ''
}) => {
  return (
    <button
      type={type}
      className={`sap-button sap-button-${variant} sap-button-${size} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading && <span className="sap-button-spinner"></span>}
      <span className={loading ? 'sap-button-text-loading' : 'sap-button-text'}>
        {children}
      </span>
    </button>
  );
};
