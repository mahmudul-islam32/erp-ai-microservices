import React from 'react';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { Card } from '../../../shared/components/ui/Card';

export const QuotesPage: React.FC = () => {
  return (
    <div>
      <PageHeader
        title="Sales Quotes"
        subtitle="Manage sales quotes and proposals"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Sales', href: '/dashboard/sales' },
          { label: 'Quotes' },
        ]}
      />
      <Card padding="lg">
        <p className="text-slate-600">Quotes management interface coming soon...</p>
      </Card>
    </div>
  );
};
