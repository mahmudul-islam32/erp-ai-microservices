import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { fetchCategories, createCategory, updateCategory, deleteCategory } from '../store/categoriesSlice';
import type { CreateCategoryData } from '../services/categoriesApi';
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
import { Select } from '../../../shared/components/ui/Select';
import { usePermissions } from '../../../shared/hooks/usePermissions';
import { Permission } from '../../users/types';
import { CategoryFilters as CategoryFiltersComponent, type CategoryFilters } from '../components/CategoryFilters';
import { DeleteCategoryModal } from '../components/DeleteCategoryModal';

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  code: z.string().optional(),
  parentId: z.string().optional(),
  sortOrder: z.coerce.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

export const CategoriesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { categories, isLoading } = useAppSelector((state) => state.categories);
  const { hasPermission } = usePermissions();
  const [filters, setFilters] = useState<CategoryFilters>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<any>(null);
  
  const canCreate = hasPermission(Permission.INVENTORY_CREATE);
  const canUpdate = hasPermission(Permission.INVENTORY_UPDATE);
  const canDelete = hasPermission(Permission.INVENTORY_DELETE);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      isActive: true,
      sortOrder: 0,
    },
  });

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const handleOpenModal = (category?: any) => {
    setEditingCategory(category || null);
    if (category) {
      reset(category);
    } else {
      reset({ name: '', description: '', isActive: true, sortOrder: 0 });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    reset();
  };

  const onSubmit = async (data: CategoryFormData) => {
    if (editingCategory) {
      const result = await dispatch(updateCategory({ id: editingCategory._id, data }));
      if (updateCategory.fulfilled.match(result)) {
        handleCloseModal();
      }
    } else {
      // zod validated these fields; strictNullChecks is off, so z.infer marks
      // every key optional. Cast at this boundary.
      const result = await dispatch(createCategory(data as CreateCategoryData));
      if (createCategory.fulfilled.match(result)) {
        handleCloseModal();
      }
    }
  };

  const handleDelete = (category: any) => {
    setCategoryToDelete(category);
  };

  const confirmDelete = async () => {
    if (categoryToDelete) {
      await dispatch(deleteCategory(categoryToDelete._id));
      setCategoryToDelete(null);
    }
  };

  const columns: Column<any>[] = [
    { key: 'name', header: 'Name' },
    { key: 'code', header: 'Code', render: (cat) => cat.code || '-' },
    { key: 'description', header: 'Description', render: (cat) => cat.description || '-' },
    {
      key: 'isActive',
      header: 'Status',
      render: (cat) => (
        <Badge variant={cat.isActive ? 'success' : 'danger'}>
          {cat.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '120px',
      render: (cat) => (
        <div className="flex items-center gap-2">
          {canUpdate && (
            <IconButton
              icon={Edit}
              variant="primary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenModal(cat);
              }}
              title="Edit Category"
            />
          )}
          {canDelete && (
            <IconButton
              icon={Trash2}
              variant="danger"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(cat);
              }}
              title="Delete Category"
            />
          )}
        </div>
      ),
    },
  ];

  const filteredCategories = (categories || []).filter((cat) => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        cat.name?.toLowerCase().includes(searchLower) ||
        cat.code?.toLowerCase().includes(searchLower) ||
        cat.description?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Status filter
    if (filters.isActive !== undefined) {
      if (cat.isActive !== filters.isActive) return false;
    }

    return true;
  });

  return (
    <div>
      <PageHeader
        title="Categories"
        subtitle="Manage product categories"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Inventory', href: '/dashboard/inventory' },
          { label: 'Categories' },
        ]}
        actions={
          canCreate ? (
            <Button
              variant="primary"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => handleOpenModal()}
            >
              Add Category
            </Button>
          ) : null
        }
      />

      <div className="space-y-4">
        <CategoryFiltersComponent
          filters={filters}
          onFiltersChange={setFilters}
        />
        <Card>
          <Table
            data={filteredCategories}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="No categories found. Create your first category!"
          />
        </Card>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingCategory ? 'Edit Category' : 'Create Category'}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <Input
              label="Name *"
              {...register('name')}
              error={errors.name?.message}
              placeholder="Category name"
            />

            <Input
              label="Code"
              {...register('code')}
              error={errors.code?.message}
              placeholder="Category code (optional)"
            />

            <Textarea
              label="Description"
              {...register('description')}
              error={errors.description?.message}
              placeholder="Category description"
              rows={3}
            />

            <Select
              label="Parent Category"
              {...register('parentId')}
              options={[
                { value: '', label: 'None (Root Category)' },
                ...(categories || [])
                  .filter((c) => c._id !== editingCategory?._id)
                  .map((cat) => ({
                    value: cat._id,
                    label: cat.name,
                  })),
              ]}
            />

            <Input
              label="Sort Order"
              type="number"
              {...register('sortOrder')}
              error={errors.sortOrder?.message}
              placeholder="0"
            />

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                {...register('isActive')}
                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="isActive" className="text-sm text-slate-700">
                Active Category
              </label>
            </div>
          </div>

          <ModalFooter align="right">
            <Button type="button" variant="tertiary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {editingCategory ? 'Update' : 'Create'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {categoryToDelete && (
        <DeleteCategoryModal
          category={categoryToDelete}
          onConfirm={confirmDelete}
          onCancel={() => setCategoryToDelete(null)}
          loading={isLoading}
        />
      )}
    </div>
  );
};
