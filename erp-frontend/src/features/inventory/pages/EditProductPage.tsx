import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { updateProduct, fetchProductById } from '../store/productsSlice';
import { fetchCategories } from '../store/categoriesSlice';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { Card, CardContent, CardFooter } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Textarea } from '../../../shared/components/ui/Textarea';
import { Select } from '../../../shared/components/ui/Select';
import { Spinner } from '../../../shared/components/ui/Spinner';

const productSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  price: z.coerce.number().min(0, 'Price must be positive'),
  cost: z.coerce.number().min(0, 'Cost must be positive'),
  unit: z.string().min(1, 'Unit is required'),
  barcode: z.string().optional(),
  weight: z.coerce.number().min(0).optional(),
  dimensions: z.string().optional(),
  tags: z.string().optional(),
  minStockLevel: z.coerce.number().min(0).optional(),
  maxStockLevel: z.coerce.number().min(0).optional(),
  reorderPoint: z.coerce.number().min(0).optional(),
  reorderQuantity: z.coerce.number().min(0).optional(),
  isActive: z.boolean().optional(),
  isTrackable: z.boolean().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

export const EditProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { selectedProduct, isLoading } = useAppSelector((state) => state.products);
  const { categories } = useAppSelector((state) => state.categories);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  });

  useEffect(() => {
    dispatch(fetchCategories());
    if (id) {
      dispatch(fetchProductById(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (selectedProduct) {
      // Extract categoryId - it might be populated as an object or just a string
      const categoryId = typeof selectedProduct.categoryId === 'object' 
        ? selectedProduct.categoryId._id 
        : selectedProduct.categoryId;
      
      reset({
        sku: selectedProduct.sku,
        name: selectedProduct.name,
        description: selectedProduct.description,
        categoryId: categoryId,
        price: selectedProduct.price,
        cost: selectedProduct.cost,
        unit: selectedProduct.unit,
        barcode: selectedProduct.barcode,
        weight: selectedProduct.weight,
        dimensions: selectedProduct.dimensions,
        tags: selectedProduct.tags,
        minStockLevel: selectedProduct.minStockLevel,
        maxStockLevel: selectedProduct.maxStockLevel,
        reorderPoint: selectedProduct.reorderPoint,
        reorderQuantity: selectedProduct.reorderQuantity,
        isActive: selectedProduct.isActive,
        isTrackable: selectedProduct.isTrackable,
      });
    }
  }, [selectedProduct, reset]);

  const onSubmit = async (data: ProductFormData) => {
    if (!id) return;
    const result = await dispatch(updateProduct({ id, data }));
    if (updateProduct.fulfilled.match(result)) {
      navigate('/dashboard/inventory/products');
    }
  };

  if (isLoading && !selectedProduct) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Edit Product"
        subtitle="Update product information"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Inventory', href: '/dashboard/inventory' },
          { label: 'Products', href: '/dashboard/inventory/products' },
          { label: 'Edit' },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6">
          <Card>
            <CardContent className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                  label="SKU *" 
                  {...register('sku')} 
                  error={errors.sku?.message}
                  helpText="Unique product identifier"
                />
                <Input 
                  label="Product Name *" 
                  {...register('name')} 
                  error={errors.name?.message}
                />
                
                <Input 
                  label="Barcode" 
                  {...register('barcode')}
                  placeholder="UPC, EAN, ISBN, etc."
                  helpText="Product barcode number"
                />

                <Select
                  label="Category *"
                  {...register('categoryId')}
                  error={errors.categoryId?.message}
                  options={[
                    { value: '', label: 'Select category' },
                    ...(categories || []).map((cat) => ({ value: cat._id, label: cat.name })),
                  ]}
                />
              </div>

              <Textarea 
                label="Description" 
                {...register('description')} 
                rows={3}
                placeholder="Detailed product description"
              />

              <Input 
                label="Tags" 
                {...register('tags')}
                placeholder="e.g., electronics, premium, featured (comma-separated)"
                helpText="Tags for categorization and search"
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Pricing & Unit</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input 
                  label="Selling Price *" 
                  type="number" 
                  step="0.01" 
                  {...register('price')} 
                  error={errors.price?.message}
                  placeholder="0.00"
                  helpText="Price customers pay"
                />
                <Input 
                  label="Cost Price *" 
                  type="number" 
                  step="0.01" 
                  {...register('cost')} 
                  error={errors.cost?.message}
                  placeholder="0.00"
                  helpText="Your cost/purchase price"
                />
                <Input 
                  label="Unit of Measure *" 
                  {...register('unit')} 
                  error={errors.unit?.message}
                  placeholder="e.g., pcs, kg, liter"
                  helpText="Unit for counting stock"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Stock Management Settings</h3>
              
              <div className="p-3 bg-slate-50 rounded-md mb-4">
                <p className="text-xs text-slate-600">
                  <strong>Note:</strong> Stock quantities are managed via the Stock Management page. These settings control alerts and reorder suggestions.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                  label="Reorder Point" 
                  type="number" 
                  {...register('reorderPoint')}
                  placeholder="0"
                  helpText="Alert when stock falls below this"
                />
                <Input 
                  label="Reorder Quantity" 
                  type="number" 
                  {...register('reorderQuantity')}
                  placeholder="0"
                  helpText="Suggested quantity to reorder"
                />
                <Input 
                  label="Minimum Stock Level" 
                  type="number" 
                  {...register('minStockLevel')}
                  placeholder="0"
                  helpText="Minimum inventory to maintain"
                />
                <Input 
                  label="Maximum Stock Level" 
                  type="number" 
                  {...register('maxStockLevel')}
                  placeholder="0"
                  helpText="Maximum inventory capacity"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Physical Properties</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                  label="Weight (kg)" 
                  type="number" 
                  step="0.01" 
                  {...register('weight')}
                  placeholder="0.00"
                  helpText="Product weight for shipping"
                />
                <Input 
                  label="Dimensions" 
                  {...register('dimensions')}
                  placeholder="e.g., 30x20x10 cm"
                  helpText="Length x Width x Height"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Additional Information</h3>
              <Input 
                label="Tags" 
                {...register('tags')}
                placeholder="e.g., electronics, premium, featured"
                helpText="Comma-separated tags for categorization"
              />
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <input 
                    type="checkbox" 
                    id="isActive" 
                    {...register('isActive')} 
                    className="mt-1 rounded border-slate-300 text-primary-600 focus:ring-primary-500" 
                  />
                  <div>
                    <label htmlFor="isActive" className="text-sm font-medium text-slate-700">
                      Active Product
                    </label>
                    <p className="text-xs text-slate-500">Product can be sold and appears in listings</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <input 
                    type="checkbox" 
                    id="isTrackable" 
                    {...register('isTrackable')} 
                    className="mt-1 rounded border-slate-300 text-primary-600 focus:ring-primary-500" 
                  />
                  <div>
                    <label htmlFor="isTrackable" className="text-sm font-medium text-slate-700">
                      Track Serial Numbers/Batches
                    </label>
                    <p className="text-xs text-slate-500">Enable batch or serial number tracking</p>
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter align="right">
              <Button type="button" variant="outline" onClick={() => navigate('/dashboard/inventory/products')}>Cancel</Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>Update Product</Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  );
};
