import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Search } from 'lucide-react';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { Card } from '../../../shared/components/ui/Card';
import { Input } from '../../../shared/components/ui/Input';
import { Table, Column } from '../../../shared/components/ui/Table';
import { Badge } from '../../../shared/components/ui/Badge';
import { formatCurrency, formatDate } from '../../../shared/utils/format';
import { invoicesApi } from '../services/invoicesApi';
import { toast } from 'sonner';

export const InvoicesPage: React.FC = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const data = await invoicesApi.getAll();
      setInvoices(data.items || []);
    } catch (error) {
      toast.error('Failed to load invoices');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusVariant = (status: string): 'success' | 'warning' | 'danger' | 'default' => {
    const statusMap: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
      paid: 'success',
      sent: 'warning',
      draft: 'default',
      overdue: 'danger',
      cancelled: 'danger',
    };
    return statusMap[status.toLowerCase()] || 'default';
  };

  const columns: Column<any>[] = [
    { key: 'invoice_number', header: 'Invoice #', width: '120px' },
    {
      key: 'customer',
      header: 'Customer',
      render: (invoice) => invoice.customer 
        ? `${invoice.customer.first_name} ${invoice.customer.last_name}${invoice.customer.company_name ? ` (${invoice.customer.company_name})` : ''}`
        : invoice.customer_id,
    },
    {
      key: 'total_amount',
      header: 'Amount',
      render: (invoice) => formatCurrency(invoice.total_amount),
    },
    {
      key: 'status',
      header: 'Status',
      render: (invoice) => (
        <Badge variant={getStatusVariant(invoice.status)}>
          {invoice.status.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'due_date',
      header: 'Due Date',
      render: (invoice) => invoice.due_date ? formatDate(invoice.due_date, 'PP') : '-',
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (invoice) => formatDate(invoice.created_at, 'PP'),
    },
  ];

  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
      invoice.customer?.first_name?.toLowerCase().includes(search.toLowerCase()) ||
      invoice.customer?.last_name?.toLowerCase().includes(search.toLowerCase()) ||
      invoice.customer?.company_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle="Manage customer invoices"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Sales', href: '/dashboard/sales' },
          { label: 'Invoices' },
        ]}
      />

      <Card>
        <div className="p-4 border-b border-slate-200">
          <Input
            placeholder="Search invoices..."
            leftIcon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Table
          data={filteredInvoices}
          columns={columns}
          isLoading={isLoading}
          emptyMessage="No invoices found"
        />
      </Card>
    </div>
  );
};
