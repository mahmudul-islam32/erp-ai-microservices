import React from 'react';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { Card, CardContent } from '../../../shared/components/ui/Card';
import { ShoppingCart, Users, DollarSign } from 'lucide-react';

export const SalesDashboardPage: React.FC = () => {
  return (
    <div>
      <PageHeader title="Sales Dashboard" subtitle="Overview of your sales performance" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card><CardContent className="p-6"><div className="flex items-center gap-3"><DollarSign className="h-8 w-8 text-success-600" /><div><p className="text-sm text-slate-600">Total Revenue</p><h3 className="text-2xl font-bold">$45,231</h3></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center gap-3"><ShoppingCart className="h-8 w-8 text-primary-600" /><div><p className="text-sm text-slate-600">Total Orders</p><h3 className="text-2xl font-bold">1,234</h3></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center gap-3"><Users className="h-8 w-8 text-warning-600" /><div><p className="text-sm text-slate-600">Total Customers</p><h3 className="text-2xl font-bold">892</h3></div></div></CardContent></Card>
      </div>
    </div>
  );
};
