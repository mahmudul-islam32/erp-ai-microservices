import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Edit } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { fetchCustomers, deleteCustomer } from '../store/customersSlice';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { Card } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';
import { Table, Column } from '../../../shared/components/ui/Table';
import { Badge } from '../../../shared/components/ui/Badge';
import { IconButton } from '../../../shared/components/ui/IconButton';
import { usePermissions } from '../../../shared/hooks/usePermissions';
import { Permission } from '../../users/types';
import { CustomerFilters as CustomerFiltersComponent, type CustomerFilters } from '../components/CustomerFilters';
import { DeleteCustomerModal } from '../components/DeleteCustomerModal';

export const CustomersPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { customers, isLoading } = useAppSelector((state) => state.customers);
  const { hasPermission } = usePermissions();
  const [filters, setFilters] = useState<CustomerFilters>({});
  const [customerToDelete, setCustomerToDelete] = useState<any>(null);
  
  const canCreate = hasPermission(Permission.SALES_CREATE);
  const canUpdate = hasPermission(Permission.SALES_UPDATE);
  const canDelete = hasPermission(Permission.SALES_DELETE);

  useEffect(() => {
    dispatch(fetchCustomers());
  }, [dispatch]);

  const handleDelete = (customer: any) => {
    setCustomerToDelete(customer);
  };

  const confirmDelete = async () => {
    if (customerToDelete) {
      const customerId = customerToDelete.id || customerToDelete._id;
      if (customerId) {
        await dispatch(deleteCustomer(customerId));
      }
      setCustomerToDelete(null);
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
      width: '120px',
      render: (customer) => (
        <div className="flex items-center gap-2">
          {canUpdate && (
            <IconButton
              icon={Edit}
              variant="primary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                const customerId = customer.id || customer._id;
                if (customerId) {
                  navigate(`/dashboard/sales/customers/${customerId}/edit`);
                }
              }}
              title="Edit Customer"
            />
          )}
          {canDelete && (
            <IconButton
              icon={Trash2}
              variant="danger"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(customer);
              }}
              title="Delete Customer"
            />
          )}
        </div>
      ),
    },
  ];

  const customersList = Array.isArray(customers) ? customers : [];
  
  const filteredCustomers = customersList.filter((customer) => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        customer.first_name?.toLowerCase().includes(searchLower) ||
        customer.last_name?.toLowerCase().includes(searchLower) ||
        customer.company_name?.toLowerCase().includes(searchLower) ||
        customer.email?.toLowerCase().includes(searchLower) ||
        customer.phone?.toLowerCase().includes(searchLower) ||
        customer.customer_code?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Status filter
    if (filters.status) {
      if (customer.status?.toLowerCase() !== filters.status.toLowerCase()) return false;
    }

    // Customer type filter
    if (filters.customerType) {
      if (customer.customer_type?.toLowerCase() !== filters.customerType.toLowerCase()) return false;
    }

    return true;
  });

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
          canCreate ? (
            <Button
              variant="primary"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => navigate('/dashboard/sales/customers/create')}
            >
              Add Customer
            </Button>
          ) : null
        }
      />

      <div className="space-y-4">
        <CustomerFiltersComponent
          filters={filters}
          onFiltersChange={setFilters}
        />
        <Card>
          <Table
            data={filteredCustomers}
            columns={columns}
            isLoading={isLoading}
            onRowClick={(customer) => navigate(`/dashboard/sales/customers/${customer.id}`)}
            emptyMessage="No customers found. Add your first customer!"
          />
        </Card>
      </div>

      {customerToDelete && (
        <DeleteCustomerModal
          customer={customerToDelete}
          onConfirm={confirmDelete}
          onCancel={() => setCustomerToDelete(null)}
          loading={isLoading}
        />
      )}
    </div>
  );
};
