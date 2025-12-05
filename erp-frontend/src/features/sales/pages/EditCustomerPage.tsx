import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { updateCustomer, fetchCustomerById } from '../store/customersSlice';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { Card, CardContent, CardFooter } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Textarea } from '../../../shared/components/ui/Textarea';
import { Select } from '../../../shared/components/ui/Select';
import { Spinner } from '../../../shared/components/ui/Spinner';

const customerSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  company_name: z.string().optional(),
  customer_type: z.string().optional(),
  email: z.string().email('Invalid email'),
  phone: z.string().min(1, 'Phone is required'),
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zip_code: z.string().optional(),
  country: z.string().optional(),
  payment_terms: z.string().optional(),
  credit_limit: z.coerce.number().min(0).optional(),
  tax_id: z.string().optional(),
  notes: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

export const EditCustomerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { selectedCustomer, isLoading } = useAppSelector((state) => state.customers);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
  });

  useEffect(() => {
    console.log('EditCustomerPage - URL params id:', id);
    if (!id) {
      console.error('Customer ID is missing from URL parameters');
      navigate('/dashboard/sales/customers');
      return;
    }
    console.log('Dispatching fetchCustomerById with id:', id);
    dispatch(fetchCustomerById(id));
  }, [dispatch, id, navigate]);

  useEffect(() => {
    if (selectedCustomer) {
      const billingAddress = selectedCustomer.billing_address || {};
      reset({
        first_name: selectedCustomer.first_name || '',
        last_name: selectedCustomer.last_name || '',
        company_name: selectedCustomer.company_name || '',
        customer_type: selectedCustomer.customer_type || 'individual',
        email: selectedCustomer.email || '',
        phone: selectedCustomer.phone || '',
        street: billingAddress.street || '',
        city: billingAddress.city || '',
        state: billingAddress.state || '',
        zip_code: billingAddress.zip_code || billingAddress.postal_code || '',
        country: billingAddress.country || 'USA',
        payment_terms: selectedCustomer.payment_terms || 'net_30',
        credit_limit: selectedCustomer.credit_limit,
        tax_id: selectedCustomer.tax_id || '',
        notes: selectedCustomer.notes || '',
      });
    }
  }, [selectedCustomer, reset]);

  const onSubmit = async (data: CustomerFormData) => {
    if (!id) {
      console.error('Customer ID is missing');
      return;
    }
    
    const customerData = {
      first_name: data.first_name,
      last_name: data.last_name,
      company_name: data.company_name,
      customer_type: data.customer_type || 'individual',
      email: data.email,
      phone: data.phone,
      billing_address: {
        street: data.street,
        city: data.city,
        state: data.state,
        zip_code: data.zip_code,
        postal_code: data.zip_code,
        country: data.country || 'USA',
      },
      payment_terms: data.payment_terms || 'net_30',
      credit_limit: data.credit_limit,
      tax_id: data.tax_id,
      notes: data.notes,
    };

    const result = await dispatch(updateCustomer({ id, data: customerData }));
    if (updateCustomer.fulfilled.match(result)) {
      navigate('/dashboard/sales/customers');
    }
  };

  if (isLoading && !selectedCustomer) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!selectedCustomer && !isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 mb-4">Customer not found</p>
        <Button
          variant="primary"
          onClick={() => navigate('/dashboard/sales/customers')}
        >
          Back to Customers
        </Button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Edit Customer"
        subtitle="Update customer information"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Sales', href: '/dashboard/sales' },
          { label: 'Customers', href: '/dashboard/sales/customers' },
          { label: selectedCustomer ? `${selectedCustomer.first_name} ${selectedCustomer.last_name}` : 'Edit' },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6">
          {/* Basic Information */}
          <Card>
            <CardContent className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="First Name *"
                  {...register('first_name')}
                  error={errors.first_name?.message}
                  placeholder="John"
                />

                <Input
                  label="Last Name *"
                  {...register('last_name')}
                  error={errors.last_name?.message}
                  placeholder="Doe"
                />
              </div>

              <Input
                label="Company Name"
                {...register('company_name')}
                error={errors.company_name?.message}
                placeholder="Acme Corporation (optional)"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Customer Type"
                  {...register('customer_type')}
                  options={[
                    { value: 'individual', label: 'Individual' },
                    { value: 'business', label: 'Business' },
                    { value: 'government', label: 'Government' },
                  ]}
                />

                <Select
                  label="Payment Terms"
                  {...register('payment_terms')}
                  options={[
                    { value: 'immediate', label: 'Immediate' },
                    { value: 'net_15', label: 'Net 15 Days' },
                    { value: 'net_30', label: 'Net 30 Days' },
                    { value: 'net_45', label: 'Net 45 Days' },
                    { value: 'net_60', label: 'Net 60 Days' },
                    { value: 'net_90', label: 'Net 90 Days' },
                    { value: 'cod', label: 'Cash on Delivery' },
                  ]}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardContent className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Contact Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Email *"
                  type="email"
                  {...register('email')}
                  error={errors.email?.message}
                  placeholder="customer@email.com"
                />

                <Input
                  label="Phone *"
                  {...register('phone')}
                  error={errors.phone?.message}
                  placeholder="(555) 123-4567"
                />
              </div>
            </CardContent>
          </Card>

          {/* Billing Address */}
          <Card>
            <CardContent className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Billing Address</h3>
              
              <Input
                label="Street Address *"
                {...register('street')}
                error={errors.street?.message}
                placeholder="123 Main Street"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="City *"
                  {...register('city')}
                  error={errors.city?.message}
                  placeholder="New York"
                />

                <Input
                  label="State / Province *"
                  {...register('state')}
                  error={errors.state?.message}
                  placeholder="NY"
                />

                <Input
                  label="Zip / Postal Code"
                  {...register('zip_code')}
                  error={errors.zip_code?.message}
                  placeholder="12345"
                />

                <Input
                  label="Country"
                  {...register('country')}
                  error={errors.country?.message}
                  placeholder="USA"
                />
              </div>
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardContent className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Financial Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Tax ID / VAT Number"
                  {...register('tax_id')}
                  error={errors.tax_id?.message}
                  placeholder="XX-XXXXXXX"
                />

                <Input
                  label="Credit Limit"
                  type="number"
                  step="0.01"
                  {...register('credit_limit')}
                  error={errors.credit_limit?.message}
                  placeholder="0.00"
                />
              </div>

              <Textarea
                label="Notes"
                {...register('notes')}
                error={errors.notes?.message}
                placeholder="Additional notes about this customer..."
                rows={3}
              />
            </CardContent>

            <CardFooter align="right">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard/sales/customers')}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                Update Customer
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  );
};
