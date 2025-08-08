import React, { useState, useEffect } from 'react';
import { Payment, PaymentFilters, PaymentMethod, PaymentStatus } from '../../types/payment';
import { paymentsApi } from '../../services/paymentApi';
import './PaymentHistory.css';

const PaymentHistory: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<PaymentFilters>({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    loadPayments();
  }, [filters, pagination.page]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const response = await paymentsApi.getPayments({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });
      
      setPayments(response.items);
      setPagination(prev => ({
        ...prev,
        total: response.total,
        pages: response.pages
      }));
    } catch (error) {
      alert('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof PaymentFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({});
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString() + ' ' + 
           new Date(dateString).toLocaleTimeString();
  };

  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.COMPLETED:
        return '#52c41a';
      case PaymentStatus.PENDING:
        return '#faad14';
      case PaymentStatus.FAILED:
        return '#ff4d4f';
      case PaymentStatus.REFUNDED:
        return '#722ed1';
      default:
        return '#666';
    }
  };

  const getPaymentMethodDisplay = (method: PaymentMethod) => {
    return method.replace('_', ' ').toUpperCase();
  };

  return (
    <div className="payment-history">
      <h1>Payment History</h1>
      
      {/* Filters */}
      <div className="filters-section">
        <div className="filters-row">
          <div className="filter-group">
            <label>Payment Method:</label>
            <select
              value={filters.payment_method || ''}
              onChange={(e) => handleFilterChange('payment_method', e.target.value || undefined)}
            >
              <option value="">All Methods</option>
              <option value={PaymentMethod.CASH}>Cash</option>
              <option value={PaymentMethod.CREDIT_CARD}>Credit Card</option>
              <option value={PaymentMethod.DEBIT_CARD}>Debit Card</option>
              <option value={PaymentMethod.PAYPAL}>PayPal</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Status:</label>
            <select
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
            >
              <option value="">All Statuses</option>
              <option value={PaymentStatus.COMPLETED}>Completed</option>
              <option value={PaymentStatus.PENDING}>Pending</option>
              <option value={PaymentStatus.FAILED}>Failed</option>
              <option value={PaymentStatus.REFUNDED}>Refunded</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Start Date:</label>
            <input
              type="date"
              value={filters.start_date || ''}
              onChange={(e) => handleFilterChange('start_date', e.target.value || undefined)}
            />
          </div>

          <div className="filter-group">
            <label>End Date:</label>
            <input
              type="date"
              value={filters.end_date || ''}
              onChange={(e) => handleFilterChange('end_date', e.target.value || undefined)}
            />
          </div>

          <div className="filter-group">
            <label>Search:</label>
            <input
              type="text"
              placeholder="Payment number, customer..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value || undefined)}
            />
          </div>

          <div className="filter-actions">
            <button className="btn btn-secondary" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Payment Table */}
      <div className="payments-table-container">
        {loading ? (
          <div className="loading">Loading payments...</div>
        ) : (
          <table className="payments-table">
            <thead>
              <tr>
                <th>Payment #</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Order #</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(payment => (
                <tr key={payment.id}>
                  <td>
                    <div className="payment-number">
                      {payment.payment_number}
                    </div>
                    {payment.reference_number && (
                      <div className="reference-number">
                        Ref: {payment.reference_number}
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="payment-date">
                      {formatDate(payment.payment_date)}
                    </div>
                    {payment.processed_at && (
                      <div className="processed-date">
                        Processed: {formatDate(payment.processed_at)}
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="customer-info">
                      {payment.customer_name || 'Walk-in'}
                      {payment.customer_email && (
                        <div className="customer-email">
                          {payment.customer_email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="payment-method">
                      {getPaymentMethodDisplay(payment.payment_method)}
                    </div>
                    {payment.card_details?.last_four_digits && (
                      <div className="card-info">
                        **** {payment.card_details.last_four_digits}
                      </div>
                    )}
                    {payment.cash_details && (
                      <div className="cash-info">
                        Change: ${payment.cash_details.change_given.toFixed(2)}
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="payment-amount">
                      ${payment.amount.toFixed(2)}
                    </div>
                    {payment.currency !== 'USD' && (
                      <div className="currency">
                        {payment.currency}
                      </div>
                    )}
                  </td>
                  <td>
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(payment.status) }}
                    >
                      {payment.status.toUpperCase()}
                    </span>
                    {payment.refunded_amount > 0 && (
                      <div className="refund-info">
                        Refunded: ${payment.refunded_amount.toFixed(2)}
                      </div>
                    )}
                  </td>
                  <td>
                    {payment.order_number ? (
                      <div className="order-link">
                        {payment.order_number}
                      </div>
                    ) : (
                      <span className="no-order">-</span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn btn-small btn-outline"
                        onClick={() => {/* View payment details */}}
                      >
                        View
                      </button>
                      {payment.status === PaymentStatus.COMPLETED && payment.refunded_amount < payment.amount && (
                        <button 
                          className="btn btn-small btn-warning"
                          onClick={() => {/* Create refund */}}
                        >
                          Refund
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {payments.length === 0 && !loading && (
          <div className="no-payments">
            No payments found matching your criteria.
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="pagination">
          <button 
            className="btn btn-outline"
            disabled={pagination.page === 1}
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
          >
            Previous
          </button>
          
          <span className="pagination-info">
            Page {pagination.page} of {pagination.pages} 
            ({pagination.total} total payments)
          </span>
          
          <button 
            className="btn btn-outline"
            disabled={pagination.page === pagination.pages}
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;
