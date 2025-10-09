import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { createProduct } from '../store/productsSlice';
import { fetchCategories } from '../store/categoriesSlice';
import { fetchWarehouses } from '../store/warehousesSlice';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { Card, CardContent, CardFooter } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Textarea } from '../../../shared/components/ui/Textarea';
import { Select } from '../../../shared/components/ui/Select';
import { inventoryStockApi } from '../services/inventoryApi';
import { toast } from 'sonner';

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
  // Initial stock fields
  initialStock: z.coerce.number().min(0).optional(),
  warehouseId: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

export const CreateProductPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { categories } = useAppSelector((state) => state.categories);
  const { warehouses } = useAppSelector((state) => state.warehouses);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchWarehouses());
  }, [dispatch]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      isActive: true,
      isTrackable: false,
      minStockLevel: 0,
      maxStockLevel: 0,
      reorderPoint: 0,
      reorderQuantity: 0,
      initialStock: 0,
    },
  });

  const initialStock = watch('initialStock');
  const warehouseId = watch('warehouseId');

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    
    try {
      // Create product first
      const productData = {
        sku: data.sku,
        name: data.name,
        description: data.description,
        categoryId: data.categoryId,
        price: data.price,
        cost: data.cost,
        unit: data.unit,
        barcode: data.barcode,
        weight: data.weight,
        dimensions: data.dimensions,
        tags: data.tags,
        minStockLevel: data.minStockLevel || 0,
        maxStockLevel: data.maxStockLevel || 0,
        reorderPoint: data.reorderPoint || 0,
        reorderQuantity: data.reorderQuantity || 0,
        isActive: data.isActive,
        isTrackable: data.isTrackable,
        currentStock: 0, // Will be managed by inventory service
      };

      const result = await dispatch(createProduct(productData));
      
      if (createProduct.fulfilled.match(result)) {
        const newProduct = result.payload;
        
        // If initial stock is provided, add it to inventory
        if (data.initialStock && data.initialStock > 0 && data.warehouseId) {
          try {
            await inventoryStockApi.adjust({
              productId: newProduct._id,
              warehouseId: data.warehouseId,
              quantity: data.initialStock,
              reason: 'initial_stock',
              notes: 'Initial stock for new product',
              performedBy: 'user', // Will be replaced by actual user
            });
            toast.success(`Product created with ${data.initialStock} units in stock!`);
          } catch (stockError) {
            console.error('Failed to add initial stock:', stockError);
            toast.warning('Product created but failed to add initial stock. Please add stock manually.');
          }
        } else {
          toast.success('Product created successfully!');
        }
        
        navigate('/dashboard/inventory/products');
      } else {
        toast.error('Failed to create product');
      }
    } catch (error) {
      console.error('Product creation error:', error);
      toast.error('Failed to create product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoriesList = Array.isArray(categories) ? categories : [];
  const warehousesList = Array.isArray(warehouses) ? warehouses : [];

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
                  helpText="Unique product identifier"
                />

                <Input
                  label="Product Name *"
                  {...register('name')}
                  error={errors.name?.message}
                  placeholder="Enter product name"
                />

                <Input
                  label="Barcode"
                  {...register('barcode')}
                  error={errors.barcode?.message}
                  placeholder="Product barcode (UPC, EAN, etc.)"
                />

                <Select
                  label="Category *"
                  {...register('categoryId')}
                  error={errors.categoryId?.message}
                  options={[
                    { value: '', label: 'Select category' },
                    ...categoriesList.map((cat) => ({
                      value: cat._id,
                      label: cat.name,
                    })),
                  ]}
                />
              </div>

              <Textarea
                label="Description"
                {...register('description')}
                error={errors.description?.message}
                placeholder="Detailed product description"
                rows={3}
              />

              <Input
                label="Tags"
                {...register('tags')}
                error={errors.tags?.message}
                placeholder="e.g., electronics, premium, featured (comma-separated)"
                helpText="Tags for categorization and search"
              />
            </CardContent>
          </Card>

          {/* Pricing */}
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

              <div className="p-3 bg-slate-50 rounded-md">
                <p className="text-xs text-slate-600">
                  <strong>Profit Margin:</strong> Will be calculated automatically based on price and cost
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Initial Stock */}
          <Card>
            <CardContent className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Initial Stock (Optional)</h3>
              
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md mb-4">
                <p className="text-xs text-blue-800">
                  💡 <strong>Tip:</strong> You can add stock now, or leave it empty and add stock later via Stock Management page.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Initial Quantity"
                  type="number"
                  {...register('initialStock')}
                  error={errors.initialStock?.message}
                  placeholder="0"
                  helpText="Starting inventory quantity"
                />

                <Select
                  label="Warehouse"
                  {...register('warehouseId')}
                  error={errors.warehouseId?.message}
                  options={[
                    { value: '', label: 'Select warehouse (optional)' },
                    ...warehousesList.map((wh) => ({
                      value: wh._id,
                      label: wh.name,
                    })),
                  ]}
                  helpText="Required if adding initial stock"
                />
              </div>

              {initialStock > 0 && !warehouseId && (
                <div className="p-3 bg-warning-50 border border-warning-300 rounded-md">
                  <p className="text-xs text-warning-800">
                    ⚠️ Please select a warehouse to add initial stock
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stock Management Settings */}
          <Card>
            <CardContent className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Stock Management Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Reorder Point"
                  type="number"
                  {...register('reorderPoint')}
                  error={errors.reorderPoint?.message}
                  placeholder="0"
                  helpText="Alert when stock falls below this"
                />

                <Input
                  label="Reorder Quantity"
                  type="number"
                  {...register('reorderQuantity')}
                  error={errors.reorderQuantity?.message}
                  placeholder="0"
                  helpText="Suggested quantity to reorder"
                />

                <Input
                  label="Minimum Stock Level"
                  type="number"
                  {...register('minStockLevel')}
                  error={errors.minStockLevel?.message}
                  placeholder="0"
                  helpText="Minimum inventory to maintain"
                />

                <Input
                  label="Maximum Stock Level"
                  type="number"
                  {...register('maxStockLevel')}
                  error={errors.maxStockLevel?.message}
                  placeholder="0"
                  helpText="Maximum inventory capacity"
                />
              </div>
            </CardContent>
          </Card>

          {/* Physical Properties */}
          <Card>
            <CardContent className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Physical Properties</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Weight (kg)"
                  type="number"
                  step="0.01"
                  {...register('weight')}
                  error={errors.weight?.message}
                  placeholder="0.00"
                  helpText="Product weight for shipping"
                />

                <Input
                  label="Dimensions"
                  {...register('dimensions')}
                  error={errors.dimensions?.message}
                  placeholder="e.g., 30x20x10 cm"
                  helpText="Length x Width x Height"
                />
              </div>
            </CardContent>
          </Card>

          {/* Options */}
          <Card>
            <CardContent className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Options</h3>
              
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
                    <p className="text-xs text-slate-500">Enable batch or serial number tracking for this product</p>
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter align="right">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard/inventory/products')}
                disabled={isSubmitting}
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
