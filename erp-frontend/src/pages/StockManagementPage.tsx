import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Title,
  Paper,
  Table,
  Group,
  Button,
  TextInput,
  Select,
  ActionIcon,
  Badge,
  Text,
  Modal,
  Stack,
  NumberInput,
  Textarea,
  Loader,
  Center,
  Alert,
  Menu,
  Pagination,
  Grid,
  Card,
  Breadcrumbs,
  Anchor,
  Progress,
} from '@mantine/core';
import {
  IconSearch,
  IconDots,
  IconEye,
  IconPackage,
  IconArrowUp,
  IconArrowDown,
  IconTransfer,
  IconAdjustments,
  IconHistory,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { 
  InventoryService, 
  ProductService, 
  WarehouseService, 
  Inventory, 
  Product, 
  Warehouse, 
  InventoryTransaction 
} from '../services/inventory';

const StockManagementPage = () => {
  const navigate = useNavigate();
  
  // State management
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(null);
  
  // Pagination and filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('');
  const [stockFilter, setStockFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Form state
  const [adjustForm, setAdjustForm] = useState({
    quantity: 0,
    reason: '',
    notes: '',
  });

  const [transferForm, setTransferForm] = useState({
    fromWarehouseId: '',
    toWarehouseId: '',
    quantity: 0,
    notes: '',
  });

  // Load data
  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await InventoryService.getInventory({
        page: currentPage,
        limit: pageSize,
        warehouseId: warehouseFilter || undefined,
        lowStock: stockFilter === 'low' || undefined,
        outOfStock: stockFilter === 'out' || undefined,
        sortBy,
        sortOrder,
      });
      
      setInventory(response.inventory || []);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      alert('Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, warehouseFilter, stockFilter, sortBy, sortOrder]);

  

  const fetchProducts = async () => {
    try {
      const response = await ProductService.getProducts({ limit: 1000, isActive: true });
      setProducts(response.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await WarehouseService.getWarehouses({ limit: 100, isActive: true });
      setWarehouses(response.warehouses || []);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  const fetchTransactions = async (inventoryId: string) => {
    try {
      const response = await InventoryService.getTransactionHistory(inventoryId, { limit: 50 });
      setTransactions(response.transactions || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  useEffect(() => {
    fetchProducts();
    fetchWarehouses();
  }, []);

  // Form handlers
  const handleStockAdjustment = async () => {
    if (!selectedInventory) return;
    
    try {
      const product = products.find(p => p._id === selectedInventory.productId);
      const warehouse = warehouses.find(w => w._id === selectedInventory.warehouseId);
      
      if (!product || !warehouse) {
        alert('Product or warehouse not found');
        return;
      }

      await InventoryService.adjustStock({
        productId: selectedInventory.productId,
        warehouseId: selectedInventory.warehouseId,
        quantity: adjustForm.quantity,
        reason: adjustForm.reason,
        notes: adjustForm.notes,
        performedBy: 'current-user', // This should come from auth context
      });
      
      alert('Stock adjusted successfully');
      setAdjustModalOpen(false);
      setSelectedInventory(null);
      resetAdjustForm();
      fetchInventory();
    } catch (error) {
      console.error('Error adjusting stock:', error);
      alert('Failed to adjust stock');
    }
  };

  const handleStockTransfer = async () => {
    if (!selectedInventory) return;
    
    try {
      const product = products.find(p => p._id === selectedInventory.productId);
      
      if (!product) {
        alert('Product not found');
        return;
      }

      await InventoryService.transferStock({
        productId: selectedInventory.productId,
        fromWarehouseId: transferForm.fromWarehouseId,
        toWarehouseId: transferForm.toWarehouseId,
        quantity: transferForm.quantity,
        notes: transferForm.notes,
        performedBy: 'current-user', // This should come from auth context
      });
      
      alert('Stock transferred successfully');
      setTransferModalOpen(false);
      setSelectedInventory(null);
      resetTransferForm();
      fetchInventory();
    } catch (error) {
      console.error('Error transferring stock:', error);
      alert('Failed to transfer stock');
    }
  };

  const resetAdjustForm = () => {
    setAdjustForm({
      quantity: 0,
      reason: '',
      notes: '',
    });
  };

  const resetTransferForm = () => {
    setTransferForm({
      fromWarehouseId: '',
      toWarehouseId: '',
      quantity: 0,
      notes: '',
    });
  };

  const openAdjustModal = (inventoryItem: Inventory) => {
    setSelectedInventory(inventoryItem);
    resetAdjustForm();
    setAdjustModalOpen(true);
  };

  const openTransferModal = (inventoryItem: Inventory) => {
    setSelectedInventory(inventoryItem);
    setTransferForm(prev => ({
      ...prev,
      fromWarehouseId: inventoryItem.warehouseId,
    }));
    setTransferModalOpen(true);
  };

  const openTransactionModal = (inventoryItem: Inventory) => {
    setSelectedInventory(inventoryItem);
    fetchTransactions(inventoryItem._id);
    setTransactionModalOpen(true);
  };

  const breadcrumbItems = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Inventory', href: '/dashboard/inventory' },
    { title: 'Stock Management', href: '/dashboard/inventory/stock' },
  ].map((item, index) => (
    <Anchor key={index} component="button" onClick={() => navigate(item.href)}>
      {item.title}
    </Anchor>
  ));

  const warehouseOptions = warehouses.map(wh => ({ value: wh._id, label: wh.name }));

  const resolveProduct = (item: Inventory): Product | undefined => {
    const pid: any = (item as any).productId;
    if (pid && typeof pid === 'object') {
      // If backend populated product object
      return pid as unknown as Product;
    }
    return products.find(p => p._id === item.productId);
  };

  const resolveWarehouse = (item: Inventory): Warehouse | undefined => {
    const wid: any = (item as any).warehouseId;
    if (wid && typeof wid === 'object') {
      return wid as unknown as Warehouse;
    }
    return warehouses.find(w => w._id === item.warehouseId);
  };

  const getStockStatus = (item: Inventory) => {
    const product = resolveProduct(item);
    if (!product) return { color: 'gray', label: 'Unknown' };

    const quantity = item.quantity ?? 0;
    if (quantity <= 0) {
      return { color: 'red', label: 'Out of Stock', progress: 0 };
    } else if (quantity <= (product.reorderPoint ?? 0)) {
      return { color: 'yellow', label: 'Low Stock', progress: 25 };
    } else if (product.maxStockLevel && quantity <= product.maxStockLevel * 0.5) {
      return { color: 'blue', label: 'Normal', progress: 50 };
    } else {
      return { color: 'green', label: 'In Stock', progress: 75 };
    }
  };

  const getStockLevel = (item: Inventory) => {
    const product = resolveProduct(item);
    if (!product || !product.maxStockLevel) return 0;
    const quantity = item.quantity ?? 0;
    return (quantity / product.maxStockLevel) * 100;
  };

  // Compose a merged view that includes products without inventory rows
  const mergedRows = React.useMemo(() => {
    // Index inventory by productId for quick lookup
    const byProductId = inventory.reduce<Record<string, Inventory[]>>((acc, inv) => {
      const pid = (inv as any).productId && typeof (inv as any).productId === 'object' ? (inv as any).productId._id : inv.productId;
      if (!acc[pid]) acc[pid] = [];
      acc[pid].push(inv);
      return acc;
    }, {} as Record<string, Inventory[]>);

    const rows: Array<{ key: string; product: Product; warehouse?: Warehouse; quantity: number; available: number; reserved: number; inv?: Inventory }>= [];

    products.forEach((p) => {
      const invs = byProductId[p._id];
      if (!invs || invs.length === 0) {
        // Show product with stock snapshot if present, else zeros
        const available = (p as any).availableStock ?? (p as any).stock ?? 0;
        const reserved = (p as any).reservedStock ?? 0;
        rows.push({ key: `prod-${p._id}`, product: p, quantity: available + reserved, available, reserved });
      } else {
        invs.forEach((inv) => {
          const wh = resolveWarehouse(inv);
          const available = inv.availableQuantity ?? Math.max(0, (inv.quantity ?? 0) - (inv.reservedQuantity ?? 0));
          rows.push({ key: inv._id, product: (resolveProduct(inv) as Product) ?? p, warehouse: wh, quantity: inv.quantity ?? 0, available, reserved: inv.reservedQuantity ?? 0, inv });
        });
      }
    });

    // Apply client-side search/filters
    const q = searchTerm.trim().toLowerCase();
    return rows.filter(r => {
      const matchesSearch = q ? (r.product.name.toLowerCase().includes(q) || r.product.sku?.toLowerCase().includes(q)) : true;
      const matchesWarehouse = warehouseFilter ? (r.warehouse ? r.warehouse._id === warehouseFilter : false) : true;
      const matchesStock = stockFilter === 'low' ? r.available <= (r.product.reorderPoint ?? 0) && r.available > 0
                          : stockFilter === 'out' ? r.available === 0
                          : true;
      return matchesSearch && matchesWarehouse && matchesStock;
    });
  }, [inventory, products, warehouseFilter, stockFilter, searchTerm]);

  if (loading) {
    return (
      <Center h={400}>
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack spacing="lg">
        {/* Header */}
        <Group position="apart" align="center">
          <div>
            <Breadcrumbs>{breadcrumbItems}</Breadcrumbs>
            <Title order={2} mt="sm">
              <Group spacing="sm">
                <IconPackage size={28} />
                Stock Management
              </Group>
            </Title>
            <Text color="dimmed" size="sm">
              Monitor and manage inventory levels across warehouses
            </Text>
          </div>
        </Group>

        {/* Filters */}
        <Card shadow="sm" p="lg" radius="md" withBorder>
          <Grid>
            <Grid.Col xs={12} sm={6} md={3}>
              <TextInput
                placeholder="Search products..."
                icon={<IconSearch size={16} />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Grid.Col>
            <Grid.Col xs={12} sm={6} md={3}>
              <Select
                placeholder="Warehouse"
                data={[{ value: '', label: 'All Warehouses' }, ...warehouseOptions]}
                value={warehouseFilter}
                onChange={(value) => setWarehouseFilter(value || '')}
              />
            </Grid.Col>
            <Grid.Col xs={12} sm={6} md={2}>
              <Select
                placeholder="Stock Status"
                data={[
                  { value: '', label: 'All Stock' },
                  { value: 'low', label: 'Low Stock' },
                  { value: 'out', label: 'Out of Stock' },
                ]}
                value={stockFilter}
                onChange={(value) => setStockFilter(value || '')}
              />
            </Grid.Col>
            <Grid.Col xs={12} sm={6} md={2}>
              <Select
                placeholder="Sort By"
                data={[
                  { value: 'updatedAt', label: 'Last Updated' },
                  { value: 'quantity', label: 'Stock Level' },
                  { value: 'productId', label: 'Product' },
                ]}
                value={sortBy}
                onChange={(value) => setSortBy(value || 'updatedAt')}
              />
            </Grid.Col>
            <Grid.Col xs={12} sm={6} md={2}>
              <ActionIcon
                variant="outline"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? <IconArrowUp size={16} /> : <IconArrowDown size={16} />}
              </ActionIcon>
            </Grid.Col>
          </Grid>
        </Card>

        {/* Stock Table */}
        <Paper shadow="sm" p="lg" radius="md" withBorder>
          {mergedRows.length === 0 ? (
            <Center h={200}>
              <Stack align="center" spacing="sm">
                <IconPackage size={48} stroke={1} color="gray" />
                <Text color="dimmed">No inventory found</Text>
              </Stack>
            </Center>
          ) : (
            <Table highlightOnHover>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Warehouse</th>
                  <th>Stock Level</th>
                  <th>Available</th>
                  <th>Reserved</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {mergedRows.map((row) => {
                  const product = row.product;
                  const warehouse = row.warehouse;
                  const stockStatus = row.inv ? getStockStatus(row.inv) : (row.available === 0 ? { color: 'red', label: 'Out of Stock' } : { color: 'blue', label: 'Normal' });
                  const stockLevel = row.inv ? getStockLevel(row.inv) : 0;
                  
                  return (
                    <tr key={row.key}>
                      <td>
                        <div>
                          <Text weight={500}>{product?.name || 'Unknown Product'}</Text>
                          <Text size="sm" color="dimmed">
                            SKU: {product?.sku || 'N/A'}
                          </Text>
                        </div>
                      </td>
                      <td>
                        <Text size="sm">{warehouse?.name || (row.inv ? 'Unknown Warehouse' : '—')}</Text>
                      </td>
                      <td>
                        <Stack spacing={4}>
                          <Group spacing="xs">
                            <Text size="sm">{row.quantity} {product?.unit || 'units'}</Text>
                            {stockLevel > 0 && row.inv && (
                              <Progress 
                                value={Math.min(stockLevel, 100)} 
                                size="sm" 
                                style={{ width: 60 }}
                                color={stockStatus.color}
                              />
                            )}
                          </Group>
                          <Text size="xs" color="dimmed">
                            Max: {product?.maxStockLevel ?? 'N/A'}
                          </Text>
                        </Stack>
                      </td>
                      <td>
                        <Text>{row.available}</Text>
                      </td>
                      <td>
                        <Text>{row.reserved}</Text>
                      </td>
                      <td>
                        <Badge color={stockStatus.color} variant="filled">
                          {stockStatus.label}
                        </Badge>
                      </td>
                      <td>
                        <Menu shadow="md" width={200}>
                          <Menu.Target>
                            <ActionIcon>
                              <IconDots size={16} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item 
                              icon={<IconEye size={14} />}
                              onClick={() => row.inv && openTransactionModal(row.inv)}
                              disabled={!row.inv}
                            >
                              View History
                            </Menu.Item>
                            <Menu.Item 
                              icon={<IconAdjustments size={14} />}
                              onClick={() => row.inv && openAdjustModal(row.inv)}
                              disabled={!row.inv}
                            >
                              Adjust Stock
                            </Menu.Item>
                            <Menu.Item 
                              icon={<IconTransfer size={14} />}
                              onClick={() => row.inv && openTransferModal(row.inv)}
                              disabled={!row.inv}
                            >
                              Transfer Stock
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Paper>

        {/* Pagination */}
        {totalPages > 1 && (
          <Center>
            <Pagination
              value={currentPage}
              onChange={setCurrentPage}
              total={totalPages}
            />
          </Center>
        )}
      </Stack>

      {/* Stock Adjustment Modal */}
      <Modal
        opened={adjustModalOpen}
        onClose={() => {
          setAdjustModalOpen(false);
          setSelectedInventory(null);
          resetAdjustForm();
        }}
        title="Adjust Stock Level"
        size="md"
      >
        <Stack spacing="md">
          {selectedInventory && (
            <Alert icon={<IconAdjustments size={16} />}>
              <Text weight={500}>
                {resolveProduct(selectedInventory)?.name}
              </Text>
              <Text size="sm" color="dimmed">
                Current Stock: {selectedInventory.quantity} units
              </Text>
            </Alert>
          )}

          <NumberInput
            required
            label="Adjustment Quantity"
            placeholder="Enter positive or negative value"
            value={adjustForm.quantity}
            onChange={(value) => setAdjustForm(prev => ({ ...prev, quantity: value || 0 }))}
            description="Use positive values to add stock, negative to remove"
          />

          <Select
            required
            label="Reason"
            placeholder="Select reason for adjustment"
            data={[
              { value: 'damaged', label: 'Damaged Goods' },
              { value: 'expired', label: 'Expired Items' },
              { value: 'found', label: 'Stock Found' },
              { value: 'lost', label: 'Stock Lost/Stolen' },
              { value: 'correction', label: 'Inventory Correction' },
              { value: 'returned', label: 'Customer Return' },
              { value: 'other', label: 'Other' },
            ]}
            value={adjustForm.reason}
            onChange={(value) => setAdjustForm(prev => ({ ...prev, reason: value || '' }))}
          />

          <Textarea
            label="Notes"
            placeholder="Additional notes (optional)"
            value={adjustForm.notes}
            onChange={(e) => setAdjustForm(prev => ({ ...prev, notes: e.target.value }))}
            minRows={3}
          />

          <Group position="right" mt="md">
            <Button
              variant="outline"
              onClick={() => {
                setAdjustModalOpen(false);
                setSelectedInventory(null);
                resetAdjustForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleStockAdjustment}>
              Adjust Stock
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Stock Transfer Modal */}
      <Modal
        opened={transferModalOpen}
        onClose={() => {
          setTransferModalOpen(false);
          setSelectedInventory(null);
          resetTransferForm();
        }}
        title="Transfer Stock"
        size="md"
      >
        <Stack spacing="md">
          {selectedInventory && (
            <Alert icon={<IconTransfer size={16} />}>
              <Text weight={500}>
                {resolveProduct(selectedInventory)?.name}
              </Text>
              <Text size="sm" color="dimmed">
                Available Stock: {selectedInventory.availableQuantity || selectedInventory.quantity} units
              </Text>
            </Alert>
          )}

          <Select
            required
            label="From Warehouse"
            data={warehouseOptions}
            value={transferForm.fromWarehouseId}
            onChange={(value) => setTransferForm(prev => ({ ...prev, fromWarehouseId: value || '' }))}
            disabled
          />

          <Select
            required
            label="To Warehouse"
            data={warehouseOptions.filter(w => w.value !== transferForm.fromWarehouseId)}
            value={transferForm.toWarehouseId}
            onChange={(value) => setTransferForm(prev => ({ ...prev, toWarehouseId: value || '' }))}
          />

          <NumberInput
            required
            label="Quantity to Transfer"
            placeholder="Enter quantity"
            min={1}
            max={selectedInventory?.availableQuantity || selectedInventory?.quantity || 0}
            value={transferForm.quantity}
            onChange={(value) => setTransferForm(prev => ({ ...prev, quantity: value || 0 }))}
          />

          <Textarea
            label="Notes"
            placeholder="Transfer notes (optional)"
            value={transferForm.notes}
            onChange={(e) => setTransferForm(prev => ({ ...prev, notes: e.target.value }))}
            minRows={3}
          />

          <Group position="right" mt="md">
            <Button
              variant="outline"
              onClick={() => {
                setTransferModalOpen(false);
                setSelectedInventory(null);
                resetTransferForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleStockTransfer}>
              Transfer Stock
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Transaction History Modal */}
      <Modal
        opened={transactionModalOpen}
        onClose={() => {
          setTransactionModalOpen(false);
          setSelectedInventory(null);
          setTransactions([]);
        }}
        title="Transaction History"
        size="xl"
      >
        <Stack spacing="md">
          {selectedInventory && (
            <Alert icon={<IconHistory size={16} />}>
              <Text weight={500}>
                {products.find(p => p._id === selectedInventory.productId)?.name}
              </Text>
              <Text size="sm" color="dimmed">
                {resolveWarehouse(selectedInventory)?.name}
              </Text>
            </Alert>
          )}

          {transactions.length === 0 ? (
            <Center h={200}>
              <Stack align="center" spacing="sm">
                <IconHistory size={48} stroke={1} color="gray" />
                <Text color="dimmed">No transactions found</Text>
              </Stack>
            </Center>
          ) : (
            <Table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Reason</th>
                  <th>Balance After</th>
                  <th>Performed By</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction._id}>
                    <td>
                      <Text size="sm">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </Text>
                    </td>
                    <td>
                      <Badge 
                        color={transaction.type === 'in' ? 'green' : 'red'}
                        variant="filled"
                      >
                        {transaction.type.toUpperCase()}
                      </Badge>
                    </td>
                    <td>
                      <Text 
                        color={transaction.type === 'in' ? 'green' : 'red'}
                        weight={500}
                      >
                        {transaction.type === 'in' ? '+' : '-'}{transaction.quantity}
                      </Text>
                    </td>
                    <td>
                      <Text size="sm">{transaction.reason}</Text>
                    </td>
                    <td>
                      <Text size="sm">{transaction.balanceAfter}</Text>
                    </td>
                    <td>
                      <Text size="sm">{transaction.performedBy}</Text>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Stack>
      </Modal>
    </Container>
  );
};

export default StockManagementPage;
