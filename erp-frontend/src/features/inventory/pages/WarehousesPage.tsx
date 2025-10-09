import React, { useEffect, useState } from 'react';
import { Plus, Search, Trash2, Edit } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { fetchWarehouses, createWarehouse, updateWarehouse, deleteWarehouse } from '../store/warehousesSlice';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { Card } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Table, Column } from '../../../shared/components/ui/Table';
import { Badge } from '../../../shared/components/ui/Badge';
import { Modal, ModalFooter } from '../../../shared/components/ui/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Textarea } from '../../../shared/components/ui/Textarea';

const warehouseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  capacity: z.coerce.number().min(0).optional(),
  type: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
  isMainWarehouse: z.boolean().optional(),
});

type WarehouseFormData = z.infer<typeof warehouseSchema>;

export const WarehousesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { warehouses, isLoading } = useAppSelector((state) => state.warehouses);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<any>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WarehouseFormData>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: {
      isActive: true,
      isMainWarehouse: false,
    },
  });

  useEffect(() => {
    dispatch(fetchWarehouses());
  }, [dispatch]);

  const handleOpenModal = (warehouse?: any) => {
    setEditingWarehouse(warehouse || null);
    if (warehouse) {
      reset(warehouse);
    } else {
      reset({ name: '', isActive: true, isMainWarehouse: false });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingWarehouse(null);
    reset();
  };

  const onSubmit = async (data: WarehouseFormData) => {
    if (editingWarehouse) {
      const result = await dispatch(updateWarehouse({ id: editingWarehouse._id, data }));
      if (updateWarehouse.fulfilled.match(result)) {
        handleCloseModal();
      }
    } else {
      const result = await dispatch(createWarehouse(data));
      if (createWarehouse.fulfilled.match(result)) {
        handleCloseModal();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this warehouse?')) {
      await dispatch(deleteWarehouse(id));
    }
  };

  const columns: Column<any>[] = [
    { key: 'name', header: 'Name' },
    { key: 'code', header: 'Code', render: (wh) => wh.code || '-' },
    {
      key: 'location',
      header: 'Location',
      render: (wh) => {
        const parts = [wh.city, wh.state, wh.country].filter(Boolean);
        return parts.length > 0 ? parts.join(', ') : '-';
      },
    },
    { key: 'contactPerson', header: 'Contact', render: (wh) => wh.contactPerson || '-' },
    {
      key: 'isMainWarehouse',
      header: 'Type',
      render: (wh) => (
        <Badge variant={wh.isMainWarehouse ? 'primary' : 'default'}>
          {wh.isMainWarehouse ? 'Main' : 'Branch'}
        </Badge>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (wh) => (
        <Badge variant={wh.isActive ? 'success' : 'danger'}>
          {wh.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '200px',
      render: (wh) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Edit className="h-3 w-3" />}
            onClick={(e) => {
              e.stopPropagation();
              handleOpenModal(wh);
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
              handleDelete(wh._id);
            }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const filteredWarehouses = (warehouses || []).filter(
    (wh) =>
      wh.name?.toLowerCase().includes(search.toLowerCase()) ||
      wh.code?.toLowerCase().includes(search.toLowerCase()) ||
      wh.city?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Warehouses"
        subtitle="Manage warehouse locations"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Inventory', href: '/dashboard/inventory' },
          { label: 'Warehouses' },
        ]}
        actions={
          <Button
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => handleOpenModal()}
          >
            Add Warehouse
          </Button>
        }
      />

      <Card>
        <div className="p-4 border-b border-slate-200">
          <Input
            placeholder="Search warehouses..."
            leftIcon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Table
          data={filteredWarehouses}
          columns={columns}
          isLoading={isLoading}
          emptyMessage="No warehouses found. Create your first warehouse!"
        />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingWarehouse ? 'Edit Warehouse' : 'Create Warehouse'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Name *"
                {...register('name')}
                error={errors.name?.message}
                placeholder="Warehouse name"
              />

              <Input
                label="Code"
                {...register('code')}
                error={errors.code?.message}
                placeholder="WH-001"
              />
            </div>

            <Textarea
              label="Description"
              {...register('description')}
              error={errors.description?.message}
              placeholder="Warehouse description"
              rows={2}
            />

            <Input
              label="Address"
              {...register('address')}
              error={errors.address?.message}
              placeholder="Street address"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="City"
                {...register('city')}
                error={errors.city?.message}
                placeholder="City"
              />

              <Input
                label="State"
                {...register('state')}
                error={errors.state?.message}
                placeholder="State"
              />

              <Input
                label="Country"
                {...register('country')}
                error={errors.country?.message}
                placeholder="Country"
              />

              <Input
                label="Postal Code"
                {...register('postalCode')}
                error={errors.postalCode?.message}
                placeholder="Postal code"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Contact Person"
                {...register('contactPerson')}
                error={errors.contactPerson?.message}
                placeholder="Contact name"
              />

              <Input
                label="Phone"
                {...register('phone')}
                error={errors.phone?.message}
                placeholder="Phone number"
              />

              <Input
                label="Email"
                type="email"
                {...register('email')}
                error={errors.email?.message}
                placeholder="email@example.com"
              />

              <Input
                label="Type"
                {...register('type')}
                error={errors.type?.message}
                placeholder="e.g., Distribution, Storage"
              />
            </div>

            <Input
              label="Capacity"
              type="number"
              {...register('capacity')}
              error={errors.capacity?.message}
              placeholder="Storage capacity (sq ft)"
            />

            <Textarea
              label="Notes"
              {...register('notes')}
              error={errors.notes?.message}
              placeholder="Additional notes"
              rows={2}
            />

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  {...register('isActive')}
                  className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="isActive" className="text-sm text-slate-700">
                  Active Warehouse
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isMainWarehouse"
                  {...register('isMainWarehouse')}
                  className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="isMainWarehouse" className="text-sm text-slate-700">
                  Main Warehouse
                </label>
              </div>
            </div>
          </div>

          <ModalFooter align="right">
            <Button type="button" variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {editingWarehouse ? 'Update' : 'Create'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
};
