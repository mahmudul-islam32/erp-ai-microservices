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
  Collapse,
} from '@mantine/core';
import {
  IconPlus,
  IconSearch,
  IconEdit,
  IconTrash,
  IconDots,
  IconEye,
  IconCategory,
  IconAlertCircle,
  IconArrowUp,
  IconArrowDown,
  IconChevronDown,
  IconChevronRight,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { CategoryService, Category, CategoryTreeNode } from '../services/inventory';

const CategoriesPage = () => {
  const navigate = useNavigate();
  
  // State management
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryTree, setCategoryTree] = useState<CategoryTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'tree'>('table');
  
  // Pagination and filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [parentFilter, setParentFilter] = useState<string>('');
  const [isActiveFilter, setIsActiveFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState('sortOrder');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: '',
    parentId: '',
    isActive: true,
    sortOrder: 0,
    image: '',
    tags: [] as string[],
  });

  // Load data
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await CategoryService.getCategories({
        page: currentPage,
        limit: pageSize,
        search: searchTerm || undefined,
        parentId: parentFilter || undefined,
        isActive: isActiveFilter ? isActiveFilter === 'true' : undefined,
        sortBy,
        sortOrder,
      });
      
      setCategories(response.categories || []);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Error fetching categories:', error);
      alert('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, parentFilter, isActiveFilter, sortBy, sortOrder]);

  const fetchCategoryTree = async () => {
    try {
      const tree = await CategoryService.getCategoryTree();
      setCategoryTree(tree);
    } catch (error) {
      console.error('Error fetching category tree:', error);
    }
  };

  useEffect(() => {
    if (viewMode === 'table') {
      fetchCategories();
    } else {
      fetchCategoryTree();
    }
  }, [fetchCategories, viewMode]);

  // Form handlers
  const handleSubmit = async () => {
    try {
      if (editingCategory) {
        await CategoryService.updateCategory(editingCategory._id, formData);
        alert('Category updated successfully');
      } else {
        await CategoryService.createCategory(formData);
        alert('Category created successfully');
      }
      
      setModalOpen(false);
      setEditingCategory(null);
      resetForm();
      if (viewMode === 'table') {
        fetchCategories();
      } else {
        fetchCategoryTree();
      }
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Failed to save category');
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    
    try {
      await CategoryService.deleteCategory(categoryToDelete._id);
      alert('Category deleted successfully');
      
      setDeleteModalOpen(false);
      setCategoryToDelete(null);
      if (viewMode === 'table') {
        fetchCategories();
      } else {
        fetchCategoryTree();
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      code: '',
      parentId: '',
      isActive: true,
      sortOrder: 0,
      image: '',
      tags: [],
    });
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      code: category.code || '',
      parentId: category.parentId || '',
      isActive: category.isActive,
      sortOrder: category.sortOrder,
      image: category.image || '',
      tags: category.tags || [],
    });
    setModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    resetForm();
    setModalOpen(true);
  };

  const breadcrumbItems = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Inventory', href: '/dashboard/inventory' },
    { title: 'Categories', href: '/dashboard/inventory/categories' },
  ].map((item, index) => (
    <Anchor key={index} component="button" onClick={() => navigate(item.href)}>
      {item.title}
    </Anchor>
  ));

  const parentCategoryOptions = categories
    .filter(cat => cat._id !== editingCategory?._id) // Prevent self-reference
    .map(cat => ({ value: cat._id, label: cat.name }));

  // Tree component for hierarchical view
  const CategoryTreeItem = ({ node, level = 0 }: { node: CategoryTreeNode; level?: number }) => {
    const [expanded, setExpanded] = useState(false);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div>
        <Group
          spacing="xs"
          style={{ paddingLeft: level * 20, paddingTop: 8, paddingBottom: 8 }}
        >
          {hasChildren ? (
            <ActionIcon
              size="sm"
              variant="subtle"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
            </ActionIcon>
          ) : (
            <div style={{ width: 28 }} />
          )}
          
          <IconCategory size={16} color={node.isActive ? 'blue' : 'gray'} />
          
          <Text weight={500} size="sm">
            {node.name}
          </Text>
          
          {node.code && (
            <Badge size="sm" variant="outline">
              {node.code}
            </Badge>
          )}
          
          <Badge color={node.isActive ? 'green' : 'gray'} size="sm">
            {node.isActive ? 'Active' : 'Inactive'}
          </Badge>

          <Menu shadow="md" width={200}>
            <Menu.Target>
              <ActionIcon size="sm">
                <IconDots size={14} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item 
                icon={<IconEdit size={12} />}
                onClick={() => {
                  const fullCategory = categories.find(c => c._id === node._id);
                  if (fullCategory) openEditModal(fullCategory);
                }}
              >
                Edit Category
              </Menu.Item>
              <Menu.Item
                icon={<IconTrash size={12} />}
                color="red"
                onClick={() => {
                  const fullCategory = categories.find(c => c._id === node._id);
                  if (fullCategory) {
                    setCategoryToDelete(fullCategory);
                    setDeleteModalOpen(true);
                  }
                }}
              >
                Delete Category
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
        
        <Collapse in={expanded}>
          {hasChildren && node.children?.map((child) => (
            <CategoryTreeItem key={child._id} node={child} level={level + 1} />
          ))}
        </Collapse>
      </div>
    );
  };

  if (loading && viewMode === 'table') {
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
                <IconCategory size={28} />
                Categories
              </Group>
            </Title>
            <Text color="dimmed" size="sm">
              Organize your products with hierarchical categories
            </Text>
          </div>
          <Group>
            <Select
              value={viewMode}
              onChange={(value: 'table' | 'tree') => setViewMode(value)}
              data={[
                { value: 'table', label: 'Table View' },
                { value: 'tree', label: 'Tree View' },
              ]}
            />
            <Button leftIcon={<IconPlus size={16} />} onClick={openCreateModal}>
              Add Category
            </Button>
          </Group>
        </Group>

        {viewMode === 'table' && (
          <>
            {/* Filters */}
            <Card shadow="sm" p="lg" radius="md" withBorder>
              <Grid>
                <Grid.Col xs={12} sm={6} md={3}>
                  <TextInput
                    placeholder="Search categories..."
                    icon={<IconSearch size={16} />}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </Grid.Col>
                <Grid.Col xs={12} sm={6} md={3}>
                  <Select
                    placeholder="Parent Category"
                    data={[{ value: '', label: 'All Categories' }, ...parentCategoryOptions]}
                    value={parentFilter}
                    onChange={(value) => setParentFilter(value || '')}
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
                  <Select
                    placeholder="Sort By"
                    data={[
                      { value: 'sortOrder', label: 'Sort Order' },
                      { value: 'name', label: 'Name' },
                      { value: 'createdAt', label: 'Created' },
                    ]}
                    value={sortBy}
                    onChange={(value) => setSortBy(value || 'sortOrder')}
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

            {/* Categories Table */}
            <Paper shadow="sm" p="lg" radius="md" withBorder>
              {categories.length === 0 ? (
                <Center h={200}>
                  <Stack align="center" spacing="sm">
                    <IconCategory size={48} stroke={1} color="gray" />
                    <Text color="dimmed">No categories found</Text>
                    <Button variant="light" onClick={openCreateModal}>
                      Create your first category
                    </Button>
                  </Stack>
                </Center>
              ) : (
                <Table highlightOnHover>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Code</th>
                      <th>Parent</th>
                      <th>Sort Order</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category) => {
                      const parent = categories.find(c => c._id === category.parentId);
                      
                      return (
                        <tr key={category._id}>
                          <td>
                            <div>
                              <Text weight={500}>{category.name}</Text>
                              {category.description && (
                                <Text size="sm" color="dimmed" truncate>
                                  {category.description}
                                </Text>
                              )}
                            </div>
                          </td>
                          <td>
                            {category.code ? (
                              <Badge variant="outline">{category.code}</Badge>
                            ) : (
                              <Text color="dimmed" size="sm">N/A</Text>
                            )}
                          </td>
                          <td>
                            <Text size="sm">{parent?.name || 'Root'}</Text>
                          </td>
                          <td>
                            <Text size="sm">{category.sortOrder}</Text>
                          </td>
                          <td>
                            <Badge color={category.isActive ? 'green' : 'gray'}>
                              {category.isActive ? 'Active' : 'Inactive'}
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
                                  onClick={() => openEditModal(category)}
                                >
                                  Edit Category
                                </Menu.Item>
                                <Menu.Divider />
                                <Menu.Item
                                  icon={<IconTrash size={14} />}
                                  color="red"
                                  onClick={() => {
                                    setCategoryToDelete(category);
                                    setDeleteModalOpen(true);
                                  }}
                                >
                                  Delete Category
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
          </>
        )}

        {viewMode === 'tree' && (
          <Paper shadow="sm" p="lg" radius="md" withBorder>
            <Title order={4} mb="md">Category Hierarchy</Title>
            {categoryTree.length === 0 ? (
              <Center h={200}>
                <Stack align="center" spacing="sm">
                  <IconCategory size={48} stroke={1} color="gray" />
                  <Text color="dimmed">No categories found</Text>
                  <Button variant="light" onClick={openCreateModal}>
                    Create your first category
                  </Button>
                </Stack>
              </Center>
            ) : (
              <Stack spacing={0}>
                {categoryTree.map((node) => (
                  <CategoryTreeItem key={node._id} node={node} />
                ))}
              </Stack>
            )}
          </Paper>
        )}
      </Stack>

      {/* Create/Edit Modal */}
      <Modal
        opened={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingCategory(null);
          resetForm();
        }}
        title={editingCategory ? 'Edit Category' : 'Create Category'}
        size="lg"
      >
        <Stack spacing="md">
          <Grid>
            <Grid.Col span={8}>
              <TextInput
                required
                label="Category Name"
                placeholder="Enter category name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <TextInput
                label="Category Code"
                placeholder="e.g., ELEC"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
              />
            </Grid.Col>
          </Grid>

          <Textarea
            label="Description"
            placeholder="Enter category description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            minRows={3}
          />

          <Grid>
            <Grid.Col span={8}>
              <Select
                label="Parent Category"
                placeholder="Select parent category (optional)"
                data={[{ value: '', label: 'None (Root Category)' }, ...parentCategoryOptions]}
                value={formData.parentId}
                onChange={(value) => setFormData(prev => ({ ...prev, parentId: value || '' }))}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <NumberInput
                label="Sort Order"
                placeholder="0"
                min={0}
                value={formData.sortOrder}
                onChange={(value) => setFormData(prev => ({ ...prev, sortOrder: value || 0 }))}
              />
            </Grid.Col>
          </Grid>

          <TextInput
            label="Image URL"
            placeholder="https://example.com/image.jpg"
            value={formData.image}
            onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
          />

          <Switch
            label="Active"
            description="Inactive categories are hidden from product selection"
            checked={formData.isActive}
            onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.currentTarget.checked }))}
          />

          <Group position="right" mt="md">
            <Button
              variant="outline"
              onClick={() => {
                setModalOpen(false);
                setEditingCategory(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingCategory ? 'Update Category' : 'Create Category'}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setCategoryToDelete(null);
        }}
        title="Delete Category"
        size="sm"
      >
        <Stack spacing="md">
          <Alert icon={<IconAlertCircle size={16} />} color="red">
            Are you sure you want to delete this category? This action cannot be undone.
          </Alert>
          
          {categoryToDelete && (
            <Text>
              Category: <strong>{categoryToDelete.name}</strong>
              {categoryToDelete.code && ` (${categoryToDelete.code})`}
            </Text>
          )}

          <Group position="right" mt="md">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpen(false);
                setCategoryToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button color="red" onClick={handleDelete}>
              Delete Category
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
};

export default CategoriesPage;
