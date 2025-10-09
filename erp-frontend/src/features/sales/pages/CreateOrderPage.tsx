import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { createOrder } from '../store/ordersSlice';
import { fetchCustomers } from '../store/customersSlice';
import { fetchProducts } from '../../inventory/store/productsSlice';
import { paymentsApi } from '../services/paymentsApi';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { Card, CardContent, CardFooter } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';
import { Select } from '../../../shared/components/ui/Select';
import { Input } from '../../../shared/components/ui/Input';
import { Textarea } from '../../../shared/components/ui/Textarea';
import { formatCurrency } from '../../../shared/utils/format';
import { toast } from 'sonner';

interface LineItem {
  product_id: string;
  quantity: number;
  unit_price: number;
}

export const CreateOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { customers } = useAppSelector((state) => state.customers);
  const { products } = useAppSelector((state) => state.products);
  
  const [customerId, setCustomerId] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([{ product_id: '', quantity: 1, unit_price: 0 }]);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchCustomers());
    dispatch(fetchProducts());
  }, [dispatch]);

  const productsList = Array.isArray(products) ? products : [];
  const customersList = Array.isArray(customers) ? customers : [];

  // Debug: Log customers to see their structure
  useEffect(() => {
    if (customersList.length > 0) {
      console.log('Sample customer:', customersList[0]);
      console.log('Customer IDs:', customersList.map(c => ({ id: c.id, name: `${c.first_name} ${c.last_name}` })));
    }
  }, [customersList]);

  const addLineItem = () => {
    setLineItems([...lineItems, { product_id: '', quantity: 1, unit_price: 0 }]);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-fill price when product is selected
    if (field === 'product_id' && value) {
      const product = productsList.find(p => p._id === value);
      if (product) {
        updated[index].unit_price = product.price;
        
        // Check stock availability
        const available = product.availableQuantity || 0;
        if (available === 0) {
          toast.error(`${product.name} is out of stock!`);
        } else if (available < updated[index].quantity) {
          toast.warning(`Only ${available} ${product.unit || 'pcs'} available for ${product.name}`);
          updated[index].quantity = available;
        }
      }
    }
    
    // Validate quantity when changed
    if (field === 'quantity' && updated[index].product_id) {
      const product = productsList.find(p => p._id === updated[index].product_id);
      if (product) {
        const available = product.availableQuantity || 0;
        if (value > available) {
          toast.error(`Cannot order ${value} units. Only ${available} ${product.unit || 'pcs'} available.`);
          updated[index].quantity = available;
          return; // Don't update with invalid quantity
        }
      }
    }
    
    setLineItems(updated);
  };

  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerId) {
      toast.error('Please select a customer');
      return;
    }

    if (lineItems.length === 0 || !lineItems[0].product_id) {
      toast.error('Please add at least one product');
      return;
    }

    // Final stock validation before submitting
    for (const item of lineItems) {
      const product = productsList.find(p => p._id === item.product_id);
      if (product) {
        const available = product.availableQuantity || 0;
        if (available === 0) {
          toast.error(`${product.name} is out of stock. Please remove it from the order.`);
          return;
        }
        if (item.quantity > available) {
          toast.error(`Insufficient stock for ${product.name}. Only ${available} ${product.unit || 'pcs'} available.`);
          return;
        }
      }
    }

    setIsSubmitting(true);

    try {
      const orderData = {
        customer_id: customerId,
        line_items: lineItems,
        payment_method: paymentMethod,
        notes: notes || undefined,
      };

      // Debug: Log what we're sending
      console.log('📝 Creating order with data:', orderData);
      console.log('📝 Payment method being sent:', paymentMethod, 'Type:', typeof paymentMethod);
      console.log('Selected customer ID:', customerId);
      console.log('Customer from list:', customersList.find(c => c.id === customerId));

      const result = await dispatch(createOrder(orderData));
      
      if (createOrder.fulfilled.match(result)) {
        const order = result.payload;
        
        // Debug: Check order structure
        console.log('Order created:', order);
        console.log('Order ID:', order.id);
        
        // Ensure we have an order ID
        if (!order.id) {
          toast.error('Order created but ID is missing. Please check order list.');
          navigate('/dashboard/sales/orders');
          return;
        }
        
        // Handle payment based on method
        if (paymentMethod === 'cash') {
          // Process cash payment immediately
          try {
            const totalAmount = lineItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
            console.log('Processing cash payment:', { order_id: order.id, amount: totalAmount });
            
            await paymentsApi.createCash({
              order_id: order.id,
              customer_id: customerId,
              amount: totalAmount,
              amount_tendered: totalAmount, // For simplicity, assume exact amount tendered
              notes: notes || undefined,
            });
            
            console.log('Cash payment successful!');
            toast.success('Order created and payment recorded!');
            navigate('/dashboard/sales/orders');
          } catch (error: any) {
            console.error('Cash payment error:', error);
            const errorMessage = error?.response?.data?.detail || 'Payment recording failed';
            toast.error(`Order created but ${errorMessage}`);
            navigate(`/dashboard/sales/orders/${order.id}`);
          }
        } else if (paymentMethod === 'stripe') {
          // Redirect to order detail to show Stripe payment modal
          console.log('🔄 Navigating to order detail for Stripe payment:', {
            orderId: order.id,
            payment_method: paymentMethod,  // Use the local variable, not order.payment_method
            payment_status: order.payment_status,
            showPayment: true,
          });
          navigate(`/dashboard/sales/orders/${order.id}`, { 
            state: { 
              showPayment: true,
              paymentMethod: 'stripe',  // Pass payment method in state
            } 
          });
        } else {
          // Other payment methods (bank_transfer, check)
          toast.success('Order created successfully!');
          navigate('/dashboard/sales/orders');
        }
      }
    } catch (error) {
      console.error('Order creation error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Create Sales Order"
        subtitle="Create a new customer order"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Sales', href: '/dashboard/sales' },
          { label: 'Orders', href: '/dashboard/sales/orders' },
          { label: 'Create' },
        ]}
      />

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          {/* Customer & Payment Info */}
          <Card>
            <CardContent className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Order Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Customer *"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  options={[
                    { value: '', label: 'Select customer' },
                    ...customersList.map((c) => ({
                      value: c.email || c.customer_code || c.id,  // Try email or customer_code first
                      label: `${c.first_name} ${c.last_name}${c.company_name ? ` (${c.company_name})` : ''}`,
                    })),
                  ]}
                />

                <Select
                  label="Payment Method"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  options={[
                    { value: 'cash', label: 'Cash' },
                    { value: 'stripe', label: 'Credit Card (Stripe)' },
                    { value: 'bank_transfer', label: 'Bank Transfer' },
                    { value: 'check', label: 'Check' },
                  ]}
                />
              </div>

              <Textarea
                label="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Order notes..."
                rows={2}
              />
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-lg font-semibold text-slate-900">Line Items</h3>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  leftIcon={<Plus className="h-3 w-3" />}
                  onClick={addLineItem}
                >
                  Add Item
                </Button>
              </div>

              <div className="space-y-4">
                {lineItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-4 items-start p-4 bg-slate-50 rounded-lg">
                    <div className="col-span-5">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Product *
                        </label>
                        <select
                          value={item.product_id}
                          onChange={(e) => updateLineItem(index, 'product_id', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="">Select product</option>
                          {productsList.map((p) => {
                            const available = p.availableQuantity || 0;
                            const isOutOfStock = available === 0;
                            return (
                              <option 
                                key={p._id} 
                                value={p._id}
                                disabled={isOutOfStock}
                                className={isOutOfStock ? 'text-slate-400 bg-slate-100' : ''}
                              >
                                {p.name} ({p.sku}) - {formatCurrency(p.price)} {isOutOfStock ? '[OUT OF STOCK]' : `[Stock: ${available} ${p.unit || 'pcs'}]`}
                              </option>
                            );
                          })}
                        </select>
                        <p className="mt-1 text-xs text-slate-500">
                          {productsList.filter(p => (p.availableQuantity || 0) === 0).length} product(s) out of stock (grayed out)
                        </p>
                      </div>
                    </div>
                    
                    <div className="col-span-2">
                      <Input
                        label="Quantity *"
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(index, 'quantity', Number(e.target.value))}
                      />
                    </div>

                    <div className="col-span-3">
                      <Input
                        label="Unit Price *"
                        type="number"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateLineItem(index, 'unit_price', Number(e.target.value))}
                      />
                    </div>

                    <div className="col-span-2 flex items-end">
                      <div className="w-full">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Total</label>
                        <p className="text-lg font-semibold text-slate-900">
                          {formatCurrency(item.quantity * item.unit_price)}
                        </p>
                      </div>
                      {lineItems.length > 1 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="danger"
                          onClick={() => removeLineItem(index)}
                          className="ml-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Subtotal:</span>
                      <span className="font-semibold">{formatCurrency(calculateSubtotal())}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span className="text-primary-600">{formatCurrency(calculateSubtotal())}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter align="right">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard/sales/orders')}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                Create Order
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  );
};
