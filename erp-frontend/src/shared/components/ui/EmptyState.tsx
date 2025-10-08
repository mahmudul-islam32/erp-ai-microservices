import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
}) => {
  return (
    <div className="text-center py-12">
      {Icon && (
        <Icon className="mx-auto h-12 w-12 text-slate-400" />
      )}
      <h3 className="mt-4 text-lg font-medium text-slate-900">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-slate-500">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};

