import React, { useState, useEffect } from 'react';
import './POSApplication.css';
import paymentsApi from '../../services/paymentApi';
import { ProductService } from '../../services/inventory';

// Types for POS
interface POSProduct {
  _id: string;
  name: string;
  sku: string;
  price: number;
  category?: string;
  barcode?: string;
  isActive: boolean;
  stock?: number;
}

interface POSLineItem {
  product_id: string;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
  discount_percentage: number;
  total_price: number;
  notes?: string;
}

interface POSCustomer {
  customer_id?: string;
  name?: string;
  email?: string;
  phone?: string;
  is_walk_in: boolean;
}

interface POSPayment {
  payment_method: string;
  amount: number;
  cash_tendered?: number;
  change_given?: number;
}

const POSApplication: React.FC = () => {
  // State management
  const [products, setProducts] = useState<POSProduct[]>([]);
  const [cart, setCart] = useState<POSLineItem[]>([]);
  const [customer, setCustomer] = useState<POSCustomer>({ is_walk_in: true });
  const [payment, setPayment] = useState<POSPayment>({ payment_method: 'cash', amount: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>(['all']);

  // Load initial data
  useEffect(() => {
    loadProducts();
    checkActiveSession();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await ProductService.getProducts({ limit: 100, isActive: true });
      
      const activeProducts = response.products?.filter((p: POSProduct) => p.isActive) || [];
      setProducts(activeProducts);
      
      // Extract categories
      const uniqueCategories = ['all', ...new Set(activeProducts.map((p: POSProduct) => p.category).filter(Boolean) as string[])];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkActiveSession = async () => {
    try {
      const session = await paymentsApi.pos.getActiveSession();
      setActiveSession(session);
    } catch (error) {
      console.error('Error checking active session:', error);
    }
  };

  const startNewSession = async () => {
    try {
      const sessionData = {
        terminal_id: 'TERMINAL_001',
        opening_cash_amount: 200.00,
        notes: 'Session started'
      };
      
      const session = await paymentsApi.pos.startSession(sessionData);
      setActiveSession(session);
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  // Cart operations
  const addToCart = (product: POSProduct) => {
    const existingItem = cart.find(item => item.product_id === product._id);
    
    if (existingItem) {
      updateQuantity(product._id, existingItem.quantity + 1);
    } else {
      const newItem: POSLineItem = {
        product_id: product._id,
        product_name: product.name,
        product_sku: product.sku,
        quantity: 1,
        unit_price: product.price,
        discount_percentage: 0,
        total_price: product.price
      };
      setCart([...cart, newItem]);
    }
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(cart.map(item => 
      item.product_id === productId 
        ? { ...item, quantity: newQuantity, total_price: item.unit_price * newQuantity }
        : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCustomer({ is_walk_in: true });
    setPayment({ payment_method: 'cash', amount: 0 });
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.total_price, 0);
  const taxRate = 0.0875; // 8.75% tax
  const taxAmount = subtotal * taxRate;
  const totalAmount = subtotal + taxAmount;

  // Payment processing
  const processTransaction = async () => {
    if (cart.length === 0) {
      alert('Please add items to cart');
      return;
    }

    if (!activeSession) {
      alert('Please start a POS session first');
      return;
    }

    try {
      setLoading(true);

      // Prepare transaction data
      const transactionData = {
        customer: customer,
        line_items: cart.map(item => ({
          ...item,
          tax_rate: taxRate,
          tax_amount: item.total_price * taxRate,
          is_taxable: true,
          discount_amount: 0,
          barcode: undefined,
          category: undefined
        })),
        payments: [{
          payment_method: payment.payment_method,
          amount: totalAmount,
          cash_tendered: payment.cash_tendered,
          change_given: payment.change_given,
          currency: 'USD'
        }],
        transaction_type: 'sale',
        subtotal: subtotal,
        total_discount: 0,
        total_tax: taxAmount,
        total_amount: totalAmount,
        terminal_id: activeSession.terminal_id,
        session_id: activeSession.id,
        notes: 'POS Transaction'
      };

      // Process transaction
      const result = await paymentsApi.pos.createTransaction(transactionData as any);
      
      // Show receipt and clear cart
      alert(`Transaction completed successfully!\nTransaction #: ${result.transaction_number}\nTotal: $${totalAmount.toFixed(2)}\nChange: $${payment.change_given?.toFixed(2) || '0.00'}`);
      
      clearCart();
      setShowPaymentModal(false);
    } catch (error) {
      console.error('Error processing transaction:', error);
      alert('Transaction failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="pos-application">
      {/* Header */}
      <header className="pos-header">
        <div className="pos-title">
          <h1>Point of Sale</h1>
          {activeSession ? (
            <div className="session-info">
              <span className="session-active">● Session Active</span>
              <span>Terminal: {activeSession.terminal_id}</span>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={startNewSession}>
              Start Session
            </button>
          )}
        </div>
        <div className="pos-actions">
          <button className="btn btn-secondary" onClick={() => setShowCustomerModal(true)}>
            Customer
          </button>
          <button className="btn btn-outline" onClick={clearCart}>
            Clear Cart
          </button>
        </div>
      </header>

      <div className="pos-main">
        {/* Products Section */}
        <div className="pos-products">
          <div className="products-header">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="category-filter">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="category-select"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="products-grid">
            {loading ? (
              <div className="loading">Loading products...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="no-products">No products found</div>
            ) : (
              filteredProducts.map(product => (
                <div
                  key={product._id}
                  className="product-card"
                  onClick={() => addToCart(product)}
                >
                  <div className="product-name">{product.name}</div>
                  <div className="product-sku">{product.sku}</div>
                  <div className="product-price">${product.price.toFixed(2)}</div>
                  {product.stock !== undefined && (
                    <div className="product-stock">Stock: {product.stock}</div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Cart Section */}
        <div className="pos-cart">
          <div className="cart-header">
            <h3>Shopping Cart</h3>
            <span className="cart-count">{cart.length} items</span>
          </div>

          <div className="cart-items">
            {cart.length === 0 ? (
              <div className="empty-cart">Cart is empty</div>
            ) : (
              cart.map(item => (
                <div key={item.product_id} className="cart-item">
                  <div className="item-details">
                    <div className="item-name">{item.product_name}</div>
                    <div className="item-sku">{item.product_sku}</div>
                    <div className="item-price">${item.unit_price.toFixed(2)} each</div>
                  </div>
                  <div className="item-controls">
                    <div className="quantity-controls">
                      <button
                        className="qty-btn"
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                      >
                        -
                      </button>
                      <span className="quantity">{item.quantity}</span>
                      <button
                        className="qty-btn"
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <div className="item-total">${item.total_price.toFixed(2)}</div>
                    <button
                      className="remove-btn"
                      onClick={() => removeFromCart(item.product_id)}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Summary */}
          <div className="cart-summary">
            <div className="summary-line">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="summary-line">
              <span>Tax (8.75%):</span>
              <span>${taxAmount.toFixed(2)}</span>
            </div>
            <div className="summary-line total">
              <span>Total:</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
            
            <button
              className="btn btn-primary btn-large"
              onClick={() => setShowPaymentModal(true)}
              disabled={cart.length === 0 || !activeSession}
            >
              Process Payment
            </button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Process Payment</h3>
              <button className="modal-close" onClick={() => setShowPaymentModal(false)}>×</button>
            </div>
            <div className="modal-content">
              <div className="payment-summary">
                <div className="total-display">
                  Total: ${totalAmount.toFixed(2)}
                </div>
              </div>
              
              <div className="payment-methods">
                <div className="payment-method">
                  <label>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash"
                      checked={payment.payment_method === 'cash'}
                      onChange={(e) => setPayment({ ...payment, payment_method: e.target.value })}
                    />
                    Cash
                  </label>
                </div>
                <div className="payment-method">
                  <label>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="credit_card"
                      checked={payment.payment_method === 'credit_card'}
                      onChange={(e) => setPayment({ ...payment, payment_method: e.target.value })}
                    />
                    Credit Card
                  </label>
                </div>
                <div className="payment-method">
                  <label>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="debit_card"
                      checked={payment.payment_method === 'debit_card'}
                      onChange={(e) => setPayment({ ...payment, payment_method: e.target.value })}
                    />
                    Debit Card
                  </label>
                </div>
              </div>

              {payment.payment_method === 'cash' && (
                <div className="cash-payment">
                  <label>Cash Tendered:</label>
                  <input
                    type="number"
                    step="0.01"
                    min={totalAmount}
                    value={payment.cash_tendered || totalAmount}
                    onChange={(e) => {
                      const tendered = parseFloat(e.target.value) || totalAmount;
                      setPayment({
                        ...payment,
                        cash_tendered: tendered,
                        change_given: Math.max(0, tendered - totalAmount),
                        amount: totalAmount
                      });
                    }}
                    className="cash-input"
                  />
                  {(payment.cash_tendered || 0) > totalAmount && (
                    <div className="change-display">
                      Change: ${((payment.cash_tendered || 0) - totalAmount).toFixed(2)}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowPaymentModal(false)}>
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={processTransaction}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Complete Sale'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Modal */}
      {showCustomerModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Customer Information</h3>
              <button className="modal-close" onClick={() => setShowCustomerModal(false)}>×</button>
            </div>
            <div className="modal-content">
              <div className="customer-form">
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={customer.is_walk_in}
                      onChange={(e) => setCustomer({ ...customer, is_walk_in: e.target.checked })}
                    />
                    Walk-in Customer
                  </label>
                </div>
                
                {!customer.is_walk_in && (
                  <>
                    <div className="form-group">
                      <label>Name:</label>
                      <input
                        type="text"
                        value={customer.name || ''}
                        onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Email:</label>
                      <input
                        type="email"
                        value={customer.email || ''}
                        onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Phone:</label>
                      <input
                        type="tel"
                        value={customer.phone || ''}
                        onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                        className="form-input"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowCustomerModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={() => setShowCustomerModal(false)}>
                Save Customer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POSApplication;
