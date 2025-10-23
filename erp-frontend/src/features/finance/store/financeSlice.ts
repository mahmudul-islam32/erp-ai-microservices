import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  Account,
  JournalEntry,
  CustomerInvoice,
  VendorInvoice,
  BankAccount,
  Currency,
} from '../types';
import {
  accountsApi,
  journalEntriesApi,
  customerInvoicesApi,
  vendorInvoicesApi,
  banksApi,
  currenciesApi,
} from '../services/financeApi';

interface FinanceState {
  accounts: Account[];
  journalEntries: JournalEntry[];
  customerInvoices: CustomerInvoice[];
  vendorInvoices: VendorInvoice[];
  bankAccounts: BankAccount[];
  currencies: Currency[];
  loading: boolean;
  error: string | null;
}

const initialState: FinanceState = {
  accounts: [],
  journalEntries: [],
  customerInvoices: [],
  vendorInvoices: [],
  bankAccounts: [],
  currencies: [],
  loading: false,
  error: null,
};

// Async Thunks
export const fetchAccounts = createAsyncThunk(
  'finance/fetchAccounts',
  async () => {
    const response = await accountsApi.getAll();
    return response.data;
  }
);

export const fetchJournalEntries = createAsyncThunk(
  'finance/fetchJournalEntries',
  async () => {
    const response = await journalEntriesApi.getAll();
    return response.data;
  }
);

export const fetchCustomerInvoices = createAsyncThunk(
  'finance/fetchCustomerInvoices',
  async () => {
    const response = await customerInvoicesApi.getAll();
    return response.data;
  }
);

export const fetchVendorInvoices = createAsyncThunk(
  'finance/fetchVendorInvoices',
  async () => {
    const response = await vendorInvoicesApi.getAll();
    return response.data;
  }
);

export const fetchBankAccounts = createAsyncThunk(
  'finance/fetchBankAccounts',
  async () => {
    const response = await banksApi.getAccounts();
    return response.data;
  }
);

export const fetchCurrencies = createAsyncThunk(
  'finance/fetchCurrencies',
  async () => {
    const response = await currenciesApi.getAll();
    return response.data;
  }
);

const financeSlice = createSlice({
  name: 'finance',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Accounts
    builder
      .addCase(fetchAccounts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAccounts.fulfilled, (state, action: PayloadAction<Account[]>) => {
        state.loading = false;
        state.accounts = action.payload;
      })
      .addCase(fetchAccounts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch accounts';
      });

    // Fetch Journal Entries
    builder
      .addCase(fetchJournalEntries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchJournalEntries.fulfilled, (state, action: PayloadAction<JournalEntry[]>) => {
        state.loading = false;
        state.journalEntries = action.payload;
      })
      .addCase(fetchJournalEntries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch journal entries';
      });

    // Fetch Customer Invoices
    builder
      .addCase(fetchCustomerInvoices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomerInvoices.fulfilled, (state, action: PayloadAction<CustomerInvoice[]>) => {
        state.loading = false;
        state.customerInvoices = action.payload;
      })
      .addCase(fetchCustomerInvoices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch customer invoices';
      });

    // Fetch Vendor Invoices
    builder
      .addCase(fetchVendorInvoices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVendorInvoices.fulfilled, (state, action: PayloadAction<VendorInvoice[]>) => {
        state.loading = false;
        state.vendorInvoices = action.payload;
      })
      .addCase(fetchVendorInvoices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch vendor invoices';
      });

    // Fetch Bank Accounts
    builder
      .addCase(fetchBankAccounts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBankAccounts.fulfilled, (state, action: PayloadAction<BankAccount[]>) => {
        state.loading = false;
        state.bankAccounts = action.payload;
      })
      .addCase(fetchBankAccounts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch bank accounts';
      });

    // Fetch Currencies
    builder
      .addCase(fetchCurrencies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrencies.fulfilled, (state, action: PayloadAction<Currency[]>) => {
        state.loading = false;
        state.currencies = action.payload;
      })
      .addCase(fetchCurrencies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch currencies';
      });
  },
});

export const { clearError } = financeSlice.actions;
export default financeSlice.reducer;

