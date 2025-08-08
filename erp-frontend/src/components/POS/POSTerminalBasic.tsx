import React, { useState, useEffect } from 'react';
import { Product } from '../../types/sales';
import { PaymentMethod, POSLineItem, PaymentCreate, POSTransaction } from '../../types/payment';
import { productsApi } from '../../services/salesApi';
import { paymentsApi } from '../../services/paymentApi';
import './POSTerminal.css';

interface CartItem extends POSLineItem {
  product?: Product;
  line_total: number;
}

interface PaymentItem extends PaymentCreate {
  id: string;
}

const POSTerminal: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  // Transaction totals
  const [subtotal, setSubtotal] = useState(0);
  const [taxRate, setTaxRate] = useState(0.08);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  
  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [cashTendered, setCashTendered] = useState(0);
  const [cardholderName, setCardholderName] = useState('');
  const [cardLastFour, setCardLastFour] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    calculateTotals();
  }, [cart, discountAmount, taxRate]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await productsApi.getProducts({ limit: 100 });
      setProducts(response.items);
    } catch (error) {
      alert('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    const existingIndex = cart.findIndex(item => item.product_id === product._id);
    
    if (existingIndex >= 0) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      newCart[existingIndex].line_total = newCart[existingIndex].quantity * (newCart[existingIndex].unit_price || product.price);
      setCart(newCart);
    } else {
      const newItem: CartItem = {
        product_id: product._id,
        product: product,
        quantity: 1,
        unit_price: product.price,
        line_total: product.price
      };
      setCart([...cart, newItem]);
    }
  };

  const updateCartItemQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(index);
      return;
    }
    
    const newCart = [...cart];
    newCart[index].quantity = quantity;
    newCart[index].line_total = quantity * (newCart[index].unit_price || 0);
    setCart(newCart);
  };

  const removeFromCart = (index: number) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
  };

  const calculateTotals = () => {
    const newSubtotal = cart.reduce((sum, item) => sum + item.line_total, 0);
    const discountedSubtotal = newSubtotal - discountAmount;
    const newTaxAmount = discountedSubtotal * taxRate;
    const newTotal = discountedSubtotal + newTaxAmount;
    
    setSubtotal(newSubtotal);
    setTaxAmount(newTaxAmount);
    setTotalAmount(newTotal);
  };

  const openPaymentModal = () => {
    if (cart.length === 0) {
      alert('Please add items to cart first');
      return;
    }
    
    const remainingAmount = totalAmount - payments.reduce((sum, p) => sum + p.amount, 0);
    setPaymentAmount(remainingAmount);
    setCashTendered(remainingAmount);
    setShowPaymentModal(true);
  };

  const addPayment = () => {
    if (paymentAmount <= 0) {
      alert('Payment amount must be greater than 0');
      return;
    }

    const newPayment: PaymentItem = {
      id: `temp_${Date.now()}`,
      payment_method: paymentMethod,
      amount: paymentAmount,
      currency: 'USD'
    };

    if (paymentMethod === PaymentMethod.CASH) {
      const changeGiven = Math.max(0, cashTendered - paymentAmount);
      newPayment.cash_details = {
        amount_tendered: cashTendered,
        change_given: changeGiven,
        currency: 'USD'
      };
    } else if (paymentMethod === PaymentMethod.CREDIT_CARD || paymentMethod === PaymentMethod.DEBIT_CARD) {
      newPayment.card_details = {
        cardholder_name: cardholderName,
        last_four_digits: cardLastFour
      };
    }

    setPayments([...payments, newPayment]);
    setShowPaymentModal(false);
    
    // Reset form
    setPaymentAmount(0);
    setCashTendered(0);
    setCardholderName('');
    setCardLastFour('');
  };

  const removePayment = (id: string) => {
    setPayments(payments.filter(p => p.id !== id));
  };

  const processTransaction = async () => {
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }

    if (payments.length === 0) {
      alert('No payments added');
      return;
    }

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    if (totalPaid < totalAmount) {
      alert('Insufficient payment amount');
      return;
    }

    try {
      setProcessing(true);

      const transactionData = {
        customer_id: 'walk-in',
        line_items: cart.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price
        })),
        payments: payments.map(p => ({
          payment_method: p.payment_method,
          amount: p.amount,
          currency: p.currency,
          cash_details: p.cash_details,
          card_details: p.card_details,
          terminal_id: 'POS_001',
          cashier_id: 'current_user'
        })),
        subtotal,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        terminal_id: 'POS_001',
        cashier_id: 'current_user'
      };

      const result = await paymentsApi.createPOSTransaction(transactionData);
      
      alert(`Transaction completed successfully!\nTransaction #: ${result.transaction_number}\nChange Due: $${result.change_due.toFixed(2)}`);
      
      clearTransaction();
      
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Transaction failed');
    } finally {
      setProcessing(false);
    }
  };

  const clearTransaction = () => {
    setCart([]);
    setPayments([]);
    setDiscountAmount(0);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const remainingAmount = totalAmount - payments.reduce((sum, p) => sum + p.amount, 0);
  const isTransactionComplete = remainingAmount <= 0 && cart.length > 0;

  return (
    <div className="pos-terminal">
      <h1>POS Terminal</h1>
      
      <div className="pos-layout">
        {/* Product Selection */}
        <div className="products-section">
          <div className="section-card">
            <h3>Products</h3>
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            
            <div className="products-grid">
              {filteredProducts.map(product => (
                <div
                  key={product._id}
                  className="product-card"
                  onClick={() => addToCart(product)}
                >
                  <div className="product-name">{product.name}</div>
                  <div className="product-sku">{product.sku}</div>
                  <div className="product-price">${product.price.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cart and Checkout */}
        <div className="checkout-section">
          <div className="section-card">
            <h3>Current Sale</h3>
            
            {/* Cart Items */}
            <div className="cart-items">
              {cart.map((item, index) => (
                <div key={`${item.product_id}_${index}`} className="cart-item">
                  <div className="item-details">
                    <div className="item-name">{item.product?.name}</div>
                    <div className="item-sku">{item.product?.sku}</div>
                  </div>
                  <div className="item-quantity">
                    <input
                      type="number"
                      value={item.quantity}
                      min={1}
                      onChange={(e) => updateCartItemQuantity(index, parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="item-price">${item.unit_price?.toFixed(2)}</div>
                  <div className="item-total">${item.line_total.toFixed(2)}</div>
                  <button
                    className="remove-btn"
                    onClick={() => removeFromCart(index)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            
            {/* Totals */}
            <div className="totals-section">
              <div className="total-line">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="total-line">
                <span>Discount:</span>
                <input
                  type="number"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                  className="discount-input"
                />
              </div>
              <div className="total-line">
                <span>Tax ({(taxRate * 100).toFixed(1)}%):</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>
              <div className="total-line total-final">
                <span>Total:</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Payments */}
            <div className="payments-section">
              <h4>Payments:</h4>
              {payments.map(payment => (
                <div key={payment.id} className="payment-item">
                  <span>
                    {payment.payment_method.replace('_', ' ').toUpperCase()}: ${payment.amount.toFixed(2)}
                  </span>
                  <button
                    className="remove-payment-btn"
                    onClick={() => removePayment(payment.id)}
                  >
                    Remove
                  </button>
                </div>
              ))}
              
              {remainingAmount > 0 && (
                <div className="remaining-amount">
                  Remaining: ${remainingAmount.toFixed(2)}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              <button
                className="btn btn-secondary"
                onClick={openPaymentModal}
                disabled={cart.length === 0}
              >
                Add Payment
              </button>
              
              <button
                className="btn btn-primary"
                onClick={processTransaction}
                disabled={!isTransactionComplete}
              >
                {processing ? 'Processing...' : 'Complete Transaction'}
              </button>
              
              <button className="btn btn-outline" onClick={clearTransaction}>
                Clear All
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Add Payment</h3>
            
            <div className="form-group">
              <label>Payment Method:</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              >
                <option value={PaymentMethod.CASH}>Cash</option>
                <option value={PaymentMethod.CREDIT_CARD}>Credit Card</option>
                <option value={PaymentMethod.DEBIT_CARD}>Debit Card</option>
              </select>
            </div>

            <div className="form-group">
              <label>Payment Amount:</label>
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                step={0.01}
              />
            </div>

            {paymentMethod === PaymentMethod.CASH && (
              <div className="form-group">
                <label>Cash Tendered:</label>
                <input
                  type="number"
                  value={cashTendered}
                  onChange={(e) => setCashTendered(parseFloat(e.target.value) || 0)}
                  step={0.01}
                />
                {cashTendered > paymentAmount && (
                  <div className="change-amount">
                    Change: ${(cashTendered - paymentAmount).toFixed(2)}
                  </div>
                )}
              </div>
            )}

            {(paymentMethod === PaymentMethod.CREDIT_CARD || paymentMethod === PaymentMethod.DEBIT_CARD) && (
              <>
                <div className="form-group">
                  <label>Cardholder Name:</label>
                  <input
                    type="text"
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                    placeholder="Enter cardholder name"
                  />
                </div>
                <div className="form-group">
                  <label>Last 4 Digits:</label>
                  <input
                    type="text"
                    value={cardLastFour}
                    onChange={(e) => setCardLastFour(e.target.value)}
                    placeholder="1234"
                    maxLength={4}
                  />
                </div>
              </>
            )}

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowPaymentModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={addPayment}>
                Add Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POSTerminal;
