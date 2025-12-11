import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { fetchEmployees, fetchEmployeeStatistics } from '../store/hrmSlice';
import { fetchPayrolls, fetchPayrollSummary } from '../store/hrmSlice';
import { fetchLeaves } from '../store/hrmSlice';
import { fetchPerformanceReviews, fetchPerformanceAnalytics } from '../store/hrmSlice';
import { fetchAttendanceSummary } from '../store/hrmSlice';

// Icons
import {
  UsersIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  HeartIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ComponentType<any>;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon: Icon, color }) => {
  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {change !== undefined && (
            <div className="flex items-center mt-1">
              {change >= 0 ? (
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
              ) : (
                <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
              )}
              <span className={`text-sm ml-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(change)}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const HRMDashboardPage: React.FC = () => {
  const dispatch = useDispatch();
  const { employees, payroll, leave, performance, attendance } = useSelector((state: RootState) => state.hrm);
  
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    // Fetch initial data
    dispatch(fetchEmployees());
    dispatch(fetchEmployeeStatistics());
    dispatch(fetchPayrolls());
    dispatch(fetchLeaves());
    dispatch(fetchPerformanceReviews());
    dispatch(fetchPerformanceAnalytics());
  }, [dispatch]);

  useEffect(() => {
    // Fetch data for date range
    if (dateRange.start && dateRange.end) {
      dispatch(fetchPayrollSummary({
        payPeriodStart: dateRange.start,
        payPeriodEnd: dateRange.end
      }));
    }
  }, [dispatch, dateRange]);

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Calculate dashboard metrics
  const totalEmployees = employees.employees.length;
  const activeEmployees = employees.employees.filter(emp => emp.status === 'active').length;
  const newHires = employees.employees.filter(emp => {
    const startDate = new Date(emp.start_date);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return startDate >= thirtyDaysAgo;
  }).length;

  const pendingLeaves = leave.leaves.filter(l => l.status === 'pending').length;
  const approvedLeaves = leave.leaves.filter(l => l.status === 'approved').length;
  
  const totalPayrollCost = payroll.summary?.total_net_pay || 0;
  const averageSalary = payroll.summary?.average_salary || 0;

  const performanceReviews = performance.reviews.length;
  const completedReviews = performance.reviews.filter(r => r.status === 'completed').length;
  const reviewCompletionRate = performanceReviews > 0 ? (completedReviews / performanceReviews) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">HRM Dashboard</h1>
            <p className="text-gray-600 mt-1">Human Resource Management Overview</p>
          </div>
          <div className="flex space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => handleDateRangeChange('start', e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => handleDateRangeChange('end', e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Employees"
          value={totalEmployees}
          change={5.2}
          icon={UsersIcon}
          color="bg-blue-500"
        />
        <StatCard
          title="Active Employees"
          value={activeEmployees}
          change={2.1}
          icon={UserGroupIcon}
          color="bg-green-500"
        />
        <StatCard
          title="New Hires (30 days)"
          value={newHires}
          change={12.5}
          icon={ArrowTrendingUpIcon}
          color="bg-purple-500"
        />
        <StatCard
          title="Pending Leaves"
          value={pendingLeaves}
          change={-8.3}
          icon={CalendarDaysIcon}
          color="bg-yellow-500"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Payroll Cost"
          value={`$${totalPayrollCost.toLocaleString()}`}
          change={3.7}
          icon={CurrencyDollarIcon}
          color="bg-indigo-500"
        />
        <StatCard
          title="Average Salary"
          value={`$${averageSalary.toLocaleString()}`}
          change={4.2}
          icon={ChartBarIcon}
          color="bg-pink-500"
        />
        <StatCard
          title="Performance Reviews"
          value={performanceReviews}
          change={15.8}
          icon={DocumentTextIcon}
          color="bg-orange-500"
        />
        <StatCard
          title="Review Completion"
          value={`${reviewCompletionRate.toFixed(1)}%`}
          change={8.9}
          icon={AcademicCapIcon}
          color="bg-teal-500"
        />
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Breakdown */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Breakdown</h3>
          {employees.statistics?.department_breakdown ? (
            <div className="space-y-3">
              {employees.statistics.department_breakdown.map((dept: any, index: number) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">{dept._id}</span>
                  <div className="flex items-center">
                    <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${(dept.count / totalEmployees) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{dept.count}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <ChartBarIcon className="h-12 w-12 mx-auto mb-2" />
              <p>No department data available</p>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-full">
                <UsersIcon className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">New employee hired</p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <CalendarDaysIcon className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Leave request approved</p>
                <p className="text-xs text-gray-500">4 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-full">
                <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Performance review due</p>
                <p className="text-xs text-gray-500">1 day ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-full">
                <CurrencyDollarIcon className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Payroll processed</p>
                <p className="text-xs text-gray-500">2 days ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex flex-col items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <UsersIcon className="h-8 w-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Add Employee</span>
          </button>
          <button className="flex flex-col items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <CalendarDaysIcon className="h-8 w-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Request Leave</span>
          </button>
          <button className="flex flex-col items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <ClockIcon className="h-8 w-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Clock In/Out</span>
          </button>
          <button className="flex flex-col items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <DocumentTextIcon className="h-8 w-8 text-orange-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Performance Review</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HRMDashboardPage;
