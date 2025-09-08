import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { SAPPageLayout } from '../components/Layout/SAPPageLayout';
import { SAPCard } from '../components/UI/SAPCard';
import { SAPButton } from '../components/UI/SAPButton';
import { IconArrowLeft, IconCheck, IconX, IconUpload, IconPhoto } from '@tabler/icons-react';
import { 
  ProductService, 
  CategoryService, 
  SupplierService, 
  WarehouseService,
  InventoryService,
  Product, 
  Category, 
  Supplier, 
  Warehouse 
} from '../services/inventory';
import { imageUploadService, UploadProgress } from '../services/imageUpload';
import { isBlobUrl } from '../utils/imageUtils';
import ProductImage from '../components/UI/ProductImage';

interface CreateProductFormData {
  sku: string;
  name: string;
  description: string;
  categoryId: string;
  price: number;
  cost: number;
  unit: string;
  currentStock: number;
  minStockLevel: number;
  maxStockLevel: number;
  reorderPoint: number;
  reorderQuantity: number;
  barcode: string;
  isActive: boolean;
  isTrackable: boolean;
  weight: number;
  dimensions: string;
  tags: string;
  images: string[];
  supplierIds: string[];
  warehouseId: string;
}

const CreateProductPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<CreateProductFormData>({
    sku: '',
    name: '',
    description: '',
    categoryId: '',
    price: 0,
    cost: 0,
    unit: 'piece',
    currentStock: 0,
    minStockLevel: 0,
    maxStockLevel: 0,
    reorderPoint: 0,
    reorderQuantity: 0,
    barcode: '',
    isActive: true,
    isTrackable: false,
    weight: 0,
    dimensions: '',
    tags: '',
    images: [],
    supplierIds: [],
    warehouseId: '',
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, UploadProgress>>({});
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [initialStocks, setInitialStocks] = useState<Array<{ warehouseId: string; quantity: number; notes?: string }>>([]);

  // Fetch reference data
  const fetchReferenceData = useCallback(async () => {
    try {
      const [categoriesRes, suppliersRes, warehousesRes] = await Promise.all([
        CategoryService.getCategories({ limit: 1000, isActive: true }),
        SupplierService.getSuppliers({ limit: 1000, isActive: true }),
        WarehouseService.getWarehouses({ limit: 1000, isActive: true })
      ]);

      setCategories(categoriesRes.categories || []);
      setSuppliers(suppliersRes.suppliers || []);
      setWarehouses(warehousesRes.warehouses || []);
    } catch (err) {
      console.error('Error fetching reference data:', err);
      setError('Failed to load reference data');
    }
  }, []);

  useEffect(() => {
    fetchReferenceData();
  }, [fetchReferenceData]);

  const handleInputChange = (field: keyof CreateProductFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayChange = (field: 'supplierIds' | 'images', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value ? value.split(',').map(item => item.trim()).filter(Boolean) : []
    }));
  };

  // Handle file upload
  const handleFileUpload = async (files: FileList) => {
    const fileArray = Array.from(files);
    
    // Validate files
    const validFiles = fileArray.filter(file => {
      const validation = imageUploadService.validateImage(file);
      if (!validation.valid) {
        alert(`File ${file.name}: ${validation.error}`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(true);
    
    try {
      // For new products, we'll use a temporary ID
      const tempProductId = 'temp-' + Date.now();
      
      const uploadPromises = validFiles.map(async (file) => {
        return imageUploadService.uploadImage(
          file, 
          tempProductId,
          (progress) => {
            setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
          }
        );
      });

      const uploadResults = await Promise.all(uploadPromises);
      const newImageUrls = uploadResults.map(result => result.url);
      
      // Check for blob URLs and warn user
      const blobUrls = newImageUrls.filter(url => isBlobUrl(url));
      if (blobUrls.length > 0) {
        console.warn('Some images are using blob URLs (temporary):', blobUrls);
        // You could show a warning to the user here
      }
      
      // Add to uploaded images
      setUploadedImages(prev => [...prev, ...newImageUrls]);
      
      // Clear upload progress
      setUploadProgress({});
      
    } catch (err) {
      console.error('Error uploading images:', err);
      setError('Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
  };

  // Remove uploaded image
  const removeUploadedImage = (imageUrl: string) => {
    setUploadedImages(prev => prev.filter(img => img !== imageUrl));
  };

  const validateForm = (): string | null => {
    if (!formData.sku.trim()) return 'SKU is required';
    if (!formData.name.trim()) return 'Product name is required';
    if (!formData.categoryId) return 'Category is required';
    if (formData.price <= 0) return 'Price must be greater than 0';
    if (formData.cost < 0) return 'Cost cannot be negative';
    if (!formData.unit.trim()) return 'Unit is required';
    if (formData.currentStock < 0) return 'Current stock cannot be negative';
    if (formData.minStockLevel < 0) return 'Minimum stock level cannot be negative';
    if (formData.maxStockLevel < 0) return 'Maximum stock level cannot be negative';
    if (formData.reorderPoint < 0) return 'Reorder point cannot be negative';
    if (formData.reorderQuantity < 0) return 'Reorder quantity cannot be negative';
    if (formData.weight < 0) return 'Weight cannot be negative';
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Combine uploaded images with manually entered image URLs
      const allImages = [...uploadedImages, ...formData.images];

      // Prepare data for backend
      const productData = {
        sku: formData.sku.trim(),
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        categoryId: formData.categoryId,
        price: formData.price,
        cost: formData.cost,
        unit: formData.unit.trim(),
        currentStock: formData.currentStock,
        minStockLevel: formData.minStockLevel,
        maxStockLevel: formData.maxStockLevel,
        reorderPoint: formData.reorderPoint,
        reorderQuantity: formData.reorderQuantity,
        barcode: formData.barcode.trim() || undefined,
        isActive: formData.isActive,
        isTrackable: formData.isTrackable,
        weight: formData.weight || undefined,
        dimensions: formData.dimensions.trim() || undefined,
        tags: formData.tags.trim() || undefined,
        images: allImages.length > 0 ? allImages : undefined,
        supplierIds: formData.supplierIds.length > 0 ? formData.supplierIds : undefined,
      };

      const created = await ProductService.createProduct(productData);

      // Create initial stock for selected warehouse if provided
      if (formData.warehouseId && formData.currentStock > 0) {
        try {
          await InventoryService.adjustStock({
            productId: (created as any)._id || (created as any).id,
            warehouseId: formData.warehouseId,
            quantity: formData.currentStock,
            reason: 'initial_stock',
            performedBy: 'system',
          });
        } catch (err) {
          console.error('Failed to set initial stock for selected warehouse', formData.warehouseId, err);
        }
      }

      // Optionally create initial stock per warehouse
      for (const entry of initialStocks) {
        if (!entry.warehouseId || !entry.quantity || entry.quantity <= 0) continue;
        try {
          await InventoryService.adjustStock({
            productId: (created as any)._id || (created as any).id,
            warehouseId: entry.warehouseId,
            quantity: entry.quantity,
            reason: 'initial_stock',
            notes: entry.notes,
            performedBy: 'system',
          });
        } catch (err) {
          console.error('Failed to set initial stock for warehouse', entry.warehouseId, err);
        }
      }
      
      // Note: Stock management is handled separately through the inventory system
      // Products are created without stock quantities - stock is managed per warehouse

      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard/inventory/products');
      }, 2000);

    } catch (err: any) {
      console.error('Error creating product:', err);
      setError(err.response?.data?.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  const pageActions = (
    <div style={{ display: 'flex', gap: '12px' }}>
      <SAPButton
        variant="outline"
        onClick={() => navigate('/dashboard/inventory/products')}
      >
        <IconArrowLeft size={16} />
        Back to Products
      </SAPButton>
    </div>
  );

  if (success) {
    return (
      <SAPPageLayout
        title="Product Created"
        subtitle="Your product has been successfully created"
        actions={pageActions}
      >
        <SAPCard>
          <div style={{ 
            padding: '48px', 
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#10B98120',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <IconCheck size={32} color="#10B981" />
            </div>
            <div>
              <h3 style={{ 
                margin: '0 0 8px 0', 
                color: 'var(--sap-text-primary)',
                fontSize: '20px',
                fontWeight: '600'
              }}>
                Product Created Successfully!
              </h3>
              <p style={{ 
                margin: 0, 
                color: 'var(--sap-text-secondary)',
                fontSize: '14px'
              }}>
                Redirecting to products page...
              </p>
            </div>
          </div>
        </SAPCard>
      </SAPPageLayout>
    );
  }

  return (
    <SAPPageLayout
      title="Create New Product"
      subtitle="Add a new product to your inventory"
      actions={pageActions}
    >
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gap: '24px' }}>
          {/* Basic Information */}
          <SAPCard>
            <div style={{ padding: '24px' }}>
              <h3 style={{ 
                margin: '0 0 24px 0', 
                color: 'var(--sap-text-primary)',
                fontSize: '18px',
                fontWeight: '600'
              }}>
                Basic Information
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600',
                    color: 'var(--sap-text-primary)'
                  }}>
                    SKU *
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => handleInputChange('sku', e.target.value)}
                    placeholder="Enter product SKU"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--sap-neutral-300)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: 'var(--sap-bg-primary)',
                      color: 'var(--sap-text-primary)'
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600',
                    color: 'var(--sap-text-primary)'
                  }}>
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter product name"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--sap-neutral-300)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: 'var(--sap-bg-primary)',
                      color: 'var(--sap-text-primary)'
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600',
                    color: 'var(--sap-text-primary)'
                  }}>
                    Category *
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => handleInputChange('categoryId', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--sap-neutral-300)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: 'var(--sap-bg-primary)',
                      color: 'var(--sap-text-primary)'
                    }}
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map(category => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600',
                    color: 'var(--sap-text-primary)'
                  }}>
                    Unit *
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => handleInputChange('unit', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--sap-neutral-300)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: 'var(--sap-bg-primary)',
                      color: 'var(--sap-text-primary)'
                    }}
                    required
                  >
                    <option value="piece">Piece</option>
                    <option value="kg">Kilogram</option>
                    <option value="g">Gram</option>
                    <option value="liter">Liter</option>
                    <option value="ml">Milliliter</option>
                    <option value="box">Box</option>
                    <option value="pack">Pack</option>
                    <option value="set">Set</option>
                    <option value="pair">Pair</option>
                    <option value="dozen">Dozen</option>
                  </select>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600',
                    color: 'var(--sap-text-primary)'
                  }}>
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Enter product description"
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--sap-neutral-300)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: 'var(--sap-bg-primary)',
                      color: 'var(--sap-text-primary)',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>
            </div>
          </SAPCard>

          {/* Pricing & Cost */}
          <SAPCard>
            <div style={{ padding: '24px' }}>
              <h3 style={{ 
                margin: '0 0 24px 0', 
                color: 'var(--sap-text-primary)',
                fontSize: '18px',
                fontWeight: '600'
              }}>
                Pricing & Cost
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600',
                    color: 'var(--sap-text-primary)'
                  }}>
                    Selling Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--sap-neutral-300)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: 'var(--sap-bg-primary)',
                      color: 'var(--sap-text-primary)'
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600',
                    color: 'var(--sap-text-primary)'
                  }}>
                    Cost Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cost}
                    onChange={(e) => handleInputChange('cost', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--sap-neutral-300)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: 'var(--sap-bg-primary)',
                      color: 'var(--sap-text-primary)'
                    }}
                    required
                  />
                </div>
              </div>
            </div>
          </SAPCard>

          {/* Stock Management */}
          <SAPCard>
            <div style={{ padding: '24px' }}>
              <h3 style={{ 
                margin: '0 0 24px 0', 
                color: 'var(--sap-text-primary)',
                fontSize: '18px',
                fontWeight: '600'
              }}>
                Stock Management
              </h3>
              
              <div style={{
                padding: '12px 16px',
                backgroundColor: '#F0F9FF',
                border: '1px solid #BAE6FD',
                borderRadius: '8px',
                color: '#0369A1',
                fontSize: '14px',
                marginBottom: '20px'
              }}>
                <strong>Note:</strong> Stock quantities are managed separately through the inventory system. 
                Set the stock levels below to define when to reorder products.
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600',
                    color: 'var(--sap-text-primary)'
                  }}>
                    Current Stock *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.currentStock}
                    onChange={(e) => handleInputChange('currentStock', parseInt(e.target.value) || 0)}
                    placeholder="0"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--sap-neutral-300)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: 'var(--sap-bg-primary)',
                      color: 'var(--sap-text-primary)'
                    }}
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600',
                    color: 'var(--sap-text-primary)'
                  }}>
                    Minimum Stock Level *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minStockLevel}
                    onChange={(e) => handleInputChange('minStockLevel', parseInt(e.target.value) || 0)}
                    placeholder="0"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--sap-neutral-300)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: 'var(--sap-bg-primary)',
                      color: 'var(--sap-text-primary)'
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600',
                    color: 'var(--sap-text-primary)'
                  }}>
                    Maximum Stock Level *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.maxStockLevel}
                    onChange={(e) => handleInputChange('maxStockLevel', parseInt(e.target.value) || 0)}
                    placeholder="0"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--sap-neutral-300)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: 'var(--sap-bg-primary)',
                      color: 'var(--sap-text-primary)'
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600',
                    color: 'var(--sap-text-primary)'
                  }}>
                    Reorder Point *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.reorderPoint}
                    onChange={(e) => handleInputChange('reorderPoint', parseInt(e.target.value) || 0)}
                    placeholder="0"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--sap-neutral-300)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: 'var(--sap-bg-primary)',
                      color: 'var(--sap-text-primary)'
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600',
                    color: 'var(--sap-text-primary)'
                  }}>
                    Reorder Quantity *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.reorderQuantity}
                    onChange={(e) => handleInputChange('reorderQuantity', parseInt(e.target.value) || 0)}
                    placeholder="0"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--sap-neutral-300)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: 'var(--sap-bg-primary)',
                      color: 'var(--sap-text-primary)'
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600',
                    color: 'var(--sap-text-primary)'
                  }}>
                    Warehouse
                  </label>
                  <select
                    value={formData.warehouseId}
                    onChange={(e) => handleInputChange('warehouseId', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--sap-neutral-300)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: 'var(--sap-bg-primary)',
                      color: 'var(--sap-text-primary)'
                    }}
                  >
                    <option value="">Select warehouse (optional)</option>
                    {warehouses.map(warehouse => (
                      <option key={warehouse._id} value={warehouse._id}>
                        {warehouse.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </SAPCard>

          {/* Product Images */}
          <SAPCard>
            <div style={{ padding: '24px' }}>
              <h3 style={{ 
                margin: '0 0 24px 0', 
                color: 'var(--sap-text-primary)',
                fontSize: '18px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <IconPhoto size={20} />
                Product Images
              </h3>
              
              {/* Upload Area */}
              <div style={{
                border: '2px dashed var(--sap-neutral-300)',
                borderRadius: '8px',
                padding: '32px',
                textAlign: 'center',
                marginBottom: '24px',
                backgroundColor: 'var(--sap-bg-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = 'var(--sap-primary-500)';
                e.currentTarget.style.backgroundColor = 'var(--sap-primary-50)';
              }}
              onDragLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--sap-neutral-300)';
                e.currentTarget.style.backgroundColor = 'var(--sap-bg-secondary)';
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = 'var(--sap-neutral-300)';
                e.currentTarget.style.backgroundColor = 'var(--sap-bg-secondary)';
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                  handleFileUpload(files);
                }
              }}
              >
                <IconUpload size={32} color="var(--sap-text-secondary)" />
                <p style={{ 
                  margin: '12px 0 0 0', 
                  color: 'var(--sap-text-secondary)',
                  fontSize: '14px'
                }}>
                  Click to upload or drag and drop images here
                </p>
                <p style={{ 
                  margin: '4px 0 0 0', 
                  color: 'var(--sap-text-tertiary)',
                  fontSize: '12px'
                }}>
                  PNG, JPG, WEBP, GIF up to 5MB each
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileInputChange}
                style={{ display: 'none' }}
              />

              {/* Upload Progress */}
              {Object.keys(uploadProgress).length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  {Object.entries(uploadProgress).map(([fileName, progress]) => (
                    <div key={fileName} style={{ marginBottom: '8px' }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '4px'
                      }}>
                        <span style={{ fontSize: '12px', color: 'var(--sap-text-secondary)' }}>
                          {fileName}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--sap-text-secondary)' }}>
                          {progress.percentage}%
                        </span>
                      </div>
                      <div style={{
                        width: '100%',
                        height: '4px',
                        backgroundColor: 'var(--sap-neutral-200)',
                        borderRadius: '2px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${progress.percentage}%`,
                          height: '100%',
                          backgroundColor: 'var(--sap-primary-500)',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Uploaded Images Preview */}
              {uploadedImages.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ 
                    margin: '0 0 16px 0', 
                    color: 'var(--sap-text-primary)',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    Uploaded Images ({uploadedImages.length})
                  </h4>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
                    gap: '12px' 
                  }}>
                    {uploadedImages.map((imageUrl, index) => (
                      <div key={index} style={{ position: 'relative' }}>
                        <ProductImage
                          src={imageUrl}
                          alt={`Uploaded image ${index + 1}`}
                          width="100%"
                          height={120}
                          style={{
                            borderRadius: '8px',
                            border: '1px solid var(--sap-neutral-200)'
                          }}
                        />
                        {isBlobUrl(imageUrl) && (
                          <div style={{
                            position: 'absolute',
                            top: '4px',
                            left: '4px',
                            backgroundColor: 'rgba(245, 158, 11, 0.9)',
                            color: 'white',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: '600'
                          }}>
                            TEMP
                          </div>
                        )}
                        <button
                          onClick={() => removeUploadedImage(imageUrl)}
                          style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(220, 38, 38, 0.9)',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10px'
                          }}
                        >
                          <IconX size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Manual Image URLs */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '600',
                  color: 'var(--sap-text-primary)'
                }}>
                  Image URLs (Alternative)
                </label>
                <input
                  type="text"
                  value={formData.images.join(', ')}
                  onChange={(e) => handleArrayChange('images', e.target.value)}
                  placeholder="Enter image URLs separated by commas"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid var(--sap-neutral-300)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: 'var(--sap-bg-primary)',
                    color: 'var(--sap-text-primary)'
                  }}
                />
                <p style={{ 
                  margin: '8px 0 0 0', 
                  fontSize: '12px', 
                  color: 'var(--sap-text-secondary)' 
                }}>
                  You can also enter image URLs manually, or use both upload and URLs together
                </p>
              </div>
            </div>
          </SAPCard>

          {/* Additional Information */}
          <SAPCard>
            <div style={{ padding: '24px' }}>
              <h3 style={{ 
                margin: '0 0 24px 0', 
                color: 'var(--sap-text-primary)',
                fontSize: '18px',
                fontWeight: '600'
              }}>
                Additional Information
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600',
                    color: 'var(--sap-text-primary)'
                  }}>
                    Barcode
                  </label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => handleInputChange('barcode', e.target.value)}
                    placeholder="Enter barcode"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--sap-neutral-300)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: 'var(--sap-bg-primary)',
                      color: 'var(--sap-text-primary)'
                    }}
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600',
                    color: 'var(--sap-text-primary)'
                  }}>
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.weight}
                    onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--sap-neutral-300)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: 'var(--sap-bg-primary)',
                      color: 'var(--sap-text-primary)'
                    }}
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600',
                    color: 'var(--sap-text-primary)'
                  }}>
                    Dimensions
                  </label>
                  <input
                    type="text"
                    value={formData.dimensions}
                    onChange={(e) => handleInputChange('dimensions', e.target.value)}
                    placeholder="e.g., 10x20x30 cm"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--sap-neutral-300)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: 'var(--sap-bg-primary)',
                      color: 'var(--sap-text-primary)'
                    }}
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600',
                    color: 'var(--sap-text-primary)'
                  }}>
                    Tags
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => handleInputChange('tags', e.target.value)}
                    placeholder="Enter tags separated by commas"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--sap-neutral-300)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: 'var(--sap-bg-primary)',
                      color: 'var(--sap-text-primary)'
                    }}
                  />
                </div>


                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600',
                    color: 'var(--sap-text-primary)'
                  }}>
                    Suppliers
                  </label>
                  <input
                    type="text"
                    value={formData.supplierIds.join(', ')}
                    onChange={(e) => handleArrayChange('supplierIds', e.target.value)}
                    placeholder="Enter supplier IDs separated by commas"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--sap-neutral-300)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: 'var(--sap-bg-primary)',
                      color: 'var(--sap-text-primary)'
                    }}
                  />
                  <div style={{ 
                    marginTop: '8px', 
                    fontSize: '12px', 
                    color: 'var(--sap-text-secondary)' 
                  }}>
                    Available suppliers: {suppliers.map(s => s.name).join(', ')}
                  </div>
                </div>
              </div>

              <div style={{ 
                display: 'flex', 
                gap: '20px', 
                marginTop: '24px',
                flexWrap: 'wrap'
              }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                    style={{ transform: 'scale(1.2)' }}
                  />
                  <span style={{ 
                    fontWeight: '600',
                    color: 'var(--sap-text-primary)'
                  }}>
                    Active Product
                  </span>
                </label>

                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={formData.isTrackable}
                    onChange={(e) => handleInputChange('isTrackable', e.target.checked)}
                    style={{ transform: 'scale(1.2)' }}
                  />
                  <span style={{ 
                    fontWeight: '600',
                    color: 'var(--sap-text-primary)'
                  }}>
                    Trackable (Serial Numbers/Batches)
                  </span>
                </label>
              </div>
            </div>
          </SAPCard>

          {/* Error Message */}
          {error && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '8px',
              color: '#DC2626',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <IconX size={16} />
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: '12px',
            padding: '24px 0'
          }}>
            <SAPButton
              type="button"
              variant="outline"
              onClick={() => navigate('/dashboard/inventory/products')}
            >
              Cancel
            </SAPButton>
            <SAPButton
              type="submit"
              variant="primary"
              loading={loading}
            >
              Create Product
            </SAPButton>
          </div>
        </div>
      </form>
    </SAPPageLayout>
  );
};

export default CreateProductPage;
