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
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
    {
      key: 'city',
      header: 'Location',
      render: (customer) => (
        customer.city && customer.state ? `${customer.city}, ${customer.state}` : customer.city || customer.state || '-'
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (customer) => (
        <Badge variant={customer.is_active ? 'success' : 'danger'}>
          {customer.is_active ? 'Active' : 'Inactive'}
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

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name?.toLowerCase().includes(search.toLowerCase()) ||
      customer.email?.toLowerCase().includes(search.toLowerCase()) ||
      customer.phone?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="Manage your customer base"
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
            placeholder="Search customers..."
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
