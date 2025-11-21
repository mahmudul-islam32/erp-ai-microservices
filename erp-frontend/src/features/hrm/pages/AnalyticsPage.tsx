import React, { useEffect } from 'react';
import { Card } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';
import { 
  ChartBarIcon, 
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { fetchHRDashboard } from '../store/hrmSlice';

export const AnalyticsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const dashboard = useAppSelector((state) => state.hrm.dashboard);
  const loading = useAppSelector((state) => state.hrm.loading);
  const error = useAppSelector((state) => state.hrm.error);

  useEffect(() => {
    dispatch(fetchHRDashboard({ period_days: 30 }));
  }, [dispatch]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">HR Analytics</h1>
          <p className="text-gray-600">Insights and metrics for human resources</p>
        </div>
        <Button className="flex items-center gap-2">
          <ChartBarIcon className="h-4 w-4" />
          Generate Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserGroupIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Employees</p>
              <p className="text-2xl font-semibold text-gray-900">{dashboard?.total_employees ?? 0}</p>
              <div className="flex items-center mt-1">
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">+5%</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Satisfaction</p>
              <p className="text-2xl font-semibold text-gray-900">{dashboard ? `${(dashboard.average_satisfaction ?? 0).toFixed(1)}/5` : '0/5'}</p>
              <div className="flex items-center mt-1">
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">+0.3</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Turnover Rate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {dashboard ? `${Math.round((dashboard.turnover_rate ?? 0) * 100)}%` : '0%'}
              </p>
              <div className="flex items-center mt-1">
                <ArrowTrendingDownIcon className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">-2%</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg. Tenure</p>
              <p className="text-2xl font-semibold text-gray-900">{dashboard ? `${(dashboard.average_performance ?? 0).toFixed(1)}` : '0.0'}</p>
              <div className="flex items-center mt-1">
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">+0.5y</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">New Hires</p>
              <p className="text-2xl font-semibold text-gray-900">{dashboard?.new_hires ?? 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Terminations</p>
              <p className="text-2xl font-semibold text-gray-900">{dashboard?.terminations ?? 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {dashboard ? `${(dashboard.attendance_rate * 100).toFixed(1)}%` : '0%'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Training Completion</p>
              <p className="text-2xl font-semibold text-gray-900">
                {dashboard ? `${(dashboard.training_completion_rate * 100).toFixed(1)}%` : '0%'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Recruitment Efficiency</p>
              <p className="text-2xl font-semibold text-gray-900">{dashboard?.recruitment_efficiency?.toFixed(1) ?? 0}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-pink-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-pink-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Payroll Cost</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${dashboard?.total_payroll_cost?.toLocaleString() ?? '0'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Key Metrics and Trends */}
      {dashboard && (dashboard.key_metrics || dashboard.trends) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {dashboard.key_metrics && dashboard.key_metrics.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Metrics</h3>
              <div className="space-y-3">
                {dashboard.key_metrics.map((metric: any, index: number) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{metric.name}</span>
                    <div className="flex items-center">
                      <span className="text-sm font-semibold text-gray-900 mr-2">{metric.value}</span>
                      {metric.trend === 'up' ? (
                        <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
                      ) : (
                        <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {dashboard.trends && dashboard.trends.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Trends</h3>
              <div className="space-y-3">
                {dashboard.trends.map((trend: any, index: number) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{trend.metric}</span>
                    <div className="flex items-center">
                      <span className="text-sm font-semibold text-gray-900 mr-2">{trend.value.toFixed(2)}</span>
                      {trend.change >= 0 ? (
                        <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
                      ) : (
                        <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
                      )}
                      <span className={`text-xs ml-1 ${trend.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {trend.change >= 0 ? '+' : ''}{trend.change.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <Card className="p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics data...</p>
          </div>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="p-6">
          <div className="text-center py-12">
            <ChartBarIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Analytics</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => dispatch(fetchHRDashboard({ period_days: 30 }))}>Retry</Button>
          </div>
        </Card>
      )}

      {/* No Data State */}
      {!loading && !error && !dashboard && (
        <Card className="p-6">
          <div className="text-center py-12">
            <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</h3>
            <p className="text-gray-600 mb-4">
              No analytics data available for the selected period.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AnalyticsPage;