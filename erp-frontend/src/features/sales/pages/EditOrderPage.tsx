import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { fetchOrderById, updateOrder } from '../store/ordersSlice';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { Card, CardHeader, CardContent } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';
import { Select } from '../../../shared/components/ui/Select';
import { Textarea } from '../../../shared/components/ui/Textarea';
import { Spinner } from '../../../shared/components/ui/Spinner';
import { toast } from 'sonner';

export const EditOrderPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { selectedOrder, isLoading } = useAppSelector((state) => state.orders);

  const [orderStatus, setOrderStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchOrderById(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (selectedOrder) {
      setOrderStatus(selectedOrder.status || 'draft');
      setPaymentStatus(selectedOrder.payment_status || 'pending');
      setNotes(selectedOrder.notes || '');
      setInternalNotes(selectedOrder.internal_notes || '');
    }
  }, [selectedOrder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) {
      toast.error('Order ID is missing');
      return;
    }

    setIsSubmitting(true);

    try {
      const updateData = {
        status: orderStatus,
        notes: notes || undefined,
        internal_notes: internalNotes || undefined,
      };

      console.log('Updating order:', updateData);

      const result = await dispatch(updateOrder({ id, data: updateData }));

      if (updateOrder.fulfilled.match(result)) {
        toast.success('Order updated successfully!');
        navigate(`/dashboard/sales/orders/${id}`);
      } else {
        toast.error('Failed to update order');
      }
    } catch (error) {
      console.error('Order update error:', error);
      toast.error('Failed to update order');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !selectedOrder) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`Edit Order ${selectedOrder.order_number}`}
        subtitle="Update order status and details"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Sales', href: '/dashboard/sales' },
          { label: 'Orders', href: '/dashboard/sales/orders' },
          { label: selectedOrder.order_number, href: `/dashboard/sales/orders/${id}` },
          { label: 'Edit' },
        ]}
      />

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Order Information Card */}
          <Card>
            <CardHeader title="Order Information" />
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Order Number
                  </label>
                  <input
                    type="text"
                    value={selectedOrder.order_number}
                    disabled
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Customer
                  </label>
                  <input
                    type="text"
                    value={
                      selectedOrder.customer
                        ? `${selectedOrder.customer.first_name} ${selectedOrder.customer.last_name}`
                        : selectedOrder.customer_id
                    }
                    disabled
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Total Amount
                  </label>
                  <input
                    type="text"
                    value={`$${selectedOrder.total_amount?.toFixed(2) || '0.00'}`}
                    disabled
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Management Card */}
          <Card>
            <CardHeader title="Status Management" />
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Order Status *"
                  value={orderStatus}
                  onChange={(e) => setOrderStatus(e.target.value)}
                  options={[
                    { value: 'draft', label: 'Draft' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'confirmed', label: 'Confirmed' },
                    { value: 'processing', label: 'Processing' },
                    { value: 'shipped', label: 'Shipped' },
                    { value: 'delivered', label: 'Delivered' },
                    { value: 'cancelled', label: 'Cancelled' },
                    { value: 'returned', label: 'Returned' },
                  ]}
                  helpText="Current order status"
                />

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Payment Status
                  </label>
                  <input
                    type="text"
                    value={paymentStatus.toUpperCase()}
                    disabled
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 capitalize"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Payment status is managed automatically through payments
                  </p>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Status Information</h4>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li><strong>Draft:</strong> Order created but not confirmed</li>
                  <li><strong>Pending:</strong> Awaiting processing</li>
                  <li><strong>Confirmed:</strong> Order confirmed and ready to process</li>
                  <li><strong>Processing:</strong> Order is being prepared</li>
                  <li><strong>Shipped:</strong> Order has been shipped</li>
                  <li><strong>Delivered:</strong> Order delivered to customer</li>
                  <li><strong>Cancelled:</strong> Order cancelled</li>
                  <li><strong>Returned:</strong> Order returned by customer</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Notes Card */}
          <Card>
            <CardHeader title="Notes" />
            <CardContent className="space-y-4">
              <Textarea
                label="Customer Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Notes visible to customer"
                helpText="These notes will be visible to the customer"
              />

              <Textarea
                label="Internal Notes"
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                rows={3}
                placeholder="Internal notes (not visible to customer)"
                helpText="These notes are for internal use only"
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/dashboard/sales/orders/${id}`)}
              disabled={isSubmitting}
              leftIcon={<X className="h-4 w-4" />}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              leftIcon={<Save className="h-4 w-4" />}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
