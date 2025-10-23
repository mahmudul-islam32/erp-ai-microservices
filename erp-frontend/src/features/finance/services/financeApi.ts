import axios from 'axios';
import {
  Account,
  AccountCreate,
  JournalEntry,
  JournalEntryCreate,
  CustomerInvoice,
  VendorInvoice,
  BankAccount,
  BankTransaction,
  Currency,
  CurrencyRate,
  ProfitLossReport,
  BalanceSheetReport,
  AgingReport,
  AccountType,
  JournalEntryStatus,
  InvoiceStatus,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_FINANCE_SERVICE_URL || 'http://localhost:8006/api/v1';

// Create axios instance with auth token
const financeApi = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
financeApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token'); // Changed from 'token' to 'access_token'
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Chart of Accounts API
export const accountsApi = {
  getAll: (params?: { account_type?: AccountType; is_active?: boolean; skip?: number; limit?: number }) =>
    financeApi.get<Account[]>('/accounts', { params }),
  
  getById: (id: string) =>
    financeApi.get<Account>(`/accounts/${id}`),
  
  getByCode: (code: string) =>
    financeApi.get<Account>(`/accounts/code/${id}`),
  
  getHierarchy: () =>
    financeApi.get<any[]>('/accounts/hierarchy'),
  
  create: (data: AccountCreate) =>
    financeApi.post<Account>('/accounts', data),
  
  update: (id: string, data: Partial<AccountCreate>) =>
    financeApi.put<Account>(`/accounts/${id}`, data),
  
  delete: (id: string) =>
    financeApi.delete(`/accounts/${id}`),
  
  seedDefaults: () =>
    financeApi.post('/accounts/seed-defaults'),
};

// Journal Entries API
export const journalEntriesApi = {
  getAll: (params?: { 
    status?: JournalEntryStatus; 
    start_date?: string; 
    end_date?: string; 
    skip?: number; 
    limit?: number;
  }) =>
    financeApi.get<JournalEntry[]>('/journal-entries', { params }),
  
  getById: (id: string) =>
    financeApi.get<JournalEntry>(`/journal-entries/${id}`),
  
  create: (data: JournalEntryCreate) =>
    financeApi.post<JournalEntry>('/journal-entries', data),
  
  post: (id: string) =>
    financeApi.post<JournalEntry>(`/journal-entries/${id}/post`),
  
  reverse: (id: string, reason: string) =>
    financeApi.post<JournalEntry>(`/journal-entries/${id}/reverse`, null, {
      params: { reason },
    }),
  
  getGeneralLedger: (params?: { 
    account_id?: string; 
    start_date?: string; 
    end_date?: string;
  }) =>
    financeApi.get<any[]>('/journal-entries/ledger/general', { params }),
};

// Customer Invoices API (AR)
export const customerInvoicesApi = {
  getAll: (params?: { 
    customer_id?: string; 
    status?: InvoiceStatus; 
    skip?: number; 
    limit?: number;
  }) =>
    financeApi.get<CustomerInvoice[]>('/invoices/customer', { params }),
  
  getById: (id: string) =>
    financeApi.get<CustomerInvoice>(`/invoices/customer/${id}`),
  
  create: (data: any) =>
    financeApi.post<CustomerInvoice>('/invoices/customer', data),
  
  send: (id: string) =>
    financeApi.post<CustomerInvoice>(`/invoices/customer/${id}/send`),
  
  recordPayment: (id: string, data: {
    payment_amount: number;
    payment_date: string;
    payment_method: string;
  }) =>
    financeApi.post<CustomerInvoice>(`/invoices/customer/${id}/payment`, data),
  
  getAgingReport: () =>
    financeApi.get<AgingReport>('/invoices/aging/customer'),
};

// Vendor Invoices API (AP)
export const vendorInvoicesApi = {
  getAll: (params?: { 
    vendor_id?: string; 
    status?: InvoiceStatus; 
    skip?: number; 
    limit?: number;
  }) =>
    financeApi.get<VendorInvoice[]>('/invoices/vendor', { params }),
  
  getById: (id: string) =>
    financeApi.get<VendorInvoice>(`/invoices/vendor/${id}`),
  
  create: (data: any) =>
    financeApi.post<VendorInvoice>('/invoices/vendor', data),
  
  pay: (id: string, data: {
    payment_amount: number;
    payment_date: string;
    payment_method: string;
    bank_account_id?: string;
  }) =>
    financeApi.post<VendorInvoice>(`/invoices/vendor/${id}/pay`, null, {
      params: data,
    }),
  
  getAgingReport: () =>
    financeApi.get<AgingReport>('/invoices/aging/vendor'),
};

// Financial Reports API
export const reportsApi = {
  getProfitLoss: (params: { period_start: string; period_end: string }) =>
    financeApi.get<ProfitLossReport>('/reports/profit-loss', { params }),
  
  getBalanceSheet: (params: { as_of_date: string }) =>
    financeApi.get<BalanceSheetReport>('/reports/balance-sheet', { params }),
  
  getTrialBalance: (params: { as_of_date: string }) =>
    financeApi.get<any>('/reports/trial-balance', { params }),
};

// Bank Management API
export const banksApi = {
  getAccounts: (params?: { is_active?: boolean }) =>
    financeApi.get<BankAccount[]>('/banks/accounts', { params }),
  
  getAccountById: (id: string) =>
    financeApi.get<BankAccount>(`/banks/accounts/${id}`),
  
  createAccount: (data: any) =>
    financeApi.post<BankAccount>('/banks/accounts', data),
  
  getTransactions: (params?: { bank_account_id?: string; skip?: number; limit?: number }) =>
    financeApi.get<BankTransaction[]>('/banks/transactions', { params }),
  
  createTransaction: (data: any) =>
    financeApi.post<BankTransaction>('/banks/transactions', data),
};

// Currency API
export const currenciesApi = {
  getAll: (params?: { is_active?: boolean }) =>
    financeApi.get<Currency[]>('/currencies', { params }),
  
  create: (data: { code: string; name: string; symbol: string; is_active?: boolean }) =>
    financeApi.post<Currency>('/currencies', data),
  
  createRate: (data: {
    base_currency: string;
    target_currency: string;
    exchange_rate: number;
    rate_date: string;
  }) =>
    financeApi.post<CurrencyRate>('/currencies/rates', data),
  
  convert: (params: {
    amount: number;
    from_currency: string;
    to_currency: string;
    conversion_date?: string;
  }) =>
    financeApi.get<any>('/currencies/convert', { params }),
  
  seedDefaults: () =>
    financeApi.post('/currencies/seed-defaults'),
};

export default financeApi;

