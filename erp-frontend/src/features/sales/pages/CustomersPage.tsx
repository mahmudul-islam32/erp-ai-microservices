import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Trash2, Edit } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { fetchCustomers, deleteCustomer } from '../store/customersSlice';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { Card } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Table, Column } from '../../../shared/components/ui/Table';
import { Badge } from '../../../shared/components/ui/Badge';

export const CustomersPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { customers, isLoading } = useAppSelector((state) => state.customers);
  const [search, setSearch] = useState('');

  useEffect(() => {
    dispatch(fetchCustomers());
  }, [dispatch]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      await dispatch(deleteCustomer(id));
    }
  };

  const columns: Column<any>[] = [
    {
      key: 'customer_code',
      header: 'Code',
      width: '100px',
    },
    {
      key: 'name',
      header: 'Name',
      render: (customer) => (
        <div>
          <p className="font-medium">{`${customer.first_name} ${customer.last_name}`}</p>
          {customer.company_name && (
            <p className="text-xs text-slate-500">{customer.company_name}</p>
          )}
        </div>
      ),
    },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
    {
      key: 'location',
      header: 'Location',
      render: (customer) => {
        const addr = customer.billing_address;
        return addr ? `${addr.city || ''}, ${addr.state || ''}`.trim() : '-';
      },
    },
    {
      key: 'customer_type',
      header: 'Type',
      render: (customer) => (
        <Badge variant="default">
          {customer.customer_type?.toUpperCase() || 'INDIVIDUAL'}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (customer) => (
        <Badge variant={customer.status === 'active' ? 'success' : 'danger'}>
          {customer.status?.toUpperCase() || 'ACTIVE'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '200px',
      render: (customer) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Edit className="h-3 w-3" />}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/dashboard/sales/customers/${customer.id}/edit`);
            }}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="danger"
            leftIcon={<Trash2 className="h-3 w-3" />}
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(customer.id);
            }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const customersList = Array.isArray(customers) ? customers : [];
  
  const filteredCustomers = customersList.filter(
    (customer) =>
      customer.first_name?.toLowerCase().includes(search.toLowerCase()) ||
      customer.last_name?.toLowerCase().includes(search.toLowerCase()) ||
      customer.company_name?.toLowerCase().includes(search.toLowerCase()) ||
      customer.email?.toLowerCase().includes(search.toLowerCase()) ||
      customer.phone?.toLowerCase().includes(search.toLowerCase()) ||
      customer.customer_code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="Manage your customer base"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Sales', href: '/dashboard/sales' },
          { label: 'Customers' },
        ]}
        actions={
          <Button
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => navigate('/dashboard/sales/customers/create')}
          >
            Add Customer
          </Button>
        }
      />

      <Card>
        <div className="p-4 border-b border-slate-200">
          <Input
            placeholder="Search customers by name, email, phone, or code..."
            leftIcon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Table
          data={filteredCustomers}
          columns={columns}
          isLoading={isLoading}
          onRowClick={(customer) => navigate(`/dashboard/sales/customers/${customer.id}`)}
          emptyMessage="No customers found. Add your first customer!"
        />
      </Card>
    </div>
  );
};
