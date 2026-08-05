import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Download, ArrowLeft, User, Calendar, DollarSign } from 'lucide-react';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { Card, CardHeader, CardContent } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';
import { Badge } from '../../../shared/components/ui/Badge';
import { Spinner } from '../../../shared/components/ui/Spinner';
import { formatCurrency, formatDate } from '../../../shared/utils/format';
import { invoicesApi, Invoice } from '../services/invoicesApi';
import { toast } from 'sonner';

export const InvoiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchInvoice();
    }
  }, [id]);

  const fetchInvoice = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching invoice with ID:', id);
      const data = await invoicesApi.getById(id!);
      console.log('Invoice data received:', data);
      // Normalize ID if needed - always ensure id is set
      if (data) {
        data.id = data.id || data._id || data.invoice_number || id;
        console.log('Normalized invoice ID:', data.id);
      }
      setInvoice(data);
    } catch (error: any) {
      console.error('Error fetching invoice:', error);
      const errorMessage = error?.response?.data?.detail || error?.message || 'Failed to load invoice';
      toast.error(errorMessage);
      navigate('/dashboard/sales/invoices');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!invoice || !id) return;
    
    try {
      setIsDownloading(true);
      // Use normalized ID - handle both id, _id, invoice_number, or route param
      const invoiceId = invoice.id || invoice._id || invoice.invoice_number || id;
      console.log('Downloading PDF for invoice ID:', invoiceId);
      console.log('Invoice object:', invoice);
      console.log('Route param id:', id);
      
      if (!invoiceId || invoiceId === 'undefined') {
        throw new Error('Invoice ID is missing');
      }
      
      const blob = await invoicesApi.downloadPdf(invoiceId);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoice.invoice_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Invoice downloaded successfully');
    } catch (error: any) {
      console.error('PDF download error:', error);
      const errorMessage = error?.response?.data?.detail || error?.message || 'Failed to download invoice';
      toast.error(`Failed to download invoice: ${errorMessage}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const getStatusVariant = (status: string): 'success' | 'warning' | 'danger' | 'default' => {
    const statusMap: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
      paid: 'success',
      sent: 'warning',
      draft: 'default',
      overdue: 'danger',
      cancelled: 'danger',
      void: 'danger',
    };
    return statusMap[status.toLowerCase()] || 'default';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Invoice not found</p>
        <Button
          variant="primary"
          onClick={() => navigate('/dashboard/sales/invoices')}
          className="mt-4"
        >
          Back to Invoices
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Invoice ${invoice.invoice_number}`}
        subtitle="Invoice details and information"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Sales', href: '/dashboard/sales' },
          { label: 'Invoices', href: '/dashboard/sales/invoices' },
          { label: invoice.invoice_number },
        ]}
        actions={
          <div className="flex gap-2">
            <Button
              variant="tertiary"
              onClick={() => navigate('/dashboard/sales/invoices')}
              leftIcon={<ArrowLeft className="h-4 w-4" />}
            >
              Back
            </Button>
            <Button
              variant="primary"
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              leftIcon={<Download className="h-4 w-4" />}
            >
              {isDownloading ? 'Downloading...' : 'Download PDF'}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Invoice Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">INVOICE</h2>
                  <p className="text-slate-500 mt-1">Invoice #{invoice.invoice_number}</p>
                </div>
                <Badge variant={getStatusVariant(invoice.status)} size="lg">
                  {invoice.status.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Invoice Date</p>
                  <p className="text-slate-900">
                    {invoice.invoice_date ? formatDate(invoice.invoice_date, 'PP') : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Due Date</p>
                  <p className="text-slate-900">
                    {invoice.due_date ? formatDate(invoice.due_date, 'PP') : '-'}
                  </p>
                </div>
                {invoice.order_number && (
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Order Number</p>
                    <p className="text-slate-900">{invoice.order_number}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-slate-900">Line Items</h3>
            </CardHeader>
            <CardContent>
              {invoice.line_items && invoice.line_items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Item
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Unit Price
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {invoice.line_items.map((item: any, index: number) => (
                        <tr key={index}>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900">
                            {item.product_sku || item.sku || '-'}
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-900">
                            {item.product_name || item.name || '-'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900 text-right">
                            {item.quantity || 0}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900 text-right">
                            {formatCurrency(item.unit_price || 0)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-slate-900 text-right">
                            {formatCurrency(item.line_total || (item.quantity * item.unit_price) || 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-slate-500 text-center py-8">No line items found</p>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {(invoice.notes || invoice.payment_terms) && (
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-slate-900">Notes & Terms</h3>
              </CardHeader>
              <CardContent>
                {invoice.payment_terms && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-slate-500 mb-1">Payment Terms</p>
                    <p className="text-slate-900">{invoice.payment_terms}</p>
                  </div>
                )}
                {invoice.notes && (
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Notes</p>
                    <p className="text-slate-900 whitespace-pre-wrap">{invoice.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Name</p>
                  <p className="text-slate-900">{invoice.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Email</p>
                  <p className="text-slate-900">{invoice.customer_email}</p>
                </div>
                {invoice.billing_address && (
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Billing Address</p>
                    <div className="text-slate-900">
                      {invoice.billing_address.street && <p>{invoice.billing_address.street}</p>}
                      {invoice.billing_address.city && (
                        <p>
                          {invoice.billing_address.city}
                          {invoice.billing_address.state && `, ${invoice.billing_address.state}`}
                          {invoice.billing_address.zip_code && ` ${invoice.billing_address.zip_code}`}
                        </p>
                      )}
                      {invoice.billing_address.country && <p>{invoice.billing_address.country}</p>}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Summary
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-medium text-slate-900">{formatCurrency(invoice.subtotal || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Tax</span>
                  <span className="font-medium text-slate-900">{formatCurrency(invoice.tax_amount || 0)}</span>
                </div>
                {invoice.late_fee_amount && invoice.late_fee_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Late Fee</span>
                    <span className="font-medium text-slate-900">{formatCurrency(invoice.late_fee_amount)}</span>
                  </div>
                )}
                <div className="border-t border-slate-200 pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-slate-900">Total Amount</span>
                    <span className="text-lg font-bold text-slate-900">{formatCurrency(invoice.total_amount || 0)}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Paid Amount</span>
                  <span className="font-medium text-green-600">{formatCurrency(invoice.paid_amount || 0)}</span>
                </div>
                <div className="border-t border-slate-200 pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-slate-900">Balance Due</span>
                    <span className={`text-lg font-bold ${invoice.balance_due > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(invoice.balance_due || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Metadata */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Information
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Created</p>
                  <p className="text-slate-900">
                    {invoice.created_at ? formatDate(invoice.created_at, 'PPp') : '-'}
                  </p>
                </div>
                {invoice.updated_at && (
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Last Updated</p>
                    <p className="text-slate-900">{formatDate(invoice.updated_at, 'PPp')}</p>
                  </div>
                )}
                {invoice.paid_at && (
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Paid At</p>
                    <p className="text-slate-900">{formatDate(invoice.paid_at, 'PPp')}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

