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
} from '@mantine/core';
import {
  IconPlus,
  IconSearch,
  IconEdit,
  IconTrash,
  IconDots,
  IconEye,
  IconBuilding,
  IconAlertCircle,
  IconMapPin,
} from '@tabler/icons-react';
import { WarehouseService, Warehouse } from '../services/inventory';

const WarehousesPage = () => {
  // State management
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [warehouseToDelete, setWarehouseToDelete] = useState<Warehouse | null>(null);
  
  // Pagination and filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      zipCode: '',
    },
    contactInfo: {
      phone: '',
      email: '',
      manager: '',
    },
    isActive: true,
    capacity: 0,
    currentStock: 0,
  });

  // Load data
  const fetchWarehouses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await WarehouseService.getWarehouses({
        page: currentPage,
        limit: pageSize,
        search: searchTerm || undefined,
        isActive: isActiveFilter ? isActiveFilter === 'true' : undefined,
        sortBy,
        sortOrder,
      });
      
      setWarehouses(response.warehouses || []);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      alert('Failed to fetch warehouses');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, isActiveFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  // Form handlers
  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      address: {
        street: '',
        city: '',
        state: '',
        country: '',
        zipCode: '',
      },
      contactInfo: {
        phone: '',
        email: '',
        manager: '',
      },
      isActive: true,
      capacity: 0,
      currentStock: 0,
    });
    setEditingWarehouse(null);
  };

  const handleSubmit = async () => {
    try {
      // Transform form data to match backend expectations
      const warehouseData = {
        name: formData.name,
        code: formData.code || undefined,
        description: formData.description || undefined,
        address: formData.address.street || undefined,
        city: formData.address.city || undefined,
        state: formData.address.state || undefined,
        country: formData.address.country || undefined,
        postalCode: formData.address.zipCode || undefined,
        contactPerson: formData.contactInfo.manager || undefined,
        phone: formData.contactInfo.phone || undefined,
        email: formData.contactInfo.email || undefined,
        capacity: formData.capacity || undefined,
        isActive: formData.isActive,
        isMainWarehouse: false, // Default to false
      };

      if (editingWarehouse) {
        await WarehouseService.updateWarehouse(editingWarehouse._id, warehouseData);
        alert('Warehouse updated successfully');
      } else {
        await WarehouseService.createWarehouse(warehouseData);
        alert('Warehouse created successfully');
      }
      setModalOpen(false);
      resetForm();
      fetchWarehouses();
    } catch (error) {
      console.error('Error saving warehouse:', error);
      alert('Failed to save warehouse');
    }
  };

  const handleEdit = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    setFormData({
      name: warehouse.name,
      code: warehouse.code || '',
      description: warehouse.description || '',
      address: {
        street: warehouse.address || '',
        city: warehouse.city || '',
        state: warehouse.state || '',
        country: warehouse.country || '',
        zipCode: warehouse.postalCode || '',
      },
      contactInfo: {
        phone: warehouse.phone || '',
        email: warehouse.email || '',
        manager: warehouse.contactPerson || '',
      },
      isActive: warehouse.isActive,
      capacity: warehouse.capacity || 0,
      currentStock: warehouse.currentStock || 0,
    });
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!warehouseToDelete) return;

    try {
      await WarehouseService.deleteWarehouse(warehouseToDelete._id);
      alert('Warehouse deleted successfully');
      setDeleteModalOpen(false);
      setWarehouseToDelete(null);
      fetchWarehouses();
    } catch (error) {
      console.error('Error deleting warehouse:', error);
      alert('Failed to delete warehouse');
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const getUtilizationPercentage = (current: number, capacity: number) => {
    if (capacity === 0) return 0;
    return Math.round((current / capacity) * 100);
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage < 50) return 'green';
    if (percentage < 80) return 'yellow';
    return 'red';
  };

  return (
    <Container size="xl" py="md">
      <Group justify="space-between" mb="lg">
        <div>
          <Title order={2}>Warehouses</Title>
          <Text color="dimmed">Manage warehouse locations and information</Text>
        </div>
        <Button leftSection={<IconPlus size={16} />} onClick={() => setModalOpen(true)}>
          Add Warehouse
        </Button>
      </Group>

      {/* Filters */}
      <Paper p="md" mb="lg">
        <Grid>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <TextInput
              placeholder="Search warehouses..."
              leftSection={<IconSearch size={16} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 3 }}>
            <Select
              placeholder="Filter by status"
              data={[
                { value: '', label: 'All Statuses' },
                { value: 'true', label: 'Active' },
                { value: 'false', label: 'Inactive' },
              ]}
              value={isActiveFilter}
              onChange={(value) => setIsActiveFilter(value || '')}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 3 }}>
            <Select
              placeholder="Sort by"
              data={[
                { value: 'name', label: 'Name' },
                { value: 'code', label: 'Code' },
                { value: 'capacity', label: 'Capacity' },
                { value: 'currentStock', label: 'Current Stock' },
                { value: 'createdAt', label: 'Created Date' },
              ]}
              value={sortBy}
              onChange={(value) => setSortBy(value || 'name')}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 2 }}>
            <Button variant="light" onClick={() => {
              setSearchTerm('');
              setIsActiveFilter('');
              setSortBy('name');
              setSortOrder('asc');
              setCurrentPage(1);
            }}>
              Clear Filters
            </Button>
          </Grid.Col>
        </Grid>
      </Paper>

      {/* Warehouse Table */}
      <Paper p="md">
        {loading ? (
          <Center py="xl">
            <Loader />
          </Center>
        ) : warehouses.length === 0 ? (
          <Center py="xl">
            <Stack align="center">
              <IconBuilding size={48} color="gray" />
              <Text color="dimmed">No warehouses found</Text>
              <Button leftSection={<IconPlus size={16} />} onClick={() => setModalOpen(true)}>
                Add First Warehouse
              </Button>
            </Stack>
          </Center>
        ) : (
          <>
            <Table highlightOnHover>
              <thead>
                <tr>
                  <th 
                    onClick={() => handleSort('name')}
                    style={{ cursor: 'pointer' }}
                  >
                    Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    onClick={() => handleSort('code')}
                    style={{ cursor: 'pointer' }}
                  >
                    Code {sortBy === 'code' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Location</th>
                  <th 
                    onClick={() => handleSort('capacity')}
                    style={{ cursor: 'pointer' }}
                  >
                    Capacity {sortBy === 'capacity' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Utilization</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {warehouses.map((warehouse) => (
                  <tr key={warehouse._id}>
                    <td>
                      <div>
                        <Text fw={500}>{warehouse.name}</Text>
                        {warehouse.description && (
                          <Text size="sm" color="dimmed">{warehouse.description}</Text>
                        )}
                      </div>
                    </td>
                    <td>
                      <Badge variant="light">{warehouse.code}</Badge>
                    </td>
                    <td>
                      {warehouse.address ? (
                        <div>
                          <Text size="sm">{warehouse.address.city}, {warehouse.address.state}</Text>
                          <Text size="xs" color="dimmed">{warehouse.address.country}</Text>
                        </div>
                      ) : (
                        <Text color="dimmed">-</Text>
                      )}
                    </td>
                    <td>
                      <Text>{warehouse.capacity?.toLocaleString() || 0}</Text>
                    </td>
                    <td>
                      {warehouse.capacity ? (
                        <div>
                          <Badge 
                            color={getUtilizationColor(getUtilizationPercentage(warehouse.currentStock || 0, warehouse.capacity))}
                            variant="filled"
                          >
                            {getUtilizationPercentage(warehouse.currentStock || 0, warehouse.capacity)}%
                          </Badge>
                          <Text size="xs" color="dimmed">
                            {warehouse.currentStock?.toLocaleString() || 0} / {warehouse.capacity.toLocaleString()}
                          </Text>
                        </div>
                      ) : (
                        <Text color="dimmed">-</Text>
                      )}
                    </td>
                    <td>
                      {warehouse.contactInfo ? (
                        <div>
                          {warehouse.contactInfo.manager && (
                            <Text size="sm">{warehouse.contactInfo.manager}</Text>
                          )}
                          {warehouse.contactInfo.phone && (
                            <Text size="xs" color="dimmed">{warehouse.contactInfo.phone}</Text>
                          )}
                        </div>
                      ) : (
                        <Text color="dimmed">-</Text>
                      )}
                    </td>
                    <td>
                      <Badge color={warehouse.isActive ? 'green' : 'red'} variant="light">
                        {warehouse.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td>
                      <Group gap="xs">
                        <ActionIcon
                          variant="light"
                          onClick={() => handleEdit(warehouse)}
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                        <ActionIcon
                          variant="light"
                          color="red"
                          onClick={() => {
                            setWarehouseToDelete(warehouse);
                            setDeleteModalOpen(true);
                          }}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                        <Menu>
                          <Menu.Target>
                            <ActionIcon variant="light">
                              <IconDots size={16} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item leftSection={<IconEye size={16} />}>
                              View Details
                            </Menu.Item>
                            <Menu.Item leftSection={<IconMapPin size={16} />}>
                              View on Map
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Group>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <Group justify="center" mt="md">
                <Pagination
                  value={currentPage}
                  onChange={setCurrentPage}
                  total={totalPages}
                />
              </Group>
            )}
          </>
        )}
      </Paper>

      {/* Create/Edit Modal */}
      <Modal
        opened={modalOpen}
        onClose={() => {
          setModalOpen(false);
          resetForm();
        }}
        title={editingWarehouse ? 'Edit Warehouse' : 'Add New Warehouse'}
        size="lg"
      >
        <Stack>
          <Grid>
            <Grid.Col span={6}>
              <TextInput
                label="Name"
                placeholder="Enter warehouse name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Code"
                placeholder="Enter warehouse code"
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value})}
              />
            </Grid.Col>
          </Grid>

          <Textarea
            label="Description"
            placeholder="Enter warehouse description"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />

          <Text fw={500}>Address</Text>
          <Grid>
            <Grid.Col span={12}>
              <TextInput
                label="Street"
                placeholder="Enter street address"
                value={formData.address.street}
                onChange={(e) => setFormData({
                  ...formData,
                  address: {...formData.address, street: e.target.value}
                })}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="City"
                placeholder="Enter city"
                value={formData.address.city}
                onChange={(e) => setFormData({
                  ...formData,
                  address: {...formData.address, city: e.target.value}
                })}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="State"
                placeholder="Enter state"
                value={formData.address.state}
                onChange={(e) => setFormData({
                  ...formData,
                  address: {...formData.address, state: e.target.value}
                })}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Country"
                placeholder="Enter country"
                value={formData.address.country}
                onChange={(e) => setFormData({
                  ...formData,
                  address: {...formData.address, country: e.target.value}
                })}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="ZIP Code"
                placeholder="Enter ZIP code"
                value={formData.address.zipCode}
                onChange={(e) => setFormData({
                  ...formData,
                  address: {...formData.address, zipCode: e.target.value}
                })}
              />
            </Grid.Col>
          </Grid>

          <Text fw={500}>Contact Information</Text>
          <Grid>
            <Grid.Col span={6}>
              <TextInput
                label="Manager"
                placeholder="Enter manager name"
                value={formData.contactInfo.manager}
                onChange={(e) => setFormData({
                  ...formData,
                  contactInfo: {...formData.contactInfo, manager: e.target.value}
                })}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Phone"
                placeholder="Enter phone number"
                value={formData.contactInfo.phone}
                onChange={(e) => setFormData({
                  ...formData,
                  contactInfo: {...formData.contactInfo, phone: e.target.value}
                })}
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <TextInput
                label="Email"
                placeholder="Enter email address"
                value={formData.contactInfo.email}
                onChange={(e) => setFormData({
                  ...formData,
                  contactInfo: {...formData.contactInfo, email: e.target.value}
                })}
              />
            </Grid.Col>
          </Grid>

          <Grid>
            <Grid.Col span={6}>
              <NumberInput
                label="Capacity"
                placeholder="Enter warehouse capacity"
                value={formData.capacity}
                onChange={(value) => setFormData({...formData, capacity: Number(value) || 0})}
                min={0}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <NumberInput
                label="Current Stock"
                placeholder="Enter current stock level"
                value={formData.currentStock}
                onChange={(value) => setFormData({...formData, currentStock: Number(value) || 0})}
                min={0}
              />
            </Grid.Col>
          </Grid>

          <Switch
            label="Active"
            checked={formData.isActive}
            onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="outline" onClick={() => {
              setModalOpen(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingWarehouse ? 'Update' : 'Create'} Warehouse
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setWarehouseToDelete(null);
        }}
        title="Confirm Deletion"
        size="sm"
      >
        <Stack>
          <Alert icon={<IconAlertCircle size={16} />} color="red">
            Are you sure you want to delete "{warehouseToDelete?.name}"? This action cannot be undone.
          </Alert>
          <Group justify="flex-end">
            <Button variant="outline" onClick={() => {
              setDeleteModalOpen(false);
              setWarehouseToDelete(null);
            }}>
              Cancel
            </Button>
            <Button color="red" onClick={handleDelete}>
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
};

export default WarehousesPage;
