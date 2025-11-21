import React, { useEffect } from 'react';
import { Card } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';
import { 
  HeartIcon, 
  PlusIcon
} from '@heroicons/react/24/outline';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { fetchBenefitPlans, fetchBenefitEnrollments, fetchBenefitSummary } from '../store/hrmSlice';

export const BenefitsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const benefits = useAppSelector((state) => state.hrm.benefits);

  useEffect(() => {
    dispatch(fetchBenefitPlans());
    dispatch(fetchBenefitEnrollments());
    dispatch(fetchBenefitSummary());
  }, [dispatch]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Benefits Administration</h1>
          <p className="text-gray-600">Manage employee benefits and insurance plans</p>
        </div>
        <Button className="flex items-center gap-2">
          <PlusIcon className="h-4 w-4" />
          New Benefit Plan
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <HeartIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Plans</p>
              <p className="text-2xl font-semibold text-gray-900">{benefits.active_plans ?? benefits.summary?.active_plans ?? 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <HeartIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Enrolled</p>
              <p className="text-2xl font-semibold text-gray-900">{benefits.summary?.total_enrollments ?? 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <HeartIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-semibold text-gray-900">
                {(benefits.enrollments || []).filter((e: any) => e.status === 'pending').length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <HeartIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Coverage</p>
              <p className="text-2xl font-semibold text-gray-900">
                {benefits.summary && benefits.summary.total_enrollments && (benefits.summary.active_enrollments !== undefined)
                  ? `${Math.round((benefits.summary.active_enrollments / Math.max(1, benefits.summary.total_enrollments)) * 100)}%`
                  : '0%'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Benefit Plans Table */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Benefit Plans</h3>
        </div>
        <div className="overflow-x-auto">
          {benefits.loading ? (
            <div className="px-6 py-4 text-center text-gray-500">Loading...</div>
          ) : benefits.error ? (
            <div className="px-6 py-4 text-center text-red-600">Error: {benefits.error}</div>
          ) : benefits.plans.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <HeartIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p>No benefit plans found</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coverage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {benefits.plans.map((plan: any) => (
                  <tr key={plan.id || plan._id || plan.plan_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{plan.name || plan.plan_name}</div>
                      <div className="text-sm text-gray-500">{plan.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{plan.category || plan.benefit_type || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${(plan.cost_employee || plan.employee_contribution || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${(plan.cost_company || plan.employer_contribution || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{plan.coverage_percentage || 0}%</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        plan.status === 'active' || plan.status === 'Active' ? 'bg-green-100 text-green-800' :
                        plan.status === 'pending' || plan.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {plan.status || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button variant="outline" size="sm">View</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
};

export default BenefitsPage;