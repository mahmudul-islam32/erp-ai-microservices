import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Edit, CreditCard, FileText } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { fetchOrderById } from '../store/ordersSlice';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { Card, CardHeader, CardContent } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';
import { Badge } from '../../../shared/components/ui/Badge';
import { Spinner } from '../../../shared/components/ui/Spinner';
import { formatCurrency, formatDate } from '../../../shared/utils/format';
import { Modal } from '../../../shared/components/ui/Modal';
import { StripePaymentForm } from '../components/StripePaymentForm';
import { toast } from 'sonner';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { selectedOrder, isLoading } = useAppSelector((state) => state.orders);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchOrderById(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    // Show payment modal if redirected from create order with stripe
    if (location.state?.showPayment && selectedOrder) {
      console.log('🔍 Location state:', location.state);
      console.log('🔍 Checking payment modal trigger:', {
        showPayment: location.state?.showPayment,
        paymentMethodFromState: location.state?.paymentMethod,
        payment_status: selectedOrder.payment_status,
        orderId: selectedOrder.id,
      });
      
      // Use payment method from navigation state (since backend doesn't store it in order)
      const paymentMethodFromState = location.state?.paymentMethod;
      const paymentStatus = selectedOrder.payment_status;
      
      console.log('Payment check values:', { 
        paymentMethodFromState,
        paymentStatus,
      });
      
      const isStripePayment = paymentMethodFromState?.toLowerCase() === 'stripe';
      const isPending = paymentStatus?.toLowerCase() === 'pending';
      
      console.log('Payment check result:', { 
        isStripePayment, 
        isPending,
      });
      
      if (isPending && isStripePayment) {
        console.log('✅ Opening Stripe payment modal');
        setShowPaymentModal(true);
      } else {
        console.log('❌ Not opening modal:', { 
          reason: !isPending ? `Not pending (status is: ${paymentStatus})` : `Not stripe payment (method from state is: ${paymentMethodFromState})`,
          isPending,
          isStripePayment,
        });
      }
    }
  }, [location.state, selectedOrder]);

  if (isLoading || !selectedOrder) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  const order = selectedOrder;

  const getStatusVariant = (status: string): 'success' | 'warning' | 'danger' | 'default' => {
    const statusMap: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
      completed: 'success',
      confirmed: 'success',
      pending: 'warning',
      processing: 'warning',
      cancelled: 'danger',
      draft: 'default',
    };
    return statusMap[status.toLowerCase()] || 'default';
  };

  const getPaymentStatusVariant = (status: string): 'success' | 'warning' | 'danger' | 'default' => {
    const statusMap: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
      paid: 'success',
      partially_paid: 'warning',
      pending: 'warning',
      failed: 'danger',
      refunded: 'danger',
    };
    return statusMap[status.toLowerCase()] || 'default';
  };

  return (
    <div>
      <PageHeader
        title={`Order ${order.order_number}`}
        subtitle={`Created on ${formatDate(order.order_date, 'PPP')}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Sales', href: '/dashboard/sales' },
          { label: 'Orders', href: '/dashboard/sales/orders' },
          { label: order.order_number },
        ]}
        actions={
          <div className="flex gap-2">
            {order.payment_status === 'pending' && order.payment_method && (
              <>
                {order.payment_method.toLowerCase() === 'stripe' ? (
                  <Button
                    variant="primary"
                    leftIcon={<CreditCard className="h-4 w-4" />}
                    onClick={() => setShowPaymentModal(true)}
                  >
                    Process Stripe Payment
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    leftIcon={<CreditCard className="h-4 w-4" />}
                    onClick={() => {
                      toast.info(`Payment method: ${order.payment_method.toUpperCase()}. Use the payment system to record this payment.`);
                    }}
                  >
                    Record {order.payment_method.toUpperCase()} Payment
                  </Button>
                )}
              </>
            )}
            <Button
              variant="outline"
              leftIcon={<Edit className="h-4 w-4" />}
              onClick={() => navigate(`/dashboard/sales/orders/${id}/edit`)}
            >
              Edit
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title="Order Details" />
            <CardContent>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-slate-500">Order Number</dt>
                  <dd className="mt-1 text-sm text-slate-900 font-mono">{order.order_number}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">Customer</dt>
                  <dd className="mt-1 text-sm text-slate-900">
                    {order.customer 
                      ? `${order.customer.first_name} ${order.customer.last_name}${order.customer.company_name ? ` (${order.customer.company_name})` : ''}`
                      : order.customer_id}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">Status</dt>
                  <dd className="mt-1">
                    <Badge variant={getStatusVariant(order.status)}>
                      {order.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">Payment Status</dt>
                  <dd className="mt-1">
                    <Badge variant={getPaymentStatusVariant(order.payment_status)}>
                      {order.payment_status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">Payment Method</dt>
                  <dd className="mt-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-slate-100 text-slate-800">
                      {order.payment_method ? order.payment_method.toUpperCase() : 'NOT SET'}
                    </span>
                  </dd>
                </div>
                {order.notes && (
                  <div className="md:col-span-2">
                    <dt className="text-sm font-medium text-slate-500">Notes</dt>
                    <dd className="mt-1 text-sm text-slate-900">{order.notes}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader title="Order Items" />
            <CardContent>
              <table className="min-w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Product</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase">Qty</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase">Price</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {order.line_items.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td className="px-4 py-3 text-sm text-slate-900">
                        <div className="font-medium">
                          {item.product_name || item.product?.name || 'Unknown Product'}
                        </div>
                        {(item.product_sku || item.product?.sku) && (
                          <div className="text-xs text-slate-500 mt-1">
                            SKU: {item.product_sku || item.product?.sku}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900 text-right">{item.quantity}</td>
                      <td className="px-4 py-3 text-sm text-slate-900 text-right">{formatCurrency(item.unit_price)}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-900 text-right">
                        {formatCurrency(item.quantity * item.unit_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Order Summary" />
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-medium">{formatCurrency(order.subtotal)}</span>
              </div>
              {order.tax_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Tax</span>
                  <span className="font-medium">{formatCurrency(order.tax_amount)}</span>
                </div>
              )}
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Discount</span>
                  <span className="font-medium text-danger-600">-{formatCurrency(order.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t pt-3">
                <span>Total</span>
                <span className="text-primary-600">{formatCurrency(order.total_amount)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Timestamps" />
            <CardContent>
              <div className="space-y-2">
                <div>
                  <dt className="text-xs font-medium text-slate-500">Created</dt>
                  <dd className="text-sm text-slate-900">{order.created_at ? formatDate(order.created_at) : '-'}</dd>
                </div>
                {order.delivery_date && (
                  <div>
                    <dt className="text-xs font-medium text-slate-500">Delivery Date</dt>
                    <dd className="text-sm text-slate-900">{formatDate(order.delivery_date)}</dd>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Stripe Payment Modal */}
      {showPaymentModal && (
        <Modal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          title="Process Stripe Payment"
          size="md"
        >
          <StripePaymentForm
            orderId={order.id}
            amount={order.total_amount}
            customerId={order.customer_id}
            onSuccess={async () => {
              console.log('🎉 Payment successful - closing modal and refreshing order');
              setShowPaymentModal(false);
              toast.success('Payment processed successfully!');
              
              // Small delay to ensure backend has completed the order update
              await new Promise(resolve => setTimeout(resolve, 500));
              
              // Refresh order data
              await dispatch(fetchOrderById(id!));
              console.log('✅ Order refreshed');
            }}
            onCancel={() => setShowPaymentModal(false)}
          />
        </Modal>
      )}
    </div>
  );
};
