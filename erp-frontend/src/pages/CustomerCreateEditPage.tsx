import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Title,
  Paper,
  Group,
  Button,
  TextInput,
  Select,
  Grid,
  Card,
  Text,
  Textarea,
  NumberInput,
  Switch,
  Breadcrumbs,
  Anchor,
  Alert,
  Stack,
  Loader,
  Center
} from '@mantine/core';
import {
  IconArrowLeft,
  IconDeviceFloppy,
  IconUser,
  IconMapPin,
  IconCreditCard,
  IconAlertCircle
} from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router-dom';
import { customerApi } from '../services/salesApi';
import { CustomerCreate, CustomerType, PaymentTerms, Address } from '../types/sales';

const CustomerCreateEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { customerId } = useParams<{ customerId: string }>();
  const isEdit = Boolean(customerId);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<CustomerCreate>({
    first_name: '',
    last_name: '',
    company_name: '',
    customer_type: CustomerType.INDIVIDUAL,
    email: '',
    phone: '',
    billing_address: {
      street: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'USA'
    },
    shipping_address: {
      street: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'USA'
    },
    payment_terms: PaymentTerms.NET_30,
    credit_limit: 0,
    notes: ''
  });

  const [useShippingAddress, setUseShippingAddress] = useState(false);

  // Load customer data for editing
  const loadCustomer = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const customer = await customerApi.getCustomer(customerId!);
      
      setFormData({
        first_name: customer.first_name,
        last_name: customer.last_name,
        company_name: customer.company_name || '',
        customer_type: customer.customer_type,
        email: customer.email,
        phone: customer.phone,
        billing_address: customer.billing_address,
        shipping_address: customer.shipping_address || customer.billing_address,
        payment_terms: customer.payment_terms,
        credit_limit: customer.credit_limit || 0,
        notes: customer.notes || ''
      });

      setUseShippingAddress(Boolean(customer.shipping_address));
    } catch (err) {
      console.error('Error loading customer:', err);
      setError('Failed to load customer data');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    if (isEdit && customerId) {
      loadCustomer();
    }
  }, [isEdit, customerId, loadCustomer]);

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      // Validation
      if (!formData.first_name.trim() || !formData.last_name.trim()) {
        throw new Error('First name and last name are required');
      }
      if (!formData.email.trim()) {
        throw new Error('Email is required');
      }
      if (!formData.phone.trim()) {
        throw new Error('Phone is required');
      }

      // Prepare data
      const customerData = {
        ...formData,
        shipping_address: useShippingAddress ? formData.shipping_address : undefined
      };

      if (isEdit) {
        await customerApi.updateCustomer(customerId!, customerData);
      } else {
        await customerApi.createCustomer(customerData);
      }

      navigate('/dashboard/sales/customers');
    } catch (err: unknown) {
      console.error('Error saving customer:', err);
      setError(err instanceof Error ? err.message : 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  const updateAddress = (type: 'billing' | 'shipping', field: keyof Address, value: string) => {
    setFormData(prev => ({
      ...prev,
      [`${type}_address`]: {
        ...prev[`${type}_address`],
        [field]: value
      }
    }));
  };

  const copyBillingToShipping = () => {
    setFormData(prev => ({
      ...prev,
      shipping_address: { ...prev.billing_address }
    }));
  };

  const breadcrumbItems = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Sales', href: '/dashboard/sales' },
    { title: 'Customers', href: '/dashboard/sales/customers' },
    { title: isEdit ? 'Edit Customer' : 'New Customer', href: '#' }
  ].map((item, index) => (
    <Anchor key={index} component="button" onClick={() => item.href !== '#' && navigate(item.href)}>
      {item.title}
    </Anchor>
  ));

  if (loading) {
    return (
      <Container size="xl" py="xl">
        <Center h={400}>
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack spacing="lg">
        {/* Header */}
        <Group position="apart">
          <div>
            <Breadcrumbs>{breadcrumbItems}</Breadcrumbs>
            <Title order={2} mt="sm">
              <Group spacing="sm">
                <IconUser size={28} />
                {isEdit ? 'Edit Customer' : 'New Customer'}
              </Group>
            </Title>
          </div>
          <Group>
            <Button
              variant="outline"
              leftIcon={<IconArrowLeft size={16} />}
              onClick={() => navigate('/dashboard/sales/customers')}
            >
              Back to Customers
            </Button>
            <Button
              leftIcon={<IconDeviceFloppy size={16} />}
              onClick={handleSubmit}
              loading={saving}
            >
              {isEdit ? 'Update Customer' : 'Create Customer'}
            </Button>
          </Group>
        </Group>

        {error && (
          <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
            {error}
          </Alert>
        )}

        <Grid>
          {/* Basic Information */}
          <Grid.Col md={8}>
            <Card shadow="sm" p="lg" radius="md" withBorder>
              <Title order={4} mb="md">Basic Information</Title>
              <Grid>
                <Grid.Col span={6}>
                  <TextInput
                    required
                    label="First Name"
                    placeholder="Enter first name"
                    value={formData.first_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput
                    required
                    label="Last Name"
                    placeholder="Enter last name"
                    value={formData.last_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput
                    label="Company Name"
                    placeholder="Enter company name (optional)"
                    value={formData.company_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <Select
                    required
                    label="Customer Type"
                    data={[
                      { value: CustomerType.INDIVIDUAL, label: 'Individual' },
                      { value: CustomerType.BUSINESS, label: 'Business' },
                      { value: CustomerType.GOVERNMENT, label: 'Government' }
                    ]}
                    value={formData.customer_type}
                    onChange={(value) => setFormData(prev => ({ ...prev, customer_type: value as CustomerType }))}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput
                    required
                    type="email"
                    label="Email"
                    placeholder="Enter email address"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput
                    required
                    label="Phone"
                    placeholder="Enter phone number"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </Grid.Col>
                <Grid.Col span={12}>
                  <Textarea
                    label="Notes"
                    placeholder="Additional notes about the customer"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    minRows={3}
                  />
                </Grid.Col>
              </Grid>
            </Card>

            {/* Billing Address */}
            <Card shadow="sm" p="lg" radius="md" withBorder mt="lg">
              <Title order={4} mb="md">
                <Group spacing="sm">
                  <IconMapPin size={20} />
                  Billing Address
                </Group>
              </Title>
              <Grid>
                <Grid.Col span={12}>
                  <TextInput
                    required
                    label="Street Address"
                    placeholder="Enter street address"
                    value={formData.billing_address.street}
                    onChange={(e) => updateAddress('billing', 'street', e.target.value)}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput
                    required
                    label="City"
                    placeholder="Enter city"
                    value={formData.billing_address.city}
                    onChange={(e) => updateAddress('billing', 'city', e.target.value)}
                  />
                </Grid.Col>
                <Grid.Col span={3}>
                  <TextInput
                    required
                    label="State"
                    placeholder="Enter state"
                    value={formData.billing_address.state}
                    onChange={(e) => updateAddress('billing', 'state', e.target.value)}
                  />
                </Grid.Col>
                <Grid.Col span={3}>
                  <TextInput
                    required
                    label="ZIP Code"
                    placeholder="Enter ZIP code"
                    value={formData.billing_address.postal_code}
                    onChange={(e) => updateAddress('billing', 'postal_code', e.target.value)}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <Select
                    required
                    label="Country"
                    data={[
                      { value: 'USA', label: 'United States' },
                      { value: 'CAN', label: 'Canada' },
                      { value: 'MEX', label: 'Mexico' }
                    ]}
                    value={formData.billing_address.country}
                    onChange={(value) => updateAddress('billing', 'country', value || 'USA')}
                  />
                </Grid.Col>
              </Grid>
            </Card>

            {/* Shipping Address */}
            <Card shadow="sm" p="lg" radius="md" withBorder mt="lg">
              <Group position="apart" mb="md">
                <Title order={4}>
                  <Group spacing="sm">
                    <IconMapPin size={20} />
                    Shipping Address
                  </Group>
                </Title>
                <Group>
                  <Switch
                    label="Different from billing"
                    checked={useShippingAddress}
                    onChange={(e) => setUseShippingAddress(e.currentTarget.checked)}
                  />
                  {useShippingAddress && (
                    <Button size="xs" variant="outline" onClick={copyBillingToShipping}>
                      Copy from Billing
                    </Button>
                  )}
                </Group>
              </Group>

              {useShippingAddress ? (
                <Grid>
                  <Grid.Col span={12}>
                    <TextInput
                      required
                      label="Street Address"
                      placeholder="Enter street address"
                      value={formData.shipping_address?.street || ''}
                      onChange={(e) => updateAddress('shipping', 'street', e.target.value)}
                    />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <TextInput
                      required
                      label="City"
                      placeholder="Enter city"
                      value={formData.shipping_address?.city || ''}
                      onChange={(e) => updateAddress('shipping', 'city', e.target.value)}
                    />
                  </Grid.Col>
                  <Grid.Col span={3}>
                    <TextInput
                      required
                      label="State"
                      placeholder="Enter state"
                      value={formData.shipping_address?.state || ''}
                      onChange={(e) => updateAddress('shipping', 'state', e.target.value)}
                    />
                  </Grid.Col>
                  <Grid.Col span={3}>
                    <TextInput
                      required
                      label="ZIP Code"
                      placeholder="Enter ZIP code"
                      value={formData.shipping_address?.postal_code || ''}
                      onChange={(e) => updateAddress('shipping', 'postal_code', e.target.value)}
                    />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Select
                      required
                      label="Country"
                      data={[
                        { value: 'USA', label: 'United States' },
                        { value: 'CAN', label: 'Canada' },
                        { value: 'MEX', label: 'Mexico' }
                      ]}
                      value={formData.shipping_address?.country || 'USA'}
                      onChange={(value) => updateAddress('shipping', 'country', value || 'USA')}
                    />
                  </Grid.Col>
                </Grid>
              ) : (
                <Text color="dimmed" size="sm">
                  Shipping address will be the same as billing address
                </Text>
              )}
            </Card>
          </Grid.Col>

          {/* Payment & Credit Information */}
          <Grid.Col md={4}>
            <Card shadow="sm" p="lg" radius="md" withBorder>
              <Title order={4} mb="md">
                <Group spacing="sm">
                  <IconCreditCard size={20} />
                  Payment & Credit
                </Group>
              </Title>
              <Stack spacing="md">
                <Select
                  required
                  label="Payment Terms"
                  data={[
                    { value: PaymentTerms.NET_15, label: 'Net 15 Days' },
                    { value: PaymentTerms.NET_30, label: 'Net 30 Days' },
                    { value: PaymentTerms.NET_60, label: 'Net 60 Days' },
                    { value: PaymentTerms.NET_90, label: 'Net 90 Days' },
                    { value: PaymentTerms.COD, label: 'Cash on Delivery' },
                    { value: PaymentTerms.PREPAID, label: 'Prepaid' }
                  ]}
                  value={formData.payment_terms}
                  onChange={(value) => setFormData(prev => ({ ...prev, payment_terms: value as PaymentTerms }))}
                />
                <NumberInput
                  label="Credit Limit"
                  placeholder="0.00"
                  precision={2}
                  min={0}
                  value={formData.credit_limit}
                  onChange={(value) => setFormData(prev => ({ ...prev, credit_limit: value || 0 }))}
                  parser={(value) => value?.replace(/\$\s?|(,*)/g, '')}
                  formatter={(value) =>
                    !Number.isNaN(parseFloat(value!))
                      ? `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                      : '$ '
                  }
                />
              </Stack>
            </Card>

            {/* Quick Actions */}
            <Paper shadow="sm" p="lg" radius="md" withBorder mt="lg">
              <Title order={5} mb="md">Quick Actions</Title>
              <Stack spacing="sm">
                <Button variant="outline" fullWidth disabled={!isEdit}>
                  View Order History
                </Button>
                <Button variant="outline" fullWidth disabled={!isEdit}>
                  Create Sales Order
                </Button>
                <Button variant="outline" fullWidth disabled={!isEdit}>
                  Generate Quote
                </Button>
              </Stack>
            </Paper>
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  );
};

export default CustomerCreateEditPage;
