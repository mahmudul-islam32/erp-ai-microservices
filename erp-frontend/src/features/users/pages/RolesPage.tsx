import React from 'react';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { Card } from '../../../shared/components/ui/Card';

export const RolesPage: React.FC = () => {
  return (
    <div>
      <PageHeader title="Roles & Permissions" subtitle="Manage user roles and permissions" />
      <Card padding="lg">
        <p className="text-slate-600">Role management interface coming soon...</p>
      </Card>
    </div>
  );
};
