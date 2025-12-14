import React from 'react';
import { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { Card, CardContent } from './Card';

export interface StatCardProps {
  /**
   * The title/label of the stat card
   */
  title: string;
  
  /**
   * The value to display
   */
  value: string | number;
  
  /**
   * Optional subtitle/description
   */
  subtitle?: string;
  
  /**
   * Optional icon component
   */
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
  
  /**
   * Icon background color variant
   */
  color?: 'primary' | 'success' | 'warning' | 'danger';
  
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
 * StatCard - A reusable statistics card component matching dashboard design
 * 
 * @example
 * ```tsx
 * <StatCard
 *   title="Total Revenue"
 *   value="$12,345"
 *   subtitle="From 50 paid orders"
 *   icon={DollarSign}
 *   color="success"
 * />
 * ```
 */
export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'primary',
  onClick,
  className,
}) => {
  const colorClasses = {
    success: 'bg-success-100 text-success-600',
    primary: 'bg-primary-100 text-primary-600',
    warning: 'bg-warning-100 text-warning-600',
    danger: 'bg-danger-100 text-danger-600',
  };

  return (
    <Card 
      variant="dashboard" 
      className={clsx(onClick && 'cursor-pointer hover:shadow-md transition-shadow', className)}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">{title}</p>
            <h3 className="text-3xl font-bold text-slate-900 mt-2">{value}</h3>
            {subtitle && (
              <p className="text-sm mt-2 text-slate-500">{subtitle}</p>
            )}
          </div>
          {Icon && (
            <div className={`p-3 rounded-full ${colorClasses[color]}`}>
              <Icon className="h-8 w-8" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

