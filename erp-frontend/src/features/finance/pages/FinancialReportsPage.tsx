import React, { useState } from 'react';
import { BarChart3 as DocumentChartBarIcon, FileText as DocumentTextIcon, Scale as ScaleIcon } from 'lucide-react';
import { reportsApi } from '../services/financeApi';
import { ProfitLossReport, BalanceSheetReport } from '../types';
import { toast } from 'sonner';

export const FinancialReportsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState<'pl' | 'bs' | 'tb' | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const generateReport = async (type: 'pl' | 'bs' | 'tb') => {
    try {
      setLoading(true);
      setReportType(type);
      
      let response;
      switch (type) {
        case 'pl':
          response = await reportsApi.getProfitLoss({
            period_start: startDate,
            period_end: endDate,
          });
          break;
        case 'bs':
          response = await reportsApi.getBalanceSheet({
            as_of_date: endDate,
          });
          break;
        case 'tb':
          response = await reportsApi.getTrialBalance({
            as_of_date: endDate,
          });
          break;
      }
      
      setReportData(response.data);
      toast.success('Report generated successfully');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const renderProfitLoss = (data: ProfitLossReport) => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Profit & Loss Statement</h2>
        <p className="text-gray-600">
          For the period: {startDate} to {endDate}
        </p>
      </div>

      {/* Revenue */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Revenue</h3>
        <div className="space-y-2">
          {data.revenue.items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span className="text-gray-700">{item.account_name}</span>
              <span className="font-medium">${item.amount.toLocaleString()}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm font-semibold border-t pt-2">
            <span>Total Revenue</span>
            <span className="text-green-600">${data.revenue.total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Expenses */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Expenses</h3>
        <div className="space-y-2">
          {data.expenses.items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span className="text-gray-700">{item.account_name}</span>
              <span className="font-medium">${item.amount.toLocaleString()}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm font-semibold border-t pt-2">
            <span>Total Expenses</span>
            <span className="text-red-600">${data.expenses.total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Net Income */}
      <div className="border-t-2 border-gray-300 pt-4">
        <div className="flex justify-between text-lg font-bold">
          <span>Net Income</span>
          <span className={data.net_income >= 0 ? 'text-green-600' : 'text-red-600'}>
            ${Math.abs(data.net_income).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );

  const renderBalanceSheet = (data: BalanceSheetReport) => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Balance Sheet</h2>
        <p className="text-gray-600">As of {endDate}</p>
      </div>

      {/* Assets */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Assets</h3>
        <div className="space-y-2">
          {data.assets.items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span className="text-gray-700">{item.account_name}</span>
              <span className="font-medium">${item.amount.toLocaleString()}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm font-semibold border-t pt-2">
            <span>Total Assets</span>
            <span className="text-blue-600">${data.assets.total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Liabilities */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Liabilities</h3>
        <div className="space-y-2">
          {data.liabilities.items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span className="text-gray-700">{item.account_name}</span>
              <span className="font-medium">${item.amount.toLocaleString()}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm font-semibold border-t pt-2">
            <span>Total Liabilities</span>
            <span className="text-red-600">${data.liabilities.total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Equity */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Equity</h3>
        <div className="space-y-2">
          {data.equity.items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span className="text-gray-700">{item.account_name}</span>
              <span className="font-medium">${item.amount.toLocaleString()}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm font-semibold border-t pt-2">
            <span>Total Equity</span>
            <span className="text-purple-600">${data.equity.total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Total */}
      <div className="border-t-2 border-gray-300 pt-4">
        <div className="flex justify-between text-lg font-bold">
          <span>Total Liabilities & Equity</span>
          <span className="text-gray-900">${data.total_liabilities_and_equity.toLocaleString()}</span>
        </div>
        {data.balanced && (
          <p className="text-sm text-green-600 mt-2 text-center">✓ Balanced</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
        <p className="text-gray-600 mt-1">Generate and view financial statements</p>
      </div>

      {/* Date Range */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
        </div>
      </div>

      {/* Report Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => generateReport('pl')}
          disabled={loading}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow disabled:opacity-50"
        >
          <DocumentChartBarIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Profit & Loss</h3>
          <p className="text-sm text-gray-600">Income statement showing revenue and expenses</p>
        </button>

        <button
          onClick={() => generateReport('bs')}
          disabled={loading}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow disabled:opacity-50"
        >
          <ScaleIcon className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Balance Sheet</h3>
          <p className="text-sm text-gray-600">Assets, liabilities, and equity snapshot</p>
        </button>

        <button
          onClick={() => generateReport('tb')}
          disabled={loading}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow disabled:opacity-50"
        >
          <DocumentTextIcon className="h-12 w-12 text-purple-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Trial Balance</h3>
          <p className="text-sm text-gray-600">Verify debits equal credits</p>
        </button>
      </div>

      {/* Report Display */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {!loading && reportData && reportType && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {reportType === 'pl' && renderProfitLoss(reportData)}
          {reportType === 'bs' && renderBalanceSheet(reportData)}
          {reportType === 'tb' && (
            <div className="text-center">
              <pre className="text-left text-sm">{JSON.stringify(reportData, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

