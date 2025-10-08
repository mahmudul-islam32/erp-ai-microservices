import React, { useEffect, useState } from 'react';
import { Plus, Search, Trash2, Edit } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { fetchCategories, createCategory, updateCategory, deleteCategory } from '../store/categoriesSlice';
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
import { Select } from '../../../shared/components/ui/Select';

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
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);

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
      const result = await dispatch(createCategory(data));
      if (createCategory.fulfilled.match(result)) {
        handleCloseModal();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      await dispatch(deleteCategory(id));
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
      width: '200px',
      render: (cat) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Edit className="h-3 w-3" />}
            onClick={(e) => {
              e.stopPropagation();
              handleOpenModal(cat);
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
              handleDelete(cat._id);
            }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const filteredCategories = (categories || []).filter(
    (cat) =>
      cat.name?.toLowerCase().includes(search.toLowerCase()) ||
      cat.code?.toLowerCase().includes(search.toLowerCase()) ||
      cat.description?.toLowerCase().includes(search.toLowerCase())
  );

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
          <Button
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => handleOpenModal()}
          >
            Add Category
          </Button>
        }
      />

      <Card>
        <div className="p-4 border-b border-slate-200">
          <Input
            placeholder="Search categories..."
            leftIcon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Table
          data={filteredCategories}
          columns={columns}
          isLoading={isLoading}
          emptyMessage="No categories found. Create your first category!"
        />
      </Card>

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
            <Button type="button" variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {editingCategory ? 'Update' : 'Create'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
};
