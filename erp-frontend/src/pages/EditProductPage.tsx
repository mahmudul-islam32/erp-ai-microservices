import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SAPPageLayout } from '../components/Layout/SAPPageLayout';
import { SAPCard } from '../components/UI/SAPCard';
import { SAPButton } from '../components/UI/SAPButton';
import { IconArrowLeft, IconCheck, IconX } from '@tabler/icons-react';
import { ProductService, CategoryService, Product, Category } from '../services/inventory';

const EditProductPage: React.FC = () => {
  const navigate = useNavigate();
  const { productId } = useParams();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [product, setProduct] = useState<Product | null>(null);

  const [form, setForm] = useState({
    sku: '',
    name: '',
    description: '',
    categoryId: '',
    price: 0,
    cost: 0,
    unit: 'piece',
    isActive: true,
    images: [] as string[],
  });

  const pageActions = useMemo(() => (
    <div style={{ display: 'flex', gap: '12px' }}>
      <SAPButton
        variant="outline"
        onClick={() => navigate('/dashboard/inventory/products')}
      >
        <IconArrowLeft size={16} />
        Back to Products
      </SAPButton>
    </div>
  ), [navigate]);

  const loadCategories = useCallback(async () => {
    try {
      const response = await CategoryService.getCategories({ limit: 1000, isActive: true });
      setCategories(response.categories || []);
    } catch (err) {
      // Non-blocking
      console.warn('Failed to load categories', err);
    }
  }, []);

  const loadProduct = useCallback(async () => {
    if (!productId) return;
    try {
      setLoading(true);
      setError(null);
      const p = await ProductService.getProductById(productId);
      setProduct(p);
      setForm({
        sku: p.sku || '',
        name: p.name || '',
        description: p.description || '',
        categoryId: (typeof p.categoryId === 'string' ? p.categoryId : (p as any).categoryId?._id) || '',
        price: p.price || 0,
        cost: p.cost || 0,
        unit: p.unit || 'piece',
        isActive: p.isActive,
        images: p.images || [],
      });
    } catch (err) {
      console.error('Error loading product:', err);
      setError('Failed to load product');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadCategories();
    loadProduct();
  }, [loadCategories, loadProduct]);

  const updateField = (field: keyof typeof form, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleImagesChange = (value: string) => {
    updateField('images', value ? value.split(',').map(x => x.trim()).filter(Boolean) : []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) return;
    try {
      setSaving(true);
      setError(null);
      await ProductService.updateProduct(productId, {
        sku: form.sku.trim(),
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        categoryId: form.categoryId,
        price: form.price,
        cost: form.cost,
        unit: form.unit.trim(),
        isActive: form.isActive,
        images: form.images,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard/inventory/products');
      }, 1500);
    } catch (err: any) {
      console.error('Error updating product:', err);
      setError(err?.response?.data?.message || 'Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  if (success) {
    return (
      <SAPPageLayout
        title="Product Updated"
        subtitle="Your product has been updated successfully"
        actions={pageActions}
      >
        <SAPCard>
          <div style={{ padding: '48px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#10B98120', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconCheck size={32} color="#10B981" />
            </div>
            <div>
              <h3 style={{ margin: '0 0 8px 0', color: 'var(--sap-text-primary)', fontSize: '20px', fontWeight: '600' }}>Product Updated!</h3>
              <p style={{ margin: 0, color: 'var(--sap-text-secondary)', fontSize: '14px' }}>Redirecting to products page...</p>
            </div>
          </div>
        </SAPCard>
      </SAPPageLayout>
    );
  }

  return (
    <SAPPageLayout
      title="Edit Product"
      subtitle={product ? `Editing ${product.name}` : 'Load and update product information'}
      actions={pageActions}
    >
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gap: '24px' }}>
          <SAPCard>
            <div style={{ padding: '24px' }}>
              <h3 style={{ margin: '0 0 24px 0', color: 'var(--sap-text-primary)', fontSize: '18px', fontWeight: '600' }}>Basic Information</h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--sap-text-primary)' }}>SKU</label>
                  <input
                    type="text"
                    value={form.sku}
                    onChange={(e) => updateField('sku', e.target.value)}
                    placeholder="Enter product SKU"
                    style={{ width: '100%', padding: '12px', border: '1px solid var(--sap-neutral-300)', borderRadius: '8px', fontSize: '14px', backgroundColor: 'var(--sap-bg-primary)', color: 'var(--sap-text-primary)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--sap-text-primary)' }}>Product Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="Enter product name"
                    style={{ width: '100%', padding: '12px', border: '1px solid var(--sap-neutral-300)', borderRadius: '8px', fontSize: '14px', backgroundColor: 'var(--sap-bg-primary)', color: 'var(--sap-text-primary)' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--sap-text-primary)' }}>Category</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => updateField('categoryId', e.target.value)}
                    style={{ width: '100%', padding: '12px', border: '1px solid var(--sap-neutral-300)', borderRadius: '8px', fontSize: '14px', backgroundColor: 'var(--sap-bg-primary)', color: 'var(--sap-text-primary)' }}
                  >
                    <option value="">Select a category</option>
                    {categories.map(category => (
                      <option key={category._id} value={category._id}>{category.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--sap-text-primary)' }}>Unit</label>
                  <select
                    value={form.unit}
                    onChange={(e) => updateField('unit', e.target.value)}
                    style={{ width: '100%', padding: '12px', border: '1px solid var(--sap-neutral-300)', borderRadius: '8px', fontSize: '14px', backgroundColor: 'var(--sap-bg-primary)', color: 'var(--sap-text-primary)' }}
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
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--sap-text-primary)' }}>Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    placeholder="Enter product description"
                    rows={3}
                    style={{ width: '100%', padding: '12px', border: '1px solid var(--sap-neutral-300)', borderRadius: '8px', fontSize: '14px', backgroundColor: 'var(--sap-bg-primary)', color: 'var(--sap-text-primary)', resize: 'vertical' }}
                  />
                </div>
              </div>
            </div>
          </SAPCard>

          <SAPCard>
            <div style={{ padding: '24px' }}>
              <h3 style={{ margin: '0 0 24px 0', color: 'var(--sap-text-primary)', fontSize: '18px', fontWeight: '600' }}>Pricing</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--sap-text-primary)' }}>Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={(e) => updateField('price', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    style={{ width: '100%', padding: '12px', border: '1px solid var(--sap-neutral-300)', borderRadius: '8px', fontSize: '14px', backgroundColor: 'var(--sap-bg-primary)', color: 'var(--sap-text-primary)' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--sap-text-primary)' }}>Cost *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.cost}
                    onChange={(e) => updateField('cost', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    style={{ width: '100%', padding: '12px', border: '1px solid var(--sap-neutral-300)', borderRadius: '8px', fontSize: '14px', backgroundColor: 'var(--sap-bg-primary)', color: 'var(--sap-text-primary)' }}
                    required
                  />
                </div>
              </div>
            </div>
          </SAPCard>

          <SAPCard>
            <div style={{ padding: '24px' }}>
              <h3 style={{ margin: '0 0 24px 0', color: 'var(--sap-text-primary)', fontSize: '18px', fontWeight: '600' }}>Status & Images</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => updateField('isActive', e.target.checked)}
                    style={{ transform: 'scale(1.2)' }}
                  />
                  <span style={{ fontWeight: '600', color: 'var(--sap-text-primary)' }}>Active Product</span>
                </label>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--sap-text-primary)' }}>Image URLs</label>
                  <input
                    type="text"
                    value={form.images.join(', ')}
                    onChange={(e) => handleImagesChange(e.target.value)}
                    placeholder="Enter image URLs separated by commas"
                    style={{ width: '100%', padding: '12px', border: '1px solid var(--sap-neutral-300)', borderRadius: '8px', fontSize: '14px', backgroundColor: 'var(--sap-bg-primary)', color: 'var(--sap-text-primary)' }}
                  />
                </div>
              </div>
            </div>
          </SAPCard>

          {error && (
            <div style={{ padding: '12px 16px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', color: '#DC2626', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IconX size={16} />
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '24px 0' }}>
            <SAPButton type="button" variant="outline" onClick={() => navigate('/dashboard/inventory/products')}>
              Cancel
            </SAPButton>
            <SAPButton type="submit" variant="primary" loading={saving || loading}>
              Save Changes
            </SAPButton>
          </div>
        </div>
      </form>
    </SAPPageLayout>
  );
};

export default EditProductPage;


