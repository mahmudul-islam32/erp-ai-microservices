import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Table, Input, Select, Space, message, Modal, Typography, Divider } from 'antd';
import { PlusOutlined, DeleteOutlined, CreditCardOutlined, DollarOutlined, PrinterOutlined } from '@ant-design/icons';
import { Product } from '../../types/sales';
import { PaymentMethod, POSLineItem, PaymentCreate, CashPaymentDetails, CardPaymentDetails, POSTransaction } from '../../types/payment';
import { productsApi } from '../../services/salesApi';
import { paymentsApi } from '../../services/paymentApi';

const { Option } = Select;
const { Title, Text } = Typography;

interface CartItem extends POSLineItem {
  product?: Product;
  line_total: number;
}

interface PaymentItem extends PaymentCreate {
  id: string; // temporary ID for UI
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
  const [taxRate, setTaxRate] = useState(0.08); // 8% default tax
  const [discountAmount, setDiscountAmount] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  
  // Payment modal state
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [cashTendered, setCashTendered] = useState(0);
  const [cardholderName, setCardholderName] = useState('');
  const [cardLastFour, setCardLastFour] = useState('');
  
  // Load products on component mount
  useEffect(() => {
    loadProducts();
  }, []);

  // Recalculate totals when cart changes
  useEffect(() => {
    calculateTotals();
  }, [cart, discountAmount, taxRate]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await productsApi.getProducts({ limit: 100 });
      setProducts(response.items);
    } catch (error) {
      message.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const searchProducts = async (term: string) => {
    if (!term.trim()) {
      loadProducts();
      return;
    }
    
    try {
      const searchResults = await productsApi.searchProducts(term);
      setProducts(searchResults);
    } catch (error) {
      message.error('Failed to search products');
    }
  };

  const addToCart = (product: Product) => {
    const existingIndex = cart.findIndex(item => item.product_id === product._id);
    
    if (existingIndex >= 0) {
      // Increase quantity if product already in cart
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      newCart[existingIndex].line_total = newCart[existingIndex].quantity * (newCart[existingIndex].unit_price || product.price);
      setCart(newCart);
    } else {
      // Add new item to cart
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

  const updateCartItemPrice = (index: number, price: number) => {
    const newCart = [...cart];
    newCart[index].unit_price = price;
    newCart[index].line_total = newCart[index].quantity * price;
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
      message.warning('Please add items to cart first');
      return;
    }
    
    const remainingAmount = totalAmount - payments.reduce((sum, p) => sum + p.amount, 0);
    setPaymentAmount(remainingAmount);
    setCashTendered(remainingAmount);
    setPaymentModalVisible(true);
  };

  const addPayment = () => {
    if (paymentAmount <= 0) {
      message.error('Payment amount must be greater than 0');
      return;
    }

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    if (totalPaid + paymentAmount > totalAmount) {
      message.error('Payment amount exceeds total amount');
      return;
    }

    const newPayment: PaymentItem = {
      id: `temp_${Date.now()}`,
      payment_method: paymentMethod,
      amount: paymentAmount,
      currency: 'USD'
    };

    // Add method-specific details
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
    setPaymentModalVisible(false);
    
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
      message.error('Cart is empty');
      return;
    }

    if (payments.length === 0) {
      message.error('No payments added');
      return;
    }

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    if (totalPaid < totalAmount) {
      message.error('Insufficient payment amount');
      return;
    }

    try {
      setProcessing(true);

      // Prepare transaction data
      const transactionData = {
        customer_id: 'walk-in', // Default for POS
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
      
      message.success('Transaction completed successfully!');
      
      // Show receipt modal or print receipt
      showReceiptModal(result);
      
      // Clear cart and payments
      clearTransaction();
      
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Transaction failed');
    } finally {
      setProcessing(false);
    }
  };

  const showReceiptModal = (transaction: POSTransaction) => {
    const change = transaction.change_due;
    
    Modal.info({
      title: 'Transaction Complete',
      width: 600,
      content: (
        <div>
          <p><strong>Transaction #:</strong> {transaction.transaction_number}</p>
          <p><strong>Order #:</strong> {transaction.order_id}</p>
          <p><strong>Total:</strong> ${transaction.total_amount.toFixed(2)}</p>
          <p><strong>Amount Paid:</strong> ${transaction.payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}</p>
          {change > 0 && <p><strong>Change Due:</strong> ${change.toFixed(2)}</p>}
          <p><strong>Date:</strong> {new Date(transaction.transaction_date).toLocaleString()}</p>
        </div>
      ),
      onOk: () => {
        // Could implement print receipt functionality here
      }
    });
  };

  const clearTransaction = () => {
    setCart([]);
    setPayments([]);
    setDiscountAmount(0);
    setSubtotal(0);
    setTaxAmount(0);
    setTotalAmount(0);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const remainingAmount = totalAmount - payments.reduce((sum, p) => sum + p.amount, 0);
  const isTransactionComplete = remainingAmount <= 0 && cart.length > 0;

  return (
    <div style={{ padding: '20px' }}>
      <Title level={2}>POS Terminal</Title>
      
      <Row gutter={16}>
        {/* Product Selection */}
        <Col span={12}>
          <Card title="Products" style={{ height: '600px', overflowY: 'auto' }}>
            <Input.Search
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                searchProducts(e.target.value);
              }}
              style={{ marginBottom: 16 }}
            />
            
            <Row gutter={[8, 8]}>
              {filteredProducts.map(product => (
                <Col span={12} key={product._id}>
                  <Card
                    size="small"
                    hoverable
                    onClick={() => addToCart(product)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div style={{ textAlign: 'center' }}>
                      <Text strong>{product.name}</Text>
                      <br />
                      <Text type="secondary">{product.sku}</Text>
                      <br />
                      <Text>${product.price.toFixed(2)}</Text>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>

        {/* Cart and Checkout */}
        <Col span={12}>
          <Card title="Current Sale" style={{ marginBottom: 16 }}>
            <Table
              dataSource={cart}
              pagination={false}
              size="small"
              rowKey={(item, index) => `${item.product_id}_${index}`}
              scroll={{ y: 200 }}
              columns={[
                {
                  title: 'Product',
                  dataIndex: 'product',
                  render: (product: Product) => (
                    <div>
                      <div>{product?.name || 'Unknown Product'}</div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {product?.sku}
                      </Text>
                    </div>
                  )
                },
                {
                  title: 'Qty',
                  width: 80,
                  render: (_, item, index) => (
                    <Input
                      type="number"
                      size="small"
                      value={item.quantity}
                      min={1}
                      onChange={(e) => updateCartItemQuantity(index, parseInt(e.target.value) || 1)}
                    />
                  )
                },
                {
                  title: 'Price',
                  width: 100,
                  render: (_, item, index) => (
                    <Input
                      type="number"
                      size="small"
                      value={item.unit_price}
                      step={0.01}
                      onChange={(e) => updateCartItemPrice(index, parseFloat(e.target.value) || 0)}
                      addonBefore="$"
                    />
                  )
                },
                {
                  title: 'Total',
                  width: 80,
                  render: (_, item) => `$${item.line_total.toFixed(2)}`
                },
                {
                  title: '',
                  width: 50,
                  render: (_, item, index) => (
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeFromCart(index)}
                    />
                  )
                }
              ]}
            />
            
            <Divider />
            
            {/* Totals */}
            <Row justify="space-between" style={{ marginBottom: 8 }}>
              <Text>Subtotal:</Text>
              <Text>${subtotal.toFixed(2)}</Text>
            </Row>
            
            <Row justify="space-between" style={{ marginBottom: 8 }}>
              <Text>Discount:</Text>
              <Input
                size="small"
                type="number"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                style={{ width: 100, textAlign: 'right' }}
                addonBefore="$"
              />
            </Row>
            
            <Row justify="space-between" style={{ marginBottom: 8 }}>
              <Text>Tax ({(taxRate * 100).toFixed(1)}%):</Text>
              <Text>${taxAmount.toFixed(2)}</Text>
            </Row>
            
            <Row justify="space-between" style={{ marginBottom: 16 }}>
              <Text strong style={{ fontSize: '16px' }}>Total:</Text>
              <Text strong style={{ fontSize: '16px' }}>${totalAmount.toFixed(2)}</Text>
            </Row>

            {/* Payments */}
            <div style={{ marginBottom: 16 }}>
              <Text strong>Payments:</Text>
              {payments.map(payment => (
                <Row key={payment.id} justify="space-between" style={{ marginTop: 4 }}>
                  <Text>
                    {payment.payment_method.replace('_', ' ').toUpperCase()}: ${payment.amount.toFixed(2)}
                  </Text>
                  <Button
                    type="text"
                    danger
                    size="small"
                    onClick={() => removePayment(payment.id)}
                  >
                    Remove
                  </Button>
                </Row>
              ))}
              
              {remainingAmount > 0 && (
                <Text type="secondary">
                  Remaining: ${remainingAmount.toFixed(2)}
                </Text>
              )}
            </div>

            {/* Action Buttons */}
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={openPaymentModal}
                disabled={cart.length === 0}
                block
              >
                Add Payment
              </Button>
              
              <Button
                type="primary"
                size="large"
                onClick={processTransaction}
                disabled={!isTransactionComplete}
                loading={processing}
                block
              >
                Complete Transaction
              </Button>
              
              <Button onClick={clearTransaction} block>
                Clear All
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Payment Modal */}
      <Modal
        title="Add Payment"
        open={paymentModalVisible}
        onOk={addPayment}
        onCancel={() => setPaymentModalVisible(false)}
        width={500}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text>Payment Method:</Text>
            <Select
              value={paymentMethod}
              onChange={setPaymentMethod}
              style={{ width: '100%', marginTop: 8 }}
            >
              <Option value={PaymentMethod.CASH}>
                <DollarOutlined /> Cash
              </Option>
              <Option value={PaymentMethod.CREDIT_CARD}>
                <CreditCardOutlined /> Credit Card
              </Option>
              <Option value={PaymentMethod.DEBIT_CARD}>
                <CreditCardOutlined /> Debit Card
              </Option>
            </Select>
          </div>

          <div>
            <Text>Payment Amount:</Text>
            <Input
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
              addonBefore="$"
              style={{ marginTop: 8 }}
            />
          </div>

          {paymentMethod === PaymentMethod.CASH && (
            <div>
              <Text>Cash Tendered:</Text>
              <Input
                type="number"
                value={cashTendered}
                onChange={(e) => setCashTendered(parseFloat(e.target.value) || 0)}
                addonBefore="$"
                style={{ marginTop: 8 }}
              />
              {cashTendered > paymentAmount && (
                <Text type="secondary">
                  Change: ${(cashTendered - paymentAmount).toFixed(2)}
                </Text>
              )}
            </div>
          )}

          {(paymentMethod === PaymentMethod.CREDIT_CARD || paymentMethod === PaymentMethod.DEBIT_CARD) && (
            <>
              <div>
                <Text>Cardholder Name:</Text>
                <Input
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  placeholder="Enter cardholder name"
                  style={{ marginTop: 8 }}
                />
              </div>
              <div>
                <Text>Last 4 Digits:</Text>
                <Input
                  value={cardLastFour}
                  onChange={(e) => setCardLastFour(e.target.value)}
                  placeholder="1234"
                  maxLength={4}
                  style={{ marginTop: 8 }}
                />
              </div>
            </>
          )}
        </Space>
      </Modal>
    </div>
  );
};

export default POSTerminal;
