import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { fetchCustomers } from '../store/customersSlice';
import { fetchProducts } from '../../inventory/store/productsSlice';
import { invoicesApi } from '../services/invoicesApi';
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
  tax_amount?: number;
  line_total?: number;
}

export const CreateInvoicePage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { customers } = useAppSelector((state) => state.customers);
  const { products } = useAppSelector((state) => state.products);
  
  const [customerId, setCustomerId] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([{ product_id: '', quantity: 1, unit_price: 0 }]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchCustomers());
    dispatch(fetchProducts());
    
    // Set default due date to 30 days from now
    const defaultDueDate = new Date();
    defaultDueDate.setDate(defaultDueDate.getDate() + 30);
    setDueDate(defaultDueDate.toISOString().split('T')[0]);
  }, [dispatch]);

  const productsList = Array.isArray(products) ? products : [];
  const customersList = Array.isArray(customers) ? customers : [];

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
        
        // Calculate tax (assuming 10% default tax rate)
        const taxRate = 0.10;
        const lineSubtotal = updated[index].quantity * updated[index].unit_price;
        updated[index].tax_amount = lineSubtotal * taxRate;
        updated[index].line_total = lineSubtotal + updated[index].tax_amount;
      }
    }
    
    // Recalculate tax and total when quantity or price changes
    if (field === 'quantity' || field === 'unit_price') {
      const lineSubtotal = updated[index].quantity * updated[index].unit_price;
      const taxRate = 0.10; // Default tax rate
      updated[index].tax_amount = lineSubtotal * taxRate;
      updated[index].line_total = lineSubtotal + updated[index].tax_amount;
    }
    
    setLineItems(updated);
  };

  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => {
      const lineSubtotal = item.quantity * item.unit_price;
      return sum + lineSubtotal;
    }, 0);
  };

  const calculateTax = () => {
    return lineItems.reduce((sum, item) => {
      return sum + (item.tax_amount || 0);
    }, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
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

    // Validate all line items
    for (const item of lineItems) {
      if (!item.product_id) {
        toast.error('Please select a product for all line items');
        return;
      }
      if (item.quantity <= 0) {
        toast.error('Quantity must be greater than 0');
        return;
      }
      if (item.unit_price <= 0) {
        toast.error('Unit price must be greater than 0');
        return;
      }
    }

    if (!dueDate) {
      toast.error('Please select a due date');
      return;
    }

    setIsSubmitting(true);

    try {
      // Format line items for API - match InvoiceLineItem structure
      const formattedLineItems = lineItems.map(item => {
        const product = productsList.find(p => p._id === item.product_id);
        const lineSubtotal = item.quantity * item.unit_price;
        const taxAmount = item.tax_amount || (lineSubtotal * 0.10); // 10% tax
        const lineTotal = lineSubtotal + taxAmount;
        
        return {
          product_id: item.product_id,
          product_name: product?.name || '',
          product_sku: product?.sku || '',
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_percent: 0,
          discount_amount: 0,
          tax_rate: 0.10,
          tax_amount: taxAmount,
          line_total: lineTotal,
          notes: null,
        };
      });

      const invoiceData = {
        customer_id: customerId,
        line_items: formattedLineItems,
        due_date: dueDate,
        notes: notes || undefined,
      };

      console.log('Creating invoice with data:', invoiceData);

      const invoice = await invoicesApi.create(invoiceData);
      
      toast.success('Invoice created successfully!');
      navigate(`/dashboard/sales/invoices/${invoice.id}`);
    } catch (error: any) {
      console.error('Invoice creation error:', error);
      const errorMessage = error?.response?.data?.detail || error?.message || 'Failed to create invoice';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Create Invoice"
        subtitle="Create a new customer invoice"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Sales', href: '/dashboard/sales' },
          { label: 'Invoices', href: '/dashboard/sales/invoices' },
          { label: 'Create' },
        ]}
      />

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          {/* Customer & Invoice Info */}
          <Card>
            <CardContent className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Invoice Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Customer *"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  options={[
                    { value: '', label: 'Select customer' },
                    ...customersList.map((c) => ({
                      value: c.id || c.email || c.customer_code,
                      label: `${c.first_name} ${c.last_name}${c.company_name ? ` (${c.company_name})` : ''}`,
                    })),
                  ]}
                />

                <Input
                  label="Due Date *"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>

              <Textarea
                label="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Invoice notes..."
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
                          required
                        >
                          <option value="">Select product</option>
                          {productsList.map((p) => (
                            <option key={p._id} value={p._id}>
                              {p.name} ({p.sku}) - {formatCurrency(p.price)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="col-span-2">
                      <Input
                        label="Quantity *"
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(index, 'quantity', Number(e.target.value))}
                        required
                      />
                    </div>

                    <div className="col-span-3">
                      <Input
                        label="Unit Price *"
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unit_price}
                        onChange={(e) => updateLineItem(index, 'unit_price', Number(e.target.value))}
                        required
                      />
                    </div>

                    <div className="col-span-2 flex items-end">
                      <div className="w-full">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Total</label>
                        <p className="text-lg font-semibold text-slate-900">
                          {formatCurrency(item.line_total || (item.quantity * item.unit_price * 1.1))}
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
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Tax:</span>
                      <span className="font-semibold">{formatCurrency(calculateTax())}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span className="text-primary-600">{formatCurrency(calculateTotal())}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter align="right">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard/sales/invoices')}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                Create Invoice
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  );
};

