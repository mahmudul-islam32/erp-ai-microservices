import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { Card } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';
export const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div>
      <PageHeader title="Sales Orders" subtitle="Manage customer orders" actions={<Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate('/dashboard/sales/orders/create')}>Create Order</Button>} />
      <Card padding="lg"><p className="text-slate-600">Orders list coming soon...</p></Card>
    </div>
  );
};
