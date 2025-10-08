import React from 'react';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { Card } from '../../../shared/components/ui/Card';

export const SecurityPage: React.FC = () => {
  return (
    <div>
      <PageHeader title="Security Settings" subtitle="Configure security and authentication settings" />
      <Card padding="lg">
        <p className="text-slate-600">Security settings interface coming soon...</p>
      </Card>
    </div>
  );
};
