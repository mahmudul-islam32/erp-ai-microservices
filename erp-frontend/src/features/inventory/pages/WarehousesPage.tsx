import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { fetchWarehouses, createWarehouse, updateWarehouse, deleteWarehouse } from '../store/warehousesSlice';
import type { CreateWarehouseData } from '../services/warehousesApi';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { Card } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Table, Column } from '../../../shared/components/ui/Table';
import { Badge } from '../../../shared/components/ui/Badge';
import { IconButton } from '../../../shared/components/ui/IconButton';
import { Modal, ModalFooter } from '../../../shared/components/ui/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Textarea } from '../../../shared/components/ui/Textarea';
import { usePermissions } from '../../../shared/hooks/usePermissions';
import { Permission } from '../../users/types';
import { WarehouseFilters as WarehouseFiltersComponent, type WarehouseFilters } from '../components/WarehouseFilters';
import { DeleteWarehouseModal } from '../components/DeleteWarehouseModal';

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
  const { hasPermission } = usePermissions();
  const [filters, setFilters] = useState<WarehouseFilters>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<any>(null);
  const [warehouseToDelete, setWarehouseToDelete] = useState<any>(null);
  
  const canCreate = hasPermission(Permission.INVENTORY_CREATE);
  const canUpdate = hasPermission(Permission.INVENTORY_UPDATE);
  const canDelete = hasPermission(Permission.INVENTORY_DELETE);

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
      // zod validated these fields; strictNullChecks is off, so z.infer marks
      // every key optional. Cast at this boundary.
      const result = await dispatch(createWarehouse(data as CreateWarehouseData));
      if (createWarehouse.fulfilled.match(result)) {
        handleCloseModal();
      }
    }
  };

  const handleDelete = (warehouse: any) => {
    setWarehouseToDelete(warehouse);
  };

  const confirmDelete = async () => {
    if (warehouseToDelete) {
      await dispatch(deleteWarehouse(warehouseToDelete._id));
      setWarehouseToDelete(null);
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
      width: '120px',
      render: (wh) => (
        <div className="flex items-center gap-2">
          {canUpdate && (
            <IconButton
              icon={Edit}
              variant="primary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenModal(wh);
              }}
              title="Edit Warehouse"
            />
          )}
          {canDelete && (
            <IconButton
              icon={Trash2}
              variant="danger"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(wh);
              }}
              title="Delete Warehouse"
            />
          )}
        </div>
      ),
    },
  ];

  const filteredWarehouses = (warehouses || []).filter((wh) => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        wh.name?.toLowerCase().includes(searchLower) ||
        wh.code?.toLowerCase().includes(searchLower) ||
        wh.city?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Status filter
    if (filters.isActive !== undefined) {
      if (wh.isActive !== filters.isActive) return false;
    }

    // Type filter
    if (filters.isMainWarehouse !== undefined) {
      if (wh.isMainWarehouse !== filters.isMainWarehouse) return false;
    }

    return true;
  });

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
          canCreate ? (
            <Button
              variant="primary"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => handleOpenModal()}
            >
              Add Warehouse
            </Button>
          ) : null
        }
      />

      <div className="space-y-4">
        <WarehouseFiltersComponent
          filters={filters}
          onFiltersChange={setFilters}
        />
        <Card>
          <Table
            data={filteredWarehouses}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="No warehouses found. Create your first warehouse!"
          />
        </Card>
      </div>

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
            <Button type="button" variant="tertiary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {editingWarehouse ? 'Update' : 'Create'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {warehouseToDelete && (
        <DeleteWarehouseModal
          warehouse={warehouseToDelete}
          onConfirm={confirmDelete}
          onCancel={() => setWarehouseToDelete(null)}
          loading={isLoading}
        />
      )}
    </div>
  );
};
