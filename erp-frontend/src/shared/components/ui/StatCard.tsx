import React from 'react';
import { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

export interface StatCardProps {
  /**
   * The title/label of the stat card
   */
  label: string;
  
  /**
   * The value to display
   */
  value: string | number;
  
  /**
   * Optional icon component
   */
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
  
  /**
   * Icon background color variant
   */
  iconVariant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'gray';
  
  /**
   * Optional description or subtitle
   */
  description?: string;
  
  /**
   * Optional click handler
   */
  onClick?: () => void;
  
  /**
   * Custom className
   */
  className?: string;
}

/**
 * StatCard - A reusable statistics card component
 * 
 * @example
 * ```tsx
 * <StatCard
 *   label="Total Users"
 *   value={150}
 *   icon={Users}
 *   iconVariant="primary"
 * />
 * ```
 */
export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  iconVariant = 'primary',
  description,
  onClick,
  className,
}) => {
  const iconVariants = {
    primary: 'bg-primary-100 text-primary-600',
    success: 'bg-green-100 text-green-600',
    warning: 'bg-yellow-100 text-yellow-600',
    danger: 'bg-red-100 text-red-600',
    info: 'bg-blue-100 text-blue-600',
    gray: 'bg-gray-100 text-gray-600',
  };

  return (
    <div
      className={clsx(
        'bg-white rounded-lg shadow p-6',
        onClick && 'cursor-pointer hover:shadow-md transition-shadow',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center">
        {Icon && (
          <div className={clsx('flex-shrink-0 rounded-md p-3', iconVariants[iconVariant])}>
            <Icon className="h-6 w-6" />
          </div>
        )}
        <div className={clsx(Icon ? 'ml-5' : '')}>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {description && (
            <p className="mt-1 text-xs text-gray-500">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
};

