import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Download, Eye, Plus } from 'lucide-react';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { Card } from '../../../shared/components/ui/Card';
import { Table, Column } from '../../../shared/components/ui/Table';
import { Badge } from '../../../shared/components/ui/Badge';
import { Button } from '../../../shared/components/ui/Button';
import { formatCurrency, formatDate } from '../../../shared/utils/format';
import { invoicesApi } from '../services/invoicesApi';
import { toast } from 'sonner';
import { usePermissions } from '../../../shared/hooks/usePermissions';
import { Permission, UserRole } from '../../users/types';
import { InvoiceFilters as InvoiceFiltersComponent, type InvoiceFilters } from '../components/InvoiceFilters';

export const InvoicesPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission, user } = usePermissions();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<InvoiceFilters>({});
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  
  const isCustomer = user?.role === UserRole.CUSTOMER;
  const canCreate = hasPermission(Permission.SALES_CREATE) && !isCustomer;

  useEffect(() => {
    fetchInvoices();
  }, [isCustomer, user?.email]);

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching invoices...');
      // Backend will automatically filter by customer if user is customer
      const data = await invoicesApi.getAll();
      console.log('Invoices data received:', data);
      console.log('Data items:', data.items);
      console.log('Data items type:', typeof data.items);
      console.log('Data items is array:', Array.isArray(data.items));
      console.log('Data items length:', data.items?.length);
      
      const invoiceList = Array.isArray(data.items) ? data.items : [];
      console.log('Setting invoices to:', invoiceList);
      setInvoices(invoiceList);
      
      if (invoiceList.length === 0) {
        console.log('No invoices found in database');
        toast.info('No invoices found. Create your first invoice!');
      } else {
        console.log(`Loaded ${invoiceList.length} invoices`);
      }
    } catch (error: any) {
      console.error('Error fetching invoices:', error);
      console.error('Error response:', error?.response);
      console.error('Error response data:', error?.response?.data);
      const errorMessage = error?.response?.data?.detail || error?.message || 'Failed to load invoices';
      toast.error(`Failed to load invoices: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPdf = async (invoiceId: string, invoiceNumber: string) => {
    try {
      setDownloadingIds((prev) => new Set(prev).add(invoiceId));
      
      const blob = await invoicesApi.downloadPdf(invoiceId);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      toast.error('Failed to download invoice');
    } finally {
      setDownloadingIds((prev) => {
        const next = new Set(prev);
        next.delete(invoiceId);
        return next;
      });
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
      render: (invoice) => invoice.customer_name || (invoice.customer 
        ? `${invoice.customer.first_name} ${invoice.customer.last_name}${invoice.customer.company_name ? ` (${invoice.customer.company_name})` : ''}`
        : invoice.customer_id),
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
      key: 'balance_due',
      header: 'Balance Due',
      render: (invoice) => (
        <span className={invoice.balance_due > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
          {formatCurrency(invoice.balance_due || 0)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '150px',
      render: (invoice) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              const invoiceId = invoice.id || invoice._id || invoice.invoice_number;
              console.log('View button clicked:', { invoiceId, invoice });
              if (!invoiceId || invoiceId === 'undefined') {
                console.error('Invalid invoice ID:', invoice);
                toast.error('Invalid invoice ID. Please try again.');
                return;
              }
              navigate(`/dashboard/sales/invoices/${invoiceId}`);
            }}
            leftIcon={<Eye className="h-4 w-4" />}
          >
            View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              const invoiceId = invoice.id || invoice._id || invoice.invoice_number;
              console.log('PDF download clicked:', { invoiceId, invoice });
              if (!invoiceId || invoiceId === 'undefined') {
                console.error('Invalid invoice ID:', invoice);
                toast.error('Invalid invoice ID. Please try again.');
                return;
              }
              handleDownloadPdf(invoiceId, invoice.invoice_number);
            }}
            disabled={downloadingIds.has(invoice.id || invoice._id || invoice.invoice_number)}
            leftIcon={<Download className="h-4 w-4" />}
          >
            {downloadingIds.has(invoice.id) ? '...' : 'PDF'}
          </Button>
        </div>
      ),
    },
  ];

  const filteredInvoices = invoices.filter((invoice) => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        invoice.invoice_number?.toLowerCase().includes(searchLower) ||
        invoice.customer?.first_name?.toLowerCase().includes(searchLower) ||
        invoice.customer?.last_name?.toLowerCase().includes(searchLower) ||
        invoice.customer?.company_name?.toLowerCase().includes(searchLower) ||
        invoice.customer_name?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Status filter
    if (filters.status) {
      if (invoice.status?.toLowerCase() !== filters.status.toLowerCase()) return false;
    }

    return true;
  });

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
        actions={
          canCreate ? (
            <Button
              variant="primary"
              onClick={() => navigate('/dashboard/sales/invoices/create')}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Create Invoice
            </Button>
          ) : null
        }
      />

      <div className="space-y-4">
        <InvoiceFiltersComponent
          filters={filters}
          onFiltersChange={setFilters}
        />
        <Card>
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-slate-600">Loading invoices...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No invoices found</h3>
            <p className="text-slate-600 mb-6">
              {filters.search ? 'Try adjusting your search criteria' : 'Get started by creating your first invoice'}
            </p>
            <Button
              variant="primary"
              onClick={() => navigate('/dashboard/sales/invoices/create')}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Create Invoice
            </Button>
          </div>
        ) : (
          <>
            <div className="p-4 text-sm text-slate-600 border-b">
              Showing {filteredInvoices.length} of {invoices.length} invoice{invoices.length !== 1 ? 's' : ''}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-2 text-xs text-slate-400">
                  Debug: invoices={invoices.length}, filtered={filteredInvoices.length}
                  {invoices.length > 0 && (
                    <div>First invoice ID: {invoices[0]?.id || invoices[0]?._id || 'N/A'}</div>
                  )}
                </div>
              )}
            </div>
            <Table
              data={filteredInvoices}
              columns={columns}
              isLoading={false}
              onRowClick={(invoice) => {
                const invoiceId = invoice.id || invoice._id || invoice.invoice_number;
                console.log('Navigating to invoice:', { invoiceId, invoice });
                if (!invoiceId || invoiceId === 'undefined') {
                  console.error('Invalid invoice ID:', invoice);
                  toast.error('Invalid invoice ID. Please try again.');
                  return;
                }
                navigate(`/dashboard/sales/invoices/${invoiceId}`);
              }}
              emptyMessage="No invoices found"
            />
          </>
        )}
        </Card>
      </div>
    </div>
  );
};
