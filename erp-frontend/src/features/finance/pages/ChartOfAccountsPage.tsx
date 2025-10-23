import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus as PlusIcon, Filter as FunnelIcon } from 'lucide-react';
import { accountsApi } from '../services/financeApi';
import { Account, AccountType } from '../types';
import { toast } from 'sonner';

export const ChartOfAccountsPage: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<AccountType | 'all'>('all');

  useEffect(() => {
    loadAccounts();
  }, [filter]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { account_type: filter } : {};
      const response = await accountsApi.getAll(params);
      setAccounts(response.data);
    } catch (error) {
      console.error('Error loading accounts:', error);
      toast.error('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const getAccountTypeColor = (type: AccountType) => {
    const colors = {
      [AccountType.ASSET]: 'bg-blue-100 text-blue-800',
      [AccountType.LIABILITY]: 'bg-red-100 text-red-800',
      [AccountType.EQUITY]: 'bg-purple-100 text-purple-800',
      [AccountType.REVENUE]: 'bg-green-100 text-green-800',
      [AccountType.EXPENSE]: 'bg-orange-100 text-orange-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const formatBalance = (account: Account) => {
    const amount = Math.abs(account.balance);
    const sign = account.balance >= 0 ? '' : '-';
    return `${sign}$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chart of Accounts</h1>
          <p className="text-gray-600 mt-1">Manage your accounting structure</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => accountsApi.seedDefaults().then(() => {
              toast.success('Default accounts seeded');
              loadAccounts();
            })}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Seed Defaults
          </button>
          <Link
            to="/dashboard/finance/accounts/create"
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Account
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as AccountType | 'all')}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">All Types</option>
            <option value={AccountType.ASSET}>Assets</option>
            <option value={AccountType.LIABILITY}>Liabilities</option>
            <option value={AccountType.EQUITY}>Equity</option>
            <option value={AccountType.REVENUE}>Revenue</option>
            <option value={AccountType.EXPENSE}>Expenses</option>
          </select>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No accounts found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Account Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Normal Balance
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {accounts.map((account) => (
                  <tr key={account._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {account.account_code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {account.parent_account && (
                          <span className="text-gray-400 mr-2">└─</span>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {account.account_name}
                          </div>
                          {account.description && (
                            <div className="text-sm text-gray-500">{account.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAccountTypeColor(account.account_type)}`}>
                        {account.account_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {account.normal_balance}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                      {formatBalance(account)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {account.is_active ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          Inactive
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

