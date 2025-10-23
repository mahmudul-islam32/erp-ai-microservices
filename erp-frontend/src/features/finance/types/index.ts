// Account Types
export enum AccountType {
  ASSET = 'asset',
  LIABILITY = 'liability',
  EQUITY = 'equity',
  REVENUE = 'revenue',
  EXPENSE = 'expense',
}

export enum NormalBalance {
  DEBIT = 'debit',
  CREDIT = 'credit',
}

export interface Account {
  _id: string;
  account_code: string;
  account_name: string;
  account_type: AccountType;
  parent_account?: string;
  normal_balance: NormalBalance;
  description?: string;
  is_active: boolean;
  cost_center?: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface AccountCreate {
  account_code: string;
  account_name: string;
  account_type: AccountType;
  parent_account?: string;
  normal_balance: NormalBalance;
  description?: string;
  is_active?: boolean;
  cost_center?: string;
}

// Journal Entry Types
export enum JournalEntryStatus {
  DRAFT = 'draft',
  POSTED = 'posted',
  REVERSED = 'reversed',
}

export interface JournalLineItem {
  account_id: string;
  account_code: string;
  account_name: string;
  debit_amount: number;
  credit_amount: number;
  description?: string;
  cost_center?: string;
}

export interface JournalEntry {
  _id: string;
  entry_number: string;
  entry_date: string;
  reference?: string;
  description: string;
  total_debit: number;
  total_credit: number;
  status: JournalEntryStatus;
  line_items: JournalLineItem[];
  created_by: string;
  created_at: string;
  updated_at: string;
  posted_at?: string;
  posted_by?: string;
  reversed_entry_id?: string;
}

export interface JournalEntryCreate {
  entry_date: string;
  reference?: string;
  description: string;
  line_items: JournalLineItem[];
}

// Invoice Types
export enum InvoiceStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  SENT = 'sent',
  PARTIAL = 'partial',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  account_id: string;
  account_code: string;
  cost_center?: string;
  tax_amount: number;
}

export interface CustomerInvoice {
  _id: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  invoice_date: string;
  due_date: string;
  sales_order_id?: string;
  line_items: InvoiceLineItem[];
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  status: InvoiceStatus;
  payment_history: PaymentRecord[];
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  sent_at?: string;
}

export interface VendorInvoice {
  _id: string;
  invoice_number: string;
  vendor_id: string;
  vendor_name: string;
  invoice_date: string;
  due_date: string;
  line_items: InvoiceLineItem[];
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  status: InvoiceStatus;
  payment_history: PaymentRecord[];
  notes?: string;
  attachments: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentRecord {
  payment_date: string;
  amount: number;
  payment_method: string;
  recorded_by?: string;
  paid_by?: string;
  bank_account_id?: string;
  recorded_at: string;
}

// Bank Types
export enum BankAccountType {
  CHECKING = 'checking',
  SAVINGS = 'savings',
  CREDIT_CARD = 'credit_card',
  LINE_OF_CREDIT = 'line_of_credit',
}

export interface BankAccount {
  _id: string;
  account_name: string;
  bank_name: string;
  account_number: string;
  routing_number?: string;
  account_type: BankAccountType;
  currency: string;
  opening_balance: number;
  current_balance: number;
  is_active: boolean;
  gl_account_id: string;
  created_at: string;
  updated_at: string;
}

export interface BankTransaction {
  _id: string;
  bank_account_id: string;
  transaction_date: string;
  description: string;
  amount: number;
  balance: number;
  reference?: string;
  is_reconciled: boolean;
  matched_journal_entry_id?: string;
  created_at: string;
  reconciled_at?: string;
}

// Currency Types
export interface Currency {
  _id: string;
  code: string;
  name: string;
  symbol: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CurrencyRate {
  _id: string;
  base_currency: string;
  target_currency: string;
  exchange_rate: number;
  rate_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Financial Report Types
export enum ReportType {
  PROFIT_LOSS = 'profit_loss',
  BALANCE_SHEET = 'balance_sheet',
  TRIAL_BALANCE = 'trial_balance',
  GENERAL_LEDGER = 'general_ledger',
  AGING_SUMMARY = 'aging_summary',
}

export interface FinancialReport {
  report_type: ReportType;
  period_start: string;
  period_end: string;
  report_data: any;
  generated_by: string;
  generated_at: string;
}

export interface ProfitLossReport {
  revenue: {
    items: Array<{ account_code: string; account_name: string; amount: number }>;
    total: number;
  };
  expenses: {
    items: Array<{ account_code: string; account_name: string; amount: number }>;
    total: number;
  };
  net_income: number;
}

export interface BalanceSheetReport {
  assets: {
    items: Array<{ account_code: string; account_name: string; amount: number }>;
    total: number;
  };
  liabilities: {
    items: Array<{ account_code: string; account_name: string; amount: number }>;
    total: number;
  };
  equity: {
    items: Array<{ account_code: string; account_name: string; amount: number }>;
    total: number;
  };
  total_liabilities_and_equity: number;
  balanced: boolean;
}

export interface AgingReportBucket {
  invoice_number: string;
  customer_name?: string;
  vendor_name?: string;
  invoice_date: string;
  due_date: string;
  balance_due: number;
  days_overdue: number;
}

export interface AgingReport {
  report_type: string;
  generated_at: string;
  aging_buckets: {
    current: AgingReportBucket[];
    '1-30': AgingReportBucket[];
    '31-60': AgingReportBucket[];
    '61-90': AgingReportBucket[];
    '90+': AgingReportBucket[];
  };
  totals: {
    current: number;
    '1-30': number;
    '31-60': number;
    '61-90': number;
    '90+': number;
    total: number;
  };
}

