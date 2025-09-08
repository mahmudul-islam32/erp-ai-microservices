import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SAPPageLayout } from '../components/Layout/SAPPageLayout';
import { SAPCard } from '../components/UI/SAPCard';
import { SAPButton } from '../components/UI/SAPButton';
import { 
  IconArrowLeft, 
  IconEdit, 
  IconTrash, 
  IconUpload, 
  IconX, 
  IconPhoto,
  IconPackage,
  IconTag,
  IconCurrencyDollar,
  IconScale,
  IconRuler,
  IconBarcode,
  IconCheck,
  IconAlertCircle
} from '@tabler/icons-react';
import { 
  ProductService, 
  CategoryService, 
  SupplierService, 
  WarehouseService,
  Product, 
  Category, 
  Supplier, 
  Warehouse 
} from '../services/inventory';
import { imageUploadService, UploadProgress } from '../services/imageUpload';

const ProductDetailPage = () => {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [product, setProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, UploadProgress>>({});

  // Fetch product data
  const fetchProduct = useCallback(async () => {
    if (!productId) return;
    
    try {
      setLoading(true);
      setError(null);
      const productData = await ProductService.getProductById(productId);
      setProduct(productData);
      
      // Fetch category if categoryId is a string
      if (typeof productData.categoryId === 'string') {
        try {
          const categoryData = await CategoryService.getCategoryById(productData.categoryId);
          setCategory(categoryData);
        } catch (err) {
          console.warn('Could not fetch category:', err);
        }
      } else if (typeof productData.categoryId === 'object' && productData.categoryId?.name) {
        // Category is already populated
        setCategory(productData.categoryId as any);
      }
      
    } catch (err) {
      console.error('Error fetching product:', err);
      setError('Failed to load product details');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  // Fetch reference data
  const fetchReferenceData = useCallback(async () => {
    try {
      const [suppliersRes, warehousesRes] = await Promise.all([
        SupplierService.getSuppliers({ limit: 1000, isActive: true }),
        WarehouseService.getWarehouses({ limit: 1000, isActive: true })
      ]);
      
      setSuppliers(suppliersRes.suppliers || []);
      setWarehouses(warehousesRes.warehouses || []);
    } catch (err) {
      console.error('Error fetching reference data:', err);
    }
  }, []);

  useEffect(() => {
    fetchProduct();
    fetchReferenceData();
  }, [fetchProduct, fetchReferenceData]);

  // Handle file upload
  const handleFileUpload = async (files: FileList) => {
    if (!product) return;
    
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
      const uploadPromises = validFiles.map(async (file) => {
        return imageUploadService.uploadImage(
          file, 
          product._id,
          (progress) => {
            setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
          }
        );
      });

      const uploadResults = await Promise.all(uploadPromises);
      const uploadedUrls = uploadResults.map(result => result.url);
      
      // Update product with new image URLs
      const updatedImages = [...(product.images || []), ...uploadedUrls];
      const updatedProduct = { ...product, images: updatedImages };
      
      // Update product in backend
      await ProductService.updateProduct(product._id, { images: updatedImages });
      setProduct(updatedProduct);
      
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

  // Remove image
  const removeImage = async (imageUrl: string) => {
    if (!product) return;
    
    try {
      // Delete from server
      await imageUploadService.deleteImage(imageUrl);
      
      // Update local state
      const updatedImages = product.images?.filter(img => img !== imageUrl) || [];
      await ProductService.updateProduct(product._id, { images: updatedImages });
      setProduct({ ...product, images: updatedImages });
    } catch (err) {
      console.error('Error removing image:', err);
      setError('Failed to remove image');
    }
  };

  // Delete product
  const handleDelete = async () => {
    if (!product || !confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await ProductService.deleteProduct(product._id);
      navigate('/dashboard/inventory/products');
    } catch (err) {
      console.error('Error deleting product:', err);
      setError('Failed to delete product');
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
      <SAPButton
        variant="outline"
        onClick={() => navigate(`/dashboard/inventory/products/${productId}/edit`)}
      >
        <IconEdit size={16} />
        Edit Product
      </SAPButton>
      <SAPButton
        variant="outline"
        onClick={handleDelete}
        style={{ color: '#DC2626', borderColor: '#DC2626' }}
      >
        <IconTrash size={16} />
        Delete
      </SAPButton>
    </div>
  );

  if (loading) {
    return (
      <SAPPageLayout
        title="Loading..."
        subtitle="Fetching product details"
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
              width: '48px',
              height: '48px',
              border: '4px solid var(--sap-neutral-200)',
              borderTop: '4px solid var(--sap-primary-500)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <p style={{ color: 'var(--sap-text-secondary)' }}>
              Loading product details...
            </p>
          </div>
        </SAPCard>
      </SAPPageLayout>
    );
  }

  if (error || !product) {
    return (
      <SAPPageLayout
        title="Error"
        subtitle="Failed to load product"
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
            <IconAlertCircle size={48} color="#DC2626" />
            <div>
              <h3 style={{ 
                margin: '0 0 8px 0', 
                color: 'var(--sap-text-primary)',
                fontSize: '20px',
                fontWeight: '600'
              }}>
                {error || 'Product not found'}
              </h3>
              <p style={{ 
                margin: 0, 
                color: 'var(--sap-text-secondary)',
                fontSize: '14px'
              }}>
                The product you're looking for could not be loaded.
              </p>
            </div>
          </div>
        </SAPCard>
      </SAPPageLayout>
    );
  }

  return (
    <SAPPageLayout
      title={product.name}
      subtitle={`SKU: ${product.sku}`}
      actions={pageActions}
    >
      <div style={{ display: 'grid', gap: '24px' }}>
        {/* Product Images Section */}
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

            {/* Image Gallery */}
            {product.images && product.images.length > 0 ? (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                gap: '16px' 
              }}>
                {product.images.map((imageUrl, index) => (
                  <div key={index} style={{ position: 'relative' }}>
                    <img
                      src={imageUrl}
                      alt={`Product image ${index + 1}`}
                      style={{
                        width: '100%',
                        height: '200px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: '1px solid var(--sap-neutral-200)'
                      }}
                    />
                    <button
                      onClick={() => removeImage(imageUrl)}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(220, 38, 38, 0.9)',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px'
                      }}
                    >
                      <IconX size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '32px',
                color: 'var(--sap-text-secondary)',
                fontSize: '14px'
              }}>
                No images uploaded yet
              </div>
            )}
          </div>
        </SAPCard>

        {/* Product Details */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
          {/* Basic Information */}
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
                <IconPackage size={20} />
                Basic Information
              </h3>
              
              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '4px', 
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--sap-text-secondary)',
                    textTransform: 'uppercase'
                  }}>
                    Product Name
                  </label>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '16px',
                    color: 'var(--sap-text-primary)',
                    fontWeight: '600'
                  }}>
                    {product.name}
                  </p>
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '4px', 
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--sap-text-secondary)',
                    textTransform: 'uppercase'
                  }}>
                    SKU
                  </label>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '14px',
                    color: 'var(--sap-text-primary)',
                    fontFamily: 'monospace'
                  }}>
                    {product.sku}
                  </p>
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '4px', 
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--sap-text-secondary)',
                    textTransform: 'uppercase'
                  }}>
                    Category
                  </label>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '14px',
                    color: 'var(--sap-text-primary)'
                  }}>
                    {category?.name || 'Uncategorized'}
                  </p>
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '4px', 
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--sap-text-secondary)',
                    textTransform: 'uppercase'
                  }}>
                    Description
                  </label>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '14px',
                    color: 'var(--sap-text-primary)',
                    lineHeight: '1.5'
                  }}>
                    {product.description || 'No description provided'}
                  </p>
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '4px', 
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--sap-text-secondary)',
                    textTransform: 'uppercase'
                  }}>
                    Status
                  </label>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    backgroundColor: product.isActive ? '#10B98120' : '#EF444420',
                    color: product.isActive ? '#10B981' : '#EF4444'
                  }}>
                    {product.isActive ? 'Active' : 'Inactive'}
                  </span>
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
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <IconCurrencyDollar size={20} />
                Pricing & Cost
              </h3>
              
              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '4px', 
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--sap-text-secondary)',
                    textTransform: 'uppercase'
                  }}>
                    Selling Price
                  </label>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '20px',
                    color: 'var(--sap-text-primary)',
                    fontWeight: '700'
                  }}>
                    ${product.price.toFixed(2)}
                  </p>
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '4px', 
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--sap-text-secondary)',
                    textTransform: 'uppercase'
                  }}>
                    Cost Price
                  </label>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '16px',
                    color: 'var(--sap-text-primary)',
                    fontWeight: '600'
                  }}>
                    ${product.cost.toFixed(2)}
                  </p>
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '4px', 
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--sap-text-secondary)',
                    textTransform: 'uppercase'
                  }}>
                    Profit Margin
                  </label>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '16px',
                    color: product.price > product.cost ? '#10B981' : '#EF4444',
                    fontWeight: '600'
                  }}>
                    {product.price > product.cost ? 
                      `$${(product.price - product.cost).toFixed(2)} (${(((product.price - product.cost) / product.price) * 100).toFixed(1)}%)` : 
                      'Loss'
                    }
                  </p>
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '4px', 
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--sap-text-secondary)',
                    textTransform: 'uppercase'
                  }}>
                    Unit
                  </label>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '14px',
                    color: 'var(--sap-text-primary)'
                  }}>
                    {product.unit}
                  </p>
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
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <IconTag size={20} />
                Stock Management
              </h3>
              
              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '4px', 
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--sap-text-secondary)',
                    textTransform: 'uppercase'
                  }}>
                    Minimum Stock Level
                  </label>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '16px',
                    color: 'var(--sap-text-primary)',
                    fontWeight: '600'
                  }}>
                    {product.minStockLevel}
                  </p>
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '4px', 
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--sap-text-secondary)',
                    textTransform: 'uppercase'
                  }}>
                    Maximum Stock Level
                  </label>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '16px',
                    color: 'var(--sap-text-primary)',
                    fontWeight: '600'
                  }}>
                    {product.maxStockLevel}
                  </p>
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '4px', 
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--sap-text-secondary)',
                    textTransform: 'uppercase'
                  }}>
                    Reorder Point
                  </label>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '16px',
                    color: 'var(--sap-text-primary)',
                    fontWeight: '600'
                  }}>
                    {product.reorderPoint}
                  </p>
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '4px', 
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--sap-text-secondary)',
                    textTransform: 'uppercase'
                  }}>
                    Reorder Quantity
                  </label>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '16px',
                    color: 'var(--sap-text-primary)',
                    fontWeight: '600'
                  }}>
                    {product.reorderQuantity}
                  </p>
                </div>
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
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <IconScale size={20} />
                Additional Information
              </h3>
              
              <div style={{ display: 'grid', gap: '16px' }}>
                {product.barcode && (
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '4px', 
                      fontSize: '12px',
                      fontWeight: '600',
                      color: 'var(--sap-text-secondary)',
                      textTransform: 'uppercase'
                    }}>
                      Barcode
                    </label>
                    <p style={{ 
                      margin: 0, 
                      fontSize: '14px',
                      color: 'var(--sap-text-primary)',
                      fontFamily: 'monospace'
                    }}>
                      {product.barcode}
                    </p>
                  </div>
                )}

                {product.weight && (
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '4px', 
                      fontSize: '12px',
                      fontWeight: '600',
                      color: 'var(--sap-text-secondary)',
                      textTransform: 'uppercase'
                    }}>
                      Weight
                    </label>
                    <p style={{ 
                      margin: 0, 
                      fontSize: '14px',
                      color: 'var(--sap-text-primary)'
                    }}>
                      {product.weight} kg
                    </p>
                  </div>
                )}

                {product.dimensions && (
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '4px', 
                      fontSize: '12px',
                      fontWeight: '600',
                      color: 'var(--sap-text-secondary)',
                      textTransform: 'uppercase'
                    }}>
                      Dimensions
                    </label>
                    <p style={{ 
                      margin: 0, 
                      fontSize: '14px',
                      color: 'var(--sap-text-primary)'
                    }}>
                      {product.dimensions}
                    </p>
                  </div>
                )}

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '4px', 
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--sap-text-secondary)',
                    textTransform: 'uppercase'
                  }}>
                    Trackable
                  </label>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '600',
                    backgroundColor: product.isTrackable ? '#10B98120' : '#EF444420',
                    color: product.isTrackable ? '#10B981' : '#EF4444'
                  }}>
                    {product.isTrackable ? <IconCheck size={12} /> : <IconX size={12} />}
                    {product.isTrackable ? 'Yes' : 'No'}
                  </span>
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '4px', 
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--sap-text-secondary)',
                    textTransform: 'uppercase'
                  }}>
                    Created
                  </label>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '14px',
                    color: 'var(--sap-text-primary)'
                  }}>
                    {new Date(product.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '4px', 
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--sap-text-secondary)',
                    textTransform: 'uppercase'
                  }}>
                    Last Updated
                  </label>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '14px',
                    color: 'var(--sap-text-primary)'
                  }}>
                    {new Date(product.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </SAPCard>
        </div>

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
            <IconAlertCircle size={16} />
            {error}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </SAPPageLayout>
  );
};

export default ProductDetailPage;
