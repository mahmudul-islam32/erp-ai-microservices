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
  Switch,
  Loader,
  Center,
  Alert,
  Menu,
  Pagination,
  Grid,
  Card,
  Breadcrumbs,
  Anchor,
  MultiSelect,
} from '@mantine/core';
import {
  IconPlus,
  IconSearch,
  IconEdit,
  IconTrash,
  IconDots,
  IconEye,
  IconPackage,
  IconAlertCircle,
  IconArrowUp,
  IconArrowDown,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { ProductService, CategoryService, SupplierService, Product, Category, Supplier } from '../services/inventory';

const ProductsPage = () => {
  const navigate = useNavigate();
  
  // State management
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  
  // Pagination and filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [isActiveFilter, setIsActiveFilter] = useState<string>('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Form state
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    categoryId: '',
    price: 0,
    cost: 0,
    unit: '',
    currentStock: 0,
    minStockLevel: 0,
    maxStockLevel: 0,
    reorderPoint: 0,
    reorderQuantity: 0,
    isActive: true,
    isTrackable: true,
    images: [] as string[],
    tags: '',
    dimensions: '',
    weight: 0,
    barcode: '',
    supplierIds: [] as string[],
  });

  // Load data
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await ProductService.getProducts({
        page: currentPage,
        limit: pageSize,
        search: searchTerm || undefined,
        categoryId: categoryFilter || undefined,
        isActive: isActiveFilter ? isActiveFilter === 'true' : undefined,
        lowStock: lowStockFilter || undefined,
        sortBy,
        sortOrder,
      });
      
      setProducts(response.products || []);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Error fetching products:', error);
      alert('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, categoryFilter, isActiveFilter, lowStockFilter, sortBy, sortOrder]);

  const fetchCategories = async () => {
    try {
      const response = await CategoryService.getCategories({ limit: 100, isActive: true });
      setCategories(response.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await SupplierService.getSuppliers({ limit: 100, isActive: true });
      setSuppliers(response.suppliers || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchCategories();
    fetchSuppliers();
  }, []);

  // Form handlers
  const handleSubmit = async () => {
    try {
      if (editingProduct) {
        await ProductService.updateProduct(editingProduct._id, formData);
        alert('Product updated successfully');
      } else {
        await ProductService.createProduct(formData);
        alert('Product created successfully');
      }
      
      setModalOpen(false);
      setEditingProduct(null);
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product');
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    
    try {
      await ProductService.deleteProduct(productToDelete._id);
      alert('Product deleted successfully');
      
      setDeleteModalOpen(false);
      setProductToDelete(null);
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  };

  const resetForm = () => {
    setFormData({
      sku: '',
      name: '',
      description: '',
      categoryId: '',
      price: 0,
      cost: 0,
      unit: '',
      currentStock: 0,
      minStockLevel: 0,
      maxStockLevel: 0,
      reorderPoint: 0,
      reorderQuantity: 0,
      isActive: true,
      isTrackable: true,
      images: [],
      tags: '',
      dimensions: '',
      weight: 0,
      barcode: '',
      supplierIds: [],
    });
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      sku: product.sku,
      name: product.name,
      description: product.description || '',
      categoryId: product.categoryId,
      price: product.price,
      cost: product.cost,
      unit: product.unit,
      currentStock: product.currentStock,
      minStockLevel: product.minStockLevel,
      maxStockLevel: product.maxStockLevel,
      reorderPoint: product.reorderPoint,
      reorderQuantity: product.reorderQuantity,
      isActive: product.isActive,
      isTrackable: product.isTrackable,
      images: product.images || [],
      tags: product.tags || '',
      dimensions: product.dimensions || '',
      weight: product.weight || 0,
      barcode: product.barcode || '',
      supplierIds: product.supplierIds || [],
    });
    setModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    resetForm();
    setModalOpen(true);
  };

  const breadcrumbItems = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Inventory', href: '/dashboard/inventory' },
    { title: 'Products', href: '/dashboard/inventory/products' },
  ].map((item, index) => (
    <Anchor key={index} component="button" onClick={() => navigate(item.href)}>
      {item.title}
    </Anchor>
  ));

  const categoryOptions = categories.map(cat => ({ value: cat._id, label: cat.name }));
  const supplierOptions = suppliers.map(sup => ({ value: sup._id, label: sup.name }));

  const getStockStatus = (product: Product) => {
    if (product.currentStock <= 0) {
      return { color: 'red', label: 'Out of Stock' };
    } else if (product.currentStock <= product.reorderPoint) {
      return { color: 'yellow', label: 'Low Stock' };
    } else {
      return { color: 'green', label: 'In Stock' };
    }
  };

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
                Products
              </Group>
            </Title>
            <Text color="dimmed" size="sm">
              Manage your product catalog
            </Text>
          </div>
          <Button leftIcon={<IconPlus size={16} />} onClick={openCreateModal}>
            Add Product
          </Button>
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
            <Grid.Col xs={12} sm={6} md={2}>
              <Select
                placeholder="Category"
                data={[{ value: '', label: 'All Categories' }, ...categoryOptions]}
                value={categoryFilter}
                onChange={(value) => setCategoryFilter(value || '')}
              />
            </Grid.Col>
            <Grid.Col xs={12} sm={6} md={2}>
              <Select
                placeholder="Status"
                data={[
                  { value: '', label: 'All Status' },
                  { value: 'true', label: 'Active' },
                  { value: 'false', label: 'Inactive' },
                ]}
                value={isActiveFilter}
                onChange={(value) => setIsActiveFilter(value || '')}
              />
            </Grid.Col>
            <Grid.Col xs={12} sm={6} md={2}>
              <Switch
                label="Low Stock Only"
                checked={lowStockFilter}
                onChange={(e) => setLowStockFilter(e.currentTarget.checked)}
              />
            </Grid.Col>
            <Grid.Col xs={12} sm={6} md={2}>
              <Select
                placeholder="Sort By"
                data={[
                  { value: 'name', label: 'Name' },
                  { value: 'sku', label: 'SKU' },
                  { value: 'price', label: 'Price' },
                  { value: 'currentStock', label: 'Stock' },
                  { value: 'createdAt', label: 'Created' },
                ]}
                value={sortBy}
                onChange={(value) => setSortBy(value || 'createdAt')}
              />
            </Grid.Col>
            <Grid.Col xs={12} sm={6} md={1}>
              <ActionIcon
                variant="outline"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? <IconArrowUp size={16} /> : <IconArrowDown size={16} />}
              </ActionIcon>
            </Grid.Col>
          </Grid>
        </Card>

        {/* Products Table */}
        <Paper shadow="sm" p="lg" radius="md" withBorder>
          {products.length === 0 ? (
            <Center h={200}>
              <Stack align="center" spacing="sm">
                <IconPackage size={48} stroke={1} color="gray" />
                <Text color="dimmed">No products found</Text>
                <Button variant="light" onClick={openCreateModal}>
                  Create your first product
                </Button>
              </Stack>
            </Center>
          ) : (
            <Table highlightOnHover>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const stockStatus = getStockStatus(product);
                  const category = categories.find(c => c._id === product.categoryId);
                  
                  return (
                    <tr key={product._id}>
                      <td>
                        <Text weight={500}>{product.sku}</Text>
                      </td>
                      <td>
                        <div>
                          <Text weight={500}>{product.name}</Text>
                          {product.description && (
                            <Text size="sm" color="dimmed" truncate>
                              {product.description}
                            </Text>
                          )}
                        </div>
                      </td>
                      <td>
                        <Text size="sm">{category?.name || 'N/A'}</Text>
                      </td>
                      <td>
                        <Text weight={500}>${product.price.toFixed(2)}</Text>
                      </td>
                      <td>
                        <Group spacing="xs">
                          <Text>{product.currentStock} {product.unit}</Text>
                          <Badge color={stockStatus.color} size="sm">
                            {stockStatus.label}
                          </Badge>
                        </Group>
                      </td>
                      <td>
                        <Badge color={product.isActive ? 'green' : 'gray'}>
                          {product.isActive ? 'Active' : 'Inactive'}
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
                            <Menu.Item icon={<IconEye size={14} />}>
                              View Details
                            </Menu.Item>
                            <Menu.Item 
                              icon={<IconEdit size={14} />}
                              onClick={() => openEditModal(product)}
                            >
                              Edit Product
                            </Menu.Item>
                            <Menu.Divider />
                            <Menu.Item
                              icon={<IconTrash size={14} />}
                              color="red"
                              onClick={() => {
                                setProductToDelete(product);
                                setDeleteModalOpen(true);
                              }}
                            >
                              Delete Product
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

      {/* Create/Edit Modal */}
      <Modal
        opened={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingProduct(null);
          resetForm();
        }}
        title={editingProduct ? 'Edit Product' : 'Create Product'}
        size="lg"
      >
        <Stack spacing="md">
          <Grid>
            <Grid.Col span={6}>
              <TextInput
                required
                label="SKU"
                placeholder="Enter product SKU"
                value={formData.sku}
                onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                required
                label="Product Name"
                placeholder="Enter product name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </Grid.Col>
          </Grid>

          <Textarea
            label="Description"
            placeholder="Enter product description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            minRows={3}
          />

          <Grid>
            <Grid.Col span={6}>
              <Select
                required
                label="Category"
                placeholder="Select category"
                data={categoryOptions}
                value={formData.categoryId}
                onChange={(value) => setFormData(prev => ({ ...prev, categoryId: value || '' }))}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                required
                label="Unit"
                placeholder="e.g., pieces, kg, liters"
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
              />
            </Grid.Col>
          </Grid>

          <Grid>
            <Grid.Col span={6}>
              <NumberInput
                required
                label="Price"
                placeholder="0.00"
                precision={2}
                min={0}
                value={formData.price}
                onChange={(value) => setFormData(prev => ({ ...prev, price: value || 0 }))}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <NumberInput
                required
                label="Cost"
                placeholder="0.00"
                precision={2}
                min={0}
                value={formData.cost}
                onChange={(value) => setFormData(prev => ({ ...prev, cost: value || 0 }))}
              />
            </Grid.Col>
          </Grid>

          <Grid>
            <Grid.Col span={6}>
              <NumberInput
                required
                label="Current Stock"
                placeholder="0"
                min={0}
                value={formData.currentStock}
                onChange={(value) => setFormData(prev => ({ ...prev, currentStock: value || 0 }))}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <NumberInput
                required
                label="Reorder Point"
                placeholder="0"
                min={0}
                value={formData.reorderPoint}
                onChange={(value) => setFormData(prev => ({ ...prev, reorderPoint: value || 0 }))}
              />
            </Grid.Col>
          </Grid>

          <Grid>
            <Grid.Col span={6}>
              <NumberInput
                label="Min Stock Level"
                placeholder="0"
                min={0}
                value={formData.minStockLevel}
                onChange={(value) => setFormData(prev => ({ ...prev, minStockLevel: value || 0 }))}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <NumberInput
                label="Max Stock Level"
                placeholder="0"
                min={0}
                value={formData.maxStockLevel}
                onChange={(value) => setFormData(prev => ({ ...prev, maxStockLevel: value || 0 }))}
              />
            </Grid.Col>
          </Grid>

          <MultiSelect
            label="Suppliers"
            placeholder="Select suppliers"
            data={supplierOptions}
            value={formData.supplierIds}
            onChange={(value) => setFormData(prev => ({ ...prev, supplierIds: value }))}
          />

          <Grid>
            <Grid.Col span={6}>
              <Switch
                label="Active"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.currentTarget.checked }))}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Switch
                label="Trackable"
                checked={formData.isTrackable}
                onChange={(e) => setFormData(prev => ({ ...prev, isTrackable: e.currentTarget.checked }))}
              />
            </Grid.Col>
          </Grid>

          <Group position="right" mt="md">
            <Button
              variant="outline"
              onClick={() => {
                setModalOpen(false);
                setEditingProduct(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingProduct ? 'Update Product' : 'Create Product'}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setProductToDelete(null);
        }}
        title="Delete Product"
        size="sm"
      >
        <Stack spacing="md">
          <Alert icon={<IconAlertCircle size={16} />} color="red">
            Are you sure you want to delete this product? This action cannot be undone.
          </Alert>
          
          {productToDelete && (
            <Text>
              Product: <strong>{productToDelete.name}</strong> (SKU: {productToDelete.sku})
            </Text>
          )}

          <Group position="right" mt="md">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpen(false);
                setProductToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button color="red" onClick={handleDelete}>
              Delete Product
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
};

export default ProductsPage;
