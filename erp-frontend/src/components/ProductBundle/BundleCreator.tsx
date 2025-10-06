// Product Bundle Creator Component
// This component uses Two Sum algorithm to find product combinations

import React, { useState, useEffect } from 'react';
import { SAPCard } from '../UI/SAPCard';
import { SAPButton } from '../UI/SAPButton';
import { SAPInput } from '../UI/SAPInput';
import { SAPSelect } from '../UI/SAPSelect';
import { SAPTable } from '../UI/SAPTable';
import { BundleService, BundleResult } from '../../services/bundleService';
import { Product, Category } from '../../services/inventory';
import { IconSearch, IconShoppingCart, IconX } from '@tabler/icons-react';

interface BundleCreatorProps {
  products: Product[];
  categories: Category[];
  onAddToCart?: (bundle: BundleResult) => void;
}

export const BundleCreator: React.FC<BundleCreatorProps> = ({
  products,
  categories,
  onAddToCart
}) => {
  const [targetPrice, setTargetPrice] = useState<number>(100);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [excludeOutOfStock, setExcludeOutOfStock] = useState(true);
  const [bundles, setBundles] = useState<BundleResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchMode, setSearchMode] = useState<'exact' | 'closest' | 'all'>('exact');

  const findBundles = () => {
    setLoading(true);
    
    try {
      let results: BundleResult[] = [];
      
      switch (searchMode) {
        case 'exact':
          const exactResult = BundleService.findProductsByTargetPrice(products, {
            targetPrice,
            categories: selectedCategories.length > 0 ? selectedCategories : undefined,
            excludeOutOfStock
          });
          results = exactResult.found ? [exactResult] : [];
          break;
          
        case 'closest':
          const closestResult = BundleService.findClosestBundle(products, {
            targetPrice,
            categories: selectedCategories.length > 0 ? selectedCategories : undefined,
            excludeOutOfStock
          });
          results = closestResult.found ? [closestResult] : [];
          break;
          
        case 'all':
          results = BundleService.findAllBundles(products, {
            targetPrice,
            categories: selectedCategories.length > 0 ? selectedCategories : undefined,
            excludeOutOfStock
          });
          break;
      }
      
      setBundles(results);
    } catch (error) {
      console.error('Error finding bundles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (products.length > 0) {
      findBundles();
    }
  }, [products, targetPrice, selectedCategories, excludeOutOfStock, searchMode]);

  const handleAddToCart = (bundle: BundleResult) => {
    if (onAddToCart) {
      onAddToCart(bundle);
    }
  };

  const formatPrice = (price: number) => `$${price.toFixed(2)}`;

  const bundleColumns = [
    {
      key: 'products',
      label: 'Products',
      render: (bundle: BundleResult) => (
        <div className="space-y-1">
          {bundle.products.map((product, index) => (
            <div key={product._id} className="flex items-center space-x-2">
              <span className="text-sm font-medium">{product.name}</span>
              <span className="text-xs text-gray-500">({formatPrice(product.price)})</span>
            </div>
          ))}
        </div>
      )
    },
    {
      key: 'totalPrice',
      label: 'Total Price',
      render: (bundle: BundleResult) => (
        <span className="font-semibold text-green-600">
          {formatPrice(bundle.totalPrice)}
        </span>
      )
    },
    {
      key: 'savings',
      label: 'Savings',
      render: (bundle: BundleResult) => (
        <span className={`font-medium ${bundle.savings && bundle.savings > 0 ? 'text-green-600' : 'text-gray-500'}`}>
          {bundle.savings && bundle.savings > 0 ? `-${formatPrice(bundle.savings)}` : 'No savings'}
        </span>
      )
    },
    {
      key: 'difference',
      label: 'Difference',
      render: (bundle: BundleResult) => (
        <span className={`text-sm ${bundle.difference === 0 ? 'text-green-600' : 'text-orange-600'}`}>
          {bundle.difference === 0 ? 'Exact match' : `±${formatPrice(bundle.difference)}`}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (bundle: BundleResult) => (
        <SAPButton
          size="sm"
          variant="primary"
          onClick={() => handleAddToCart(bundle)}
          className="flex items-center space-x-1"
        >
          <IconShoppingCart size={16} />
          <span>Add to Cart</span>
        </SAPButton>
      )
    }
  ];

  return (
    <SAPCard className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Product Bundle Creator
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Find products that can be combined to match your target price using advanced algorithms.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Price
            </label>
            <SAPInput
              type="number"
              value={targetPrice}
              onChange={(e) => setTargetPrice(Number(e.target.value))}
              placeholder="Enter target price"
              min="0"
              step="0.01"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Mode
            </label>
            <SAPSelect
              value={searchMode}
              onChange={(e) => setSearchMode(e.target.value as any)}
            >
              <option value="exact">Exact Match</option>
              <option value="closest">Closest Match</option>
              <option value="all">All Combinations</option>
            </SAPSelect>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categories
            </label>
            <SAPSelect
              multiple
              value={selectedCategories}
              onChange={(e) => {
                const values = Array.from(e.target.selectedOptions, option => option.value);
                setSelectedCategories(values);
              }}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </SAPSelect>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="excludeOutOfStock"
              checked={excludeOutOfStock}
              onChange={(e) => setExcludeOutOfStock(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="excludeOutOfStock" className="text-sm text-gray-700">
              Exclude out of stock
            </label>
          </div>
        </div>
        
        <SAPButton
          onClick={findBundles}
          loading={loading}
          className="flex items-center space-x-2"
        >
          <IconSearch size={16} />
          <span>Find Bundles</span>
        </SAPButton>
      </div>

      {bundles.length > 0 ? (
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-3">
            Found {bundles.length} bundle{bundles.length !== 1 ? 's' : ''}
          </h4>
          <SAPTable
            data={bundles}
            columns={bundleColumns}
            keyField="products"
          />
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <IconX size={48} className="mx-auto mb-4 text-gray-300" />
          <p>No bundles found for the selected criteria.</p>
          <p className="text-sm">Try adjusting your target price or search mode.</p>
        </div>
      )}
    </SAPCard>
  );
};

export default BundleCreator;

