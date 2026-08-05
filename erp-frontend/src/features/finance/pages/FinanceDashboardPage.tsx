import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Banknote as BanknotesIcon, 
  FileText as DocumentTextIcon, 
  CreditCard as CreditCardIcon,
  BarChart3 as ChartBarIcon,
  TrendingUp as ArrowTrendingUpIcon,
  TrendingDown as ArrowTrendingDownIcon,
} from 'lucide-react';
import { reportsApi, customerInvoicesApi, vendorInvoicesApi } from '../services/financeApi';
import { toast } from 'sonner';

export const FinanceDashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAssets: 0,
    totalLiabilities: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    netIncome: 0,
    accountsReceivable: 0,
    accountsPayable: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get current date and start of year
      const today = new Date();
      const yearStart = new Date(today.getFullYear(), 0, 1);
      
      // Fetch P&L Report
      const plResponse = await reportsApi.getProfitLoss({
        period_start: yearStart.toISOString().split('T')[0],
        period_end: today.toISOString().split('T')[0],
      });
      
      // Fetch Balance Sheet
      const bsResponse = await reportsApi.getBalanceSheet({
        as_of_date: today.toISOString().split('T')[0],
      });
      
      // Fetch AR and AP
      const arResponse = await customerInvoicesApi.getAll({ status: 'sent' as any });
      const apResponse = await vendorInvoicesApi.getAll({ status: 'pending' as any });
      
      const arTotal = arResponse.data.reduce((sum, inv) => sum + inv.balance_due, 0);
      const apTotal = apResponse.data.reduce((sum, inv) => sum + inv.balance_due, 0);
      
      setStats({
        totalAssets: bsResponse.data.assets.total,
        totalLiabilities: bsResponse.data.liabilities.total,
        totalRevenue: plResponse.data.revenue.total,
        totalExpenses: plResponse.data.expenses.total,
        netIncome: plResponse.data.net_income,
        accountsReceivable: arTotal,
        accountsPayable: apTotal,
      });
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      name: 'Total Assets',
      value: `$${stats.totalAssets.toLocaleString()}`,
      icon: BanknotesIcon,
      color: 'bg-blue-500',
      link: '/dashboard/finance/accounts',
    },
    {
      name: 'Total Liabilities',
      value: `$${stats.totalLiabilities.toLocaleString()}`,
      icon: CreditCardIcon,
      color: 'bg-red-500',
      link: '/dashboard/finance/accounts',
    },
    {
      name: 'Net Income',
      value: `$${stats.netIncome.toLocaleString()}`,
      icon: stats.netIncome >= 0 ? ArrowTrendingUpIcon : ArrowTrendingDownIcon,
      color: stats.netIncome >= 0 ? 'bg-green-500' : 'bg-red-500',
      link: '/dashboard/finance/reports',
    },
    {
      name: 'Accounts Receivable',
      value: `$${stats.accountsReceivable.toLocaleString()}`,
      icon: DocumentTextIcon,
      color: 'bg-yellow-500',
      link: '/dashboard/finance/receivables',
    },
    {
      name: 'Accounts Payable',
      value: `$${stats.accountsPayable.toLocaleString()}`,
      icon: DocumentTextIcon,
      color: 'bg-orange-500',
      link: '/dashboard/finance/payables',
    },
    {
      name: 'Revenue',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: ChartBarIcon,
      color: 'bg-green-500',
      link: '/dashboard/finance/reports',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of your financial status</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat) => (
          <Link
            key={stat.name}
            to={stat.link}
            className="bg-white rounded-lg border border-gray-200 p-6 transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg  border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/dashboard/finance/journal-entries/create"
            className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-3" />
            <span className="text-sm font-medium text-gray-700">New Journal Entry</span>
          </Link>
          <Link
            to="/dashboard/finance/receivables/create"
            className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-3" />
            <span className="text-sm font-medium text-gray-700">New Customer Invoice</span>
          </Link>
          <Link
            to="/dashboard/finance/payables/create"
            className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-3" />
            <span className="text-sm font-medium text-gray-700">New Vendor Invoice</span>
          </Link>
          <Link
            to="/dashboard/finance/reports"
            className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <ChartBarIcon className="h-5 w-5 text-gray-400 mr-3" />
            <span className="text-sm font-medium text-gray-700">Financial Reports</span>
          </Link>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Expenses */}
        <div className="bg-white rounded-lg  border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue vs Expenses (YTD)</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Revenue</span>
                <span className="font-semibold text-green-600">
                  ${stats.totalRevenue.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ 
                    width: `${(stats.totalRevenue / (stats.totalRevenue + stats.totalExpenses)) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Expenses</span>
                <span className="font-semibold text-red-600">
                  ${stats.totalExpenses.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full"
                  style={{ 
                    width: `${(stats.totalExpenses / (stats.totalRevenue + stats.totalExpenses)) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Assets vs Liabilities */}
        <div className="bg-white rounded-lg  border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Assets vs Liabilities</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Assets</span>
                <span className="font-semibold text-blue-600">
                  ${stats.totalAssets.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ 
                    width: `${(stats.totalAssets / (stats.totalAssets + stats.totalLiabilities)) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Liabilities</span>
                <span className="font-semibold text-orange-600">
                  ${stats.totalLiabilities.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full"
                  style={{ 
                    width: `${(stats.totalLiabilities / (stats.totalAssets + stats.totalLiabilities)) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

