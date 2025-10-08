import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { createProduct } from '../store/productsSlice';
import { fetchCategories } from '../store/categoriesSlice';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { Card, CardContent, CardFooter } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Textarea } from '../../../shared/components/ui/Textarea';
import { Select } from '../../../shared/components/ui/Select';

const productSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  price: z.coerce.number().min(0, 'Price must be positive'),
  cost: z.coerce.number().min(0, 'Cost must be positive'),
  unit: z.string().min(1, 'Unit is required'),
  minStockLevel: z.coerce.number().min(0).optional(),
  maxStockLevel: z.coerce.number().min(0).optional(),
  reorderPoint: z.coerce.number().min(0).optional(),
  reorderQuantity: z.coerce.number().min(0).optional(),
  barcode: z.string().optional(),
  weight: z.coerce.number().min(0).optional(),
  isActive: z.boolean().optional(),
  isTrackable: z.boolean().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

export const CreateProductPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { categories } = useAppSelector((state) => state.categories);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      isActive: true,
      isTrackable: false,
      minStockLevel: 0,
      maxStockLevel: 0,
      reorderPoint: 0,
      reorderQuantity: 0,
    },
  });

  const onSubmit = async (data: ProductFormData) => {
    const result = await dispatch(createProduct(data));
    if (createProduct.fulfilled.match(result)) {
      navigate('/dashboard/inventory/products');
    }
  };

  return (
    <div>
      <PageHeader
        title="Create Product"
        subtitle="Add a new product to your inventory"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Inventory', href: '/dashboard/inventory' },
          { label: 'Products', href: '/dashboard/inventory/products' },
          { label: 'Create' },
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
                  label="SKU *"
                  {...register('sku')}
                  error={errors.sku?.message}
                  placeholder="e.g., PROD-001"
                />

                <Input
                  label="Product Name *"
                  {...register('name')}
                  error={errors.name?.message}
                  placeholder="Enter product name"
                />
              </div>

              <Textarea
                label="Description"
                {...register('description')}
                error={errors.description?.message}
                placeholder="Product description"
                rows={3}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Category *"
                {...register('categoryId')}
                error={errors.categoryId?.message}
                options={[
                  { value: '', label: 'Select category' },
                  ...(categories || []).map((cat) => ({
                    value: cat._id,
                    label: cat.name,
                  })),
                ]}
              />

                <Input
                  label="Unit *"
                  {...register('unit')}
                  error={errors.unit?.message}
                  placeholder="e.g., piece, kg, liter"
                />
              </div>

              <Input
                label="Barcode"
                {...register('barcode')}
                error={errors.barcode?.message}
                placeholder="Product barcode"
              />
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardContent className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Pricing</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Price *"
                  type="number"
                  step="0.01"
                  {...register('price')}
                  error={errors.price?.message}
                  placeholder="0.00"
                />

                <Input
                  label="Cost *"
                  type="number"
                  step="0.01"
                  {...register('cost')}
                  error={errors.cost?.message}
                  placeholder="0.00"
                />
              </div>
            </CardContent>
          </Card>

          {/* Stock Management */}
          <Card>
            <CardContent className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Stock Management</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Min Stock Level"
                  type="number"
                  {...register('minStockLevel')}
                  error={errors.minStockLevel?.message}
                  placeholder="0"
                />

                <Input
                  label="Max Stock Level"
                  type="number"
                  {...register('maxStockLevel')}
                  error={errors.maxStockLevel?.message}
                  placeholder="0"
                />

                <Input
                  label="Reorder Point"
                  type="number"
                  {...register('reorderPoint')}
                  error={errors.reorderPoint?.message}
                  placeholder="0"
                />

                <Input
                  label="Reorder Quantity"
                  type="number"
                  {...register('reorderQuantity')}
                  error={errors.reorderQuantity?.message}
                  placeholder="0"
                />
              </div>
            </CardContent>
          </Card>

          {/* Additional Details */}
          <Card>
            <CardContent className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Additional Details</h3>
              
              <Input
                label="Weight (kg)"
                type="number"
                step="0.01"
                {...register('weight')}
                error={errors.weight?.message}
                placeholder="0.00"
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
                    Active Product
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isTrackable"
                    {...register('isTrackable')}
                    className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="isTrackable" className="text-sm text-slate-700">
                    Track Serial Numbers/Batches
                  </label>
                </div>
              </div>
            </CardContent>

            <CardFooter align="right">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard/inventory/products')}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                Create Product
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  );
};
