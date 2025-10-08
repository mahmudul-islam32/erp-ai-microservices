import React, { useEffect, useState } from 'react';
import { Search, TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { fetchProducts } from '../store/productsSlice';
import { fetchWarehouses } from '../store/warehousesSlice';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { Card, CardHeader, CardContent } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Table, Column } from '../../../shared/components/ui/Table';
import { Badge } from '../../../shared/components/ui/Badge';
import { Modal, ModalFooter } from '../../../shared/components/ui/Modal';
import { Select } from '../../../shared/components/ui/Select';
import { Textarea } from '../../../shared/components/ui/Textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { inventoryStockApi } from '../services/inventoryApi';
import { toast } from 'sonner';

const adjustSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  warehouseId: z.string().min(1, 'Warehouse is required'),
  quantity: z.coerce.number().int('Must be a whole number'),
  reason: z.string().min(1, 'Reason is required'),
  notes: z.string().optional(),
});

const transferSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  fromWarehouseId: z.string().min(1, 'From warehouse is required'),
  toWarehouseId: z.string().min(1, 'To warehouse is required'),
  quantity: z.coerce.number().min(1, 'Quantity must be positive'),
  notes: z.string().optional(),
});

type AdjustFormData = z.infer<typeof adjustSchema>;
type TransferFormData = z.infer<typeof transferSchema>;

export const StockManagementPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { products } = useAppSelector((state) => state.products);
  const { warehouses } = useAppSelector((state) => state.warehouses);
  const [search, setSearch] = useState('');
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const adjustForm = useForm<AdjustFormData>({
    resolver: zodResolver(adjustSchema),
  });

  const transferForm = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
  });

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchWarehouses());
  }, [dispatch]);

  const handleAdjustStock = (product: any) => {
    setSelectedProduct(product);
    adjustForm.reset({
      productId: product._id,
      warehouseId: '',
      quantity: 0,
      reason: '',
      notes: '',
    });
    setIsAdjustModalOpen(true);
  };

  const handleTransferStock = (product: any) => {
    setSelectedProduct(product);
    transferForm.reset({
      productId: product._id,
      fromWarehouseId: '',
      toWarehouseId: '',
      quantity: 0,
      notes: '',
    });
    setIsTransferModalOpen(true);
  };

  const onAdjustSubmit = async (data: AdjustFormData) => {
    try {
      await inventoryStockApi.adjust(data);
      toast.success('Stock adjusted successfully');
      setIsAdjustModalOpen(false);
      dispatch(fetchProducts()); // Refresh products to get updated stock
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to adjust stock');
    }
  };

  const onTransferSubmit = async (data: TransferFormData) => {
    try {
      await inventoryStockApi.transfer(data);
      toast.success('Stock transferred successfully');
      setIsTransferModalOpen(false);
      dispatch(fetchProducts()); // Refresh products
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to transfer stock');
    }
  };

  const columns: Column<any>[] = [
    { key: 'sku', header: 'SKU', width: '120px' },
    { key: 'name', header: 'Product Name' },
    { key: 'unit', header: 'Unit' },
    {
      key: 'totalQuantity',
      header: 'Total Stock',
      render: (product) => (
        <span className="font-semibold">{product.totalQuantity || 0} {product.unit}</span>
      ),
    },
    {
      key: 'availableQuantity',
      header: 'Available',
      render: (product) => (
        <Badge variant="success">{product.availableQuantity || 0} {product.unit}</Badge>
      ),
    },
    {
      key: 'reservedQuantity',
      header: 'Reserved',
      render: (product) => (
        <Badge variant="warning">{product.reservedQuantity || 0} {product.unit}</Badge>
      ),
    },
    {
      key: 'reorderPoint',
      header: 'Reorder Point',
      render: (product) => `${product.reorderPoint || 0} ${product.unit}`,
    },
    {
      key: 'status',
      header: 'Status',
      render: (product) => {
        const qty = product.totalQuantity || 0;
        const reorder = product.reorderPoint || 0;
        if (qty === 0) return <Badge variant="danger">Out of Stock</Badge>;
        if (qty <= reorder) return <Badge variant="warning">Low Stock</Badge>;
        return <Badge variant="success">In Stock</Badge>;
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '250px',
      render: (product) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<TrendingUp className="h-3 w-3" />}
            onClick={(e) => {
              e.stopPropagation();
              handleAdjustStock(product);
            }}
          >
            Adjust
          </Button>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<ArrowRightLeft className="h-3 w-3" />}
            onClick={(e) => {
              e.stopPropagation();
              handleTransferStock(product);
            }}
          >
            Transfer
          </Button>
        </div>
      ),
    },
  ];

  const productsList = Array.isArray(products) ? products : [];
  const warehousesList = Array.isArray(warehouses) ? warehouses : [];

  const filteredProducts = productsList.filter(
    (product) =>
      product.name?.toLowerCase().includes(search.toLowerCase()) ||
      product.sku?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Stock Management"
        subtitle="Manage inventory stock levels and transfers"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Inventory', href: '/dashboard/inventory' },
          { label: 'Stock' },
        ]}
      />

      <Card>
        <div className="p-4 border-b border-slate-200">
          <Input
            placeholder="Search products by name or SKU..."
            leftIcon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Table
          data={filteredProducts}
          columns={columns}
          emptyMessage="No products found"
        />
      </Card>

      {/* Adjust Stock Modal */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title={`Adjust Stock - ${selectedProduct?.name}`}
        size="md"
      >
        <form onSubmit={adjustForm.handleSubmit(onAdjustSubmit)}>
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-md">
              <p className="text-sm text-slate-600">Current Stock</p>
              <p className="text-2xl font-bold text-slate-900">
                {selectedProduct?.totalQuantity || 0} {selectedProduct?.unit}
              </p>
            </div>

            <Select
              label="Warehouse *"
              {...adjustForm.register('warehouseId')}
              error={adjustForm.formState.errors.warehouseId?.message}
              options={[
                { value: '', label: 'Select warehouse' },
                ...warehousesList.map((wh) => ({
                  value: wh._id,
                  label: wh.name,
                })),
              ]}
            />

            <Input
              label="Quantity *"
              type="number"
              {...adjustForm.register('quantity')}
              error={adjustForm.formState.errors.quantity?.message}
              helperText="Use negative numbers to reduce stock"
              placeholder="e.g., 10 or -5"
            />

            <Select
              label="Reason *"
              {...adjustForm.register('reason')}
              error={adjustForm.formState.errors.reason?.message}
              options={[
                { value: '', label: 'Select reason' },
                { value: 'purchase', label: 'Purchase' },
                { value: 'sale', label: 'Sale' },
                { value: 'return', label: 'Return' },
                { value: 'damage', label: 'Damage' },
                { value: 'theft', label: 'Theft' },
                { value: 'adjustment', label: 'Manual Adjustment' },
                { value: 'production', label: 'Production' },
              ]}
            />

            <Textarea
              label="Notes"
              {...adjustForm.register('notes')}
              placeholder="Optional notes about this adjustment"
              rows={3}
            />
          </div>

          <ModalFooter align="right">
            <Button type="button" variant="outline" onClick={() => setIsAdjustModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={adjustForm.formState.isSubmitting}
            >
              Adjust Stock
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Transfer Stock Modal */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title={`Transfer Stock - ${selectedProduct?.name}`}
        size="md"
      >
        <form onSubmit={transferForm.handleSubmit(onTransferSubmit)}>
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-md">
              <p className="text-sm text-slate-600">Current Stock</p>
              <p className="text-2xl font-bold text-slate-900">
                {selectedProduct?.totalQuantity || 0} {selectedProduct?.unit}
              </p>
            </div>

            <Select
              label="From Warehouse *"
              {...transferForm.register('fromWarehouseId')}
              error={transferForm.formState.errors.fromWarehouseId?.message}
              options={[
                { value: '', label: 'Select source warehouse' },
                ...warehousesList.map((wh) => ({
                  value: wh._id,
                  label: wh.name,
                })),
              ]}
            />

            <Select
              label="To Warehouse *"
              {...transferForm.register('toWarehouseId')}
              error={transferForm.formState.errors.toWarehouseId?.message}
              options={[
                { value: '', label: 'Select destination warehouse' },
                ...warehousesList.map((wh) => ({
                  value: wh._id,
                  label: wh.name,
                })),
              ]}
            />

            <Input
              label="Quantity *"
              type="number"
              {...transferForm.register('quantity')}
              error={transferForm.formState.errors.quantity?.message}
              placeholder="Quantity to transfer"
            />

            <Textarea
              label="Notes"
              {...transferForm.register('notes')}
              placeholder="Optional transfer notes"
              rows={3}
            />
          </div>

          <ModalFooter align="right">
            <Button type="button" variant="outline" onClick={() => setIsTransferModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={transferForm.formState.isSubmitting}
            >
              Transfer Stock
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
};
